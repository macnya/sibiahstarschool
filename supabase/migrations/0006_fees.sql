-- =====================================================================
-- Fees: terms, fee structures, invoices, payments, bursaries, M-Pesa
-- Run once in the Supabase SQL Editor, after 0005.
--
-- Principles
--   * Money is stored in cents (KES x 100), as integers.
--   * A student's balance = invoices (open) + adjustments - payments (confirmed).
--     Positive balance = the family owes; negative = prepaid / credit.
--   * Nobody writes payments, invoices or ledger rows directly. Staff use the
--     SECURITY DEFINER functions below, which check permission and campus.
--   * M-Pesa confirmations are recorded by a server-only function, idempotently
--     (the same M-Pesa transaction can never be counted twice).
-- =====================================================================

-- Staff helper: any admin (group or campus level)
create function public.is_staff_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_staff_admin() to anon, authenticated;

-- Where to pay (shown to families)
alter table public.campuses
  add column paybill_number text check (char_length(paybill_number) <= 20),
  add column till_number text check (char_length(till_number) <= 20),
  add column payment_instructions text check (char_length(payment_instructions) <= 600);

-- ---------------------------------------------------------------------
-- Terms (shared by every campus in the group)
-- ---------------------------------------------------------------------
create table public.terms (
  id         uuid primary key default gen_random_uuid(),
  year       integer not null check (year between 2000 and 2100),
  number     smallint not null check (number between 1 and 3),
  name       text not null,
  start_date date,
  end_date   date,
  due_date   date,
  is_current boolean not null default false,
  unique (year, number)
);
create unique index terms_one_current on public.terms (is_current) where is_current;

-- ---------------------------------------------------------------------
-- Fee items + structures (per campus, year, class and term)
-- ---------------------------------------------------------------------
create table public.fee_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 80),
  kind        text not null default 'other'
                check (kind in ('tuition', 'transport', 'meals', 'activity', 'exam', 'admission', 'other')),
  is_optional boolean not null default false,
  is_active   boolean not null default true,
  sort_order  integer not null default 0
);

create table public.fee_structures (
  id           uuid primary key default gen_random_uuid(),
  campus_id    uuid not null references public.campuses (id) on delete cascade,
  year         integer not null check (year between 2000 and 2100),
  grade_id     uuid not null references public.grade_levels (id) on delete cascade,
  term_number  smallint not null check (term_number between 1 and 3),
  fee_item_id  uuid not null references public.fee_items (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  unique (campus_id, year, grade_id, term_number, fee_item_id)
);

-- Optional fees a particular child takes (transport, lunch ...)
create table public.student_fee_subscriptions (
  student_id  uuid not null references public.students (id) on delete cascade,
  fee_item_id uuid not null references public.fee_items (id) on delete cascade,
  primary key (student_id, fee_item_id)
);

-- ---------------------------------------------------------------------
-- Invoices, payments, adjustments
-- ---------------------------------------------------------------------
create table public.invoices (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,
  student_id  uuid not null references public.students (id) on delete restrict,
  campus_id   uuid not null references public.campuses (id),
  year        integer not null,
  term_number smallint not null check (term_number between 1 and 3),
  status      text not null default 'open' check (status in ('open', 'cancelled')),
  total_cents integer not null check (total_cents >= 0),
  due_date    date,
  notes       text,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create unique index invoices_one_open_per_term on public.invoices (student_id, year, term_number) where status = 'open';

create table public.invoice_lines (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices (id) on delete cascade,
  fee_item_id  uuid references public.fee_items (id) on delete set null,
  description  text not null,
  amount_cents integer not null check (amount_cents >= 0)
);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  receipt_number  text not null unique,
  student_id      uuid not null references public.students (id) on delete restrict,
  campus_id       uuid not null references public.campuses (id),
  amount_cents    integer not null check (amount_cents > 0),
  method          text not null check (method in ('mpesa', 'cash', 'cheque', 'bank', 'other')),
  reference       text check (char_length(reference) <= 60),
  payer_name      text check (char_length(payer_name) <= 120),
  payer_phone     text check (char_length(payer_phone) <= 40),
  source          text not null default 'staff' check (source in ('staff', 'mpesa_c2b', 'mpesa_stk')),
  status          text not null default 'confirmed' check (status in ('confirmed', 'reversed')),
  received_on     date not null default current_date,
  notes           text check (char_length(notes) <= 500),
  recorded_by     uuid references auth.users (id) on delete set null,
  reversed_by     uuid references auth.users (id) on delete set null,
  reversed_at     timestamptz,
  reversal_reason text,
  created_at      timestamptz not null default now()
);
-- The same bank slip / cheque / M-Pesa code can only be counted once.
create unique index payments_unique_reference
  on public.payments (method, upper(reference)) where reference is not null and status = 'confirmed';
create index payments_student_idx on public.payments (student_id);
create index payments_campus_date_idx on public.payments (campus_id, received_on desc);

create table public.fee_adjustments (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students (id) on delete restrict,
  campus_id    uuid not null references public.campuses (id),
  kind         text not null check (kind in ('bursary', 'discount', 'waiver', 'scholarship',
                                             'penalty', 'opening_balance', 'refund', 'correction')),
  -- effect on what the family owes: positive = owes more, negative = owes less
  amount_cents integer not null check (amount_cents <> 0),
  description  text not null check (char_length(description) between 2 and 300),
  year         integer,
  term_number  smallint check (term_number between 1 and 3),
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index fee_adjustments_student_idx on public.fee_adjustments (student_id);
create index invoices_student_idx on public.invoices (student_id);

-- ---------------------------------------------------------------------
-- M-Pesa
-- ---------------------------------------------------------------------
create table public.mpesa_transactions (
  id           uuid primary key default gen_random_uuid(),
  trans_id     text not null unique,
  trans_time   timestamptz,
  amount_cents integer not null check (amount_cents > 0),
  msisdn       text,
  bill_ref     text,
  payer_name   text,
  shortcode    text,
  campus_id    uuid references public.campuses (id) on delete set null,
  status       text not null default 'unmatched' check (status in ('matched', 'unmatched', 'ignored')),
  student_id   uuid references public.students (id) on delete set null,
  payment_id   uuid references public.payments (id) on delete set null,
  raw          jsonb,
  created_at   timestamptz not null default now()
);
create index mpesa_transactions_status_idx on public.mpesa_transactions (status, created_at desc);

create table public.mpesa_stk_requests (
  id                  uuid primary key default gen_random_uuid(),
  checkout_request_id text unique,
  merchant_request_id text,
  student_id          uuid not null references public.students (id) on delete cascade,
  campus_id           uuid not null references public.campuses (id),
  amount_cents        integer not null check (amount_cents > 0),
  phone               text not null,
  status              text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  result_desc         text,
  mpesa_receipt       text,
  payment_id          uuid references public.payments (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger mpesa_stk_requests_touch before update on public.mpesa_stk_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Balances
-- ---------------------------------------------------------------------
create function public._balance(p_student uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce((select sum(total_cents) from public.invoices where student_id = p_student and status = 'open'), 0)
       + coalesce((select sum(amount_cents) from public.fee_adjustments where student_id = p_student), 0)
       - coalesce((select sum(amount_cents) from public.payments where student_id = p_student and status = 'confirmed'), 0);
$$;
revoke all on function public._balance(uuid) from public, anon, authenticated;

create view public.student_balances with (security_invoker = true) as
select s.id as student_id, s.campus_id, s.grade_id, s.admission_number,
       s.first_name, s.middle_name, s.last_name, s.guardian_name, s.guardian_phone, s.status,
       coalesce(i.total, 0)::bigint as invoiced,
       coalesce(a.total, 0)::bigint as adjustments,
       coalesce(p.total, 0)::bigint as paid,
       (coalesce(i.total, 0) + coalesce(a.total, 0) - coalesce(p.total, 0))::bigint as balance
  from public.students s
  left join (select student_id, sum(total_cents) as total from public.invoices where status = 'open' group by 1) i on i.student_id = s.id
  left join (select student_id, sum(amount_cents) as total from public.fee_adjustments group by 1) a on a.student_id = s.id
  left join (select student_id, sum(amount_cents) as total from public.payments where status = 'confirmed' group by 1) p on p.student_id = s.id;

-- ---------------------------------------------------------------------
-- Invoicing
-- ---------------------------------------------------------------------
create function public._invoice_student(p_student uuid, p_year integer, p_term smallint, p_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s       public.students%rowtype;
  v_code  text;
  v_due   date;
  v_total integer;
  v_lines integer;
  v_id    uuid;
  v_seq   integer;
begin
  select * into s from public.students where id = p_student;
  if not found then return null; end if;
  if exists (select 1 from public.invoices
              where student_id = s.id and year = p_year and term_number = p_term and status = 'open') then
    return null;
  end if;

  select count(*), coalesce(sum(fs.amount_cents), 0) into v_lines, v_total
    from public.fee_structures fs
    join public.fee_items fi on fi.id = fs.fee_item_id
   where fs.campus_id = s.campus_id and fs.year = p_year and fs.grade_id = s.grade_id
     and fs.term_number = p_term and fi.is_active
     and (not fi.is_optional or exists (
           select 1 from public.student_fee_subscriptions ss where ss.student_id = s.id and ss.fee_item_id = fi.id));
  if v_lines = 0 then return null; end if;

  select code into v_code from public.campuses where id = s.campus_id;
  select due_date into v_due from public.terms where year = p_year and number = p_term;
  v_seq := public.next_number(s.campus_id, 'invoice', p_year);

  insert into public.invoices (number, student_id, campus_id, year, term_number, total_cents, due_date, created_by)
  values ('INV-' || v_code || '-' || p_year || '-' || lpad(v_seq::text, 4, '0'),
          s.id, s.campus_id, p_year, p_term, v_total, v_due, p_user)
  returning id into v_id;

  insert into public.invoice_lines (invoice_id, fee_item_id, description, amount_cents)
  select v_id, fi.id, fi.name, fs.amount_cents
    from public.fee_structures fs
    join public.fee_items fi on fi.id = fs.fee_item_id
   where fs.campus_id = s.campus_id and fs.year = p_year and fs.grade_id = s.grade_id
     and fs.term_number = p_term and fi.is_active
     and (not fi.is_optional or exists (
           select 1 from public.student_fee_subscriptions ss where ss.student_id = s.id and ss.fee_item_id = fi.id))
   order by fi.sort_order, fi.name;

  return v_id;
exception when unique_violation then
  return null;   -- another request just created it
end;
$$;
revoke all on function public._invoice_student(uuid, integer, smallint, uuid) from public, anon, authenticated;

-- Staff: raise invoices for a whole campus (optionally one class) for a term.
create function public.generate_invoices(p_campus uuid, p_year integer, p_term smallint, p_grade uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_created integer := 0;
  v_skipped integer := 0;
  v_id uuid;
begin
  if not public.can_manage_campus(p_campus) then
    raise exception 'You do not have permission to invoice this school.';
  end if;
  for r in
    select id from public.students
     where campus_id = p_campus and status = 'active' and (p_grade is null or grade_id = p_grade)
  loop
    v_id := public._invoice_student(r.id, p_year, p_term, auth.uid());
    if v_id is null then v_skipped := v_skipped + 1; else v_created := v_created + 1; end if;
  end loop;
  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

create function public.cancel_invoice(p_invoice uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare i public.invoices%rowtype;
begin
  select * into i from public.invoices where id = p_invoice for update;
  if not found then raise exception 'Invoice not found.'; end if;
  if not public.can_manage_campus(i.campus_id) then raise exception 'You do not have permission to cancel this invoice.'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'Please give a reason.'; end if;
  update public.invoices set status = 'cancelled', notes = trim(p_reason) where id = i.id;
end;
$$;

-- ---------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------
create function public._insert_payment(
  p_student uuid, p_amount integer, p_method text, p_reference text, p_payer_name text,
  p_payer_phone text, p_received_on date, p_source text, p_notes text, p_user uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  s public.students%rowtype;
  v_code text;
  v_seq integer;
  v_id uuid;
begin
  select * into s from public.students where id = p_student;
  if not found then raise exception 'Student not found.'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter an amount above zero.'; end if;
  if p_amount > 100000000 then raise exception 'That amount is too large. Please check it.'; end if;
  if p_method not in ('mpesa', 'cash', 'cheque', 'bank', 'other') then raise exception 'Choose a payment method.'; end if;
  if p_method in ('mpesa', 'cheque', 'bank') and char_length(trim(coalesce(p_reference, ''))) < 3 then
    raise exception 'Enter the %.', case p_method when 'mpesa' then 'M-Pesa transaction code'
                                                   when 'cheque' then 'cheque number' else 'bank reference' end;
  end if;

  select code into v_code from public.campuses where id = s.campus_id;
  v_seq := public.next_number(s.campus_id, 'receipt', extract(year from current_date)::integer);

  insert into public.payments (
    receipt_number, student_id, campus_id, amount_cents, method, reference, payer_name, payer_phone,
    source, received_on, notes, recorded_by
  ) values (
    'RCT-' || v_code || '-' || extract(year from current_date)::integer || '-' || lpad(v_seq::text, 5, '0'),
    s.id, s.campus_id, p_amount, p_method, nullif(trim(p_reference), ''), nullif(trim(p_payer_name), ''),
    nullif(trim(p_payer_phone), ''), p_source, coalesce(p_received_on, current_date), nullif(trim(p_notes), ''), p_user
  ) returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'That reference has already been recorded as a payment.';
end;
$$;
revoke all on function public._insert_payment(uuid, integer, text, text, text, text, date, text, text, uuid) from public, anon, authenticated;

create function public.record_payment(
  p_student uuid, p_amount_cents integer, p_method text, p_reference text default null,
  p_payer_name text default null, p_payer_phone text default null,
  p_received_on date default null, p_notes text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_campus uuid;
begin
  select campus_id into v_campus from public.students where id = p_student;
  if v_campus is null then raise exception 'Student not found.'; end if;
  if not public.can_manage_campus(v_campus) then
    raise exception 'You do not have permission to record payments for this school.';
  end if;
  if p_received_on is not null and (p_received_on > current_date or p_received_on < current_date - 400) then
    raise exception 'Please check the date received.';
  end if;
  return public._insert_payment(p_student, p_amount_cents, p_method, p_reference, p_payer_name,
                                p_payer_phone, p_received_on, 'staff', p_notes, auth.uid());
end;
$$;

-- Reversing a payment is a group-level decision (separation of duties).
create function public.reverse_payment(p_payment uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_admin() then raise exception 'Only a group administrator can reverse a payment.'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'Please explain why the payment is being reversed.'; end if;
  update public.payments
     set status = 'reversed', reversed_by = auth.uid(), reversed_at = now(), reversal_reason = trim(p_reason)
   where id = p_payment and status = 'confirmed';
  if not found then raise exception 'Payment not found, or already reversed.'; end if;
end;
$$;

create function public.post_fee_adjustment(
  p_student uuid, p_kind text, p_amount_cents integer, p_description text,
  p_year integer default null, p_term smallint default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_campus uuid;
  v_amount integer;
  v_id uuid;
begin
  select campus_id into v_campus from public.students where id = p_student;
  if v_campus is null then raise exception 'Student not found.'; end if;
  if not public.can_manage_campus(v_campus) then raise exception 'You do not have permission for this school.'; end if;
  if p_amount_cents is null or p_amount_cents = 0 then raise exception 'Enter an amount.'; end if;
  if abs(p_amount_cents) > 100000000 then raise exception 'That amount is too large. Please check it.'; end if;

  -- Bursaries/discounts reduce what is owed; penalties and refunds increase it.
  v_amount := case
    when p_kind in ('bursary', 'discount', 'waiver', 'scholarship') then -abs(p_amount_cents)
    when p_kind in ('penalty', 'refund') then abs(p_amount_cents)
    when p_kind in ('opening_balance', 'correction') then p_amount_cents
    else null end;
  if v_amount is null then raise exception 'Choose the type of adjustment.'; end if;

  insert into public.fee_adjustments (student_id, campus_id, kind, amount_cents, description, year, term_number, created_by)
  values (p_student, v_campus, p_kind, v_amount, trim(p_description), p_year, p_term, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Admission numbers as parents type them: "sss 2027 1", "SSS-2027-001" ...
-- ---------------------------------------------------------------------
create function public._normalize_admission(p text)
returns text language plpgsql immutable as $$
declare
  t text := upper(trim(coalesce(p, '')));
  m text[];
begin
  m := regexp_match(t, '^([A-Z]{2,6})[\s/\-_.]*(\d{4})[\s/\-_.]*(\d{1,6})$');
  if m is not null then
    return m[1] || '/' || m[2] || '/' || lpad(m[3], 3, '0');
  end if;
  return t;
end;
$$;

-- ---------------------------------------------------------------------
-- Public: a family looks up their child's fee account
-- (admission number + the guardian phone number on file)
-- ---------------------------------------------------------------------
create function public.get_fee_account(p_admission_number text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s        public.students%rowtype;
  v_digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
  c        public.campuses%rowtype;
  v_entries jsonb;
begin
  if char_length(v_digits) < 7 then perform pg_sleep(0.4); return null; end if;

  select * into s from public.students
   where admission_number = public._normalize_admission(p_admission_number)
     and right(regexp_replace(guardian_phone, '\D', '', 'g'), 9) = v_digits;
  if not found then perform pg_sleep(0.4); return null; end if;

  select * into c from public.campuses where id = s.campus_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'date', e.d, 'type', e.type, 'description', e.description,
           'amount_cents', e.amount, 'balance_cents', e.running) order by e.ts desc, e.ord desc), '[]'::jsonb)
    into v_entries
    from (
      select x.*, sum(x.amount) over (order by x.ts, x.ord) as running
        from (
          select i.created_at::date as d, i.created_at as ts, 1 as ord, 'invoice' as type,
                 'Invoice ' || i.number || ' (Term ' || i.term_number || ' ' || i.year || ')' as description,
                 i.total_cents::bigint as amount
            from public.invoices i where i.student_id = s.id and i.status = 'open'
          union all
          select a.created_at::date, a.created_at, 2, a.kind, a.description, a.amount_cents::bigint
            from public.fee_adjustments a where a.student_id = s.id
          union all
          select p.received_on, p.created_at, 3, 'payment',
                 'Payment ' || p.receipt_number || ' (' || p.method || ')', -p.amount_cents::bigint
            from public.payments p where p.student_id = s.id and p.status = 'confirmed'
        ) x
    ) e;

  return jsonb_build_object(
    'student_id', s.id,
    'admission_number', s.admission_number,
    'student_name', s.first_name || ' ' || s.last_name,
    'campus_name', c.name,
    'campus_code', c.code,
    'paybill_number', c.paybill_number,
    'till_number', c.till_number,
    'payment_instructions', c.payment_instructions,
    'balance_cents', public._balance(s.id),
    'entries', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select jsonb_array_elements(v_entries) x limit 40) t)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- M-Pesa: server-only functions (called with the service-role key)
-- ---------------------------------------------------------------------
create function public.mpesa_record_c2b(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_trans   text := nullif(trim(p ->> 'TransID'), '');
  v_amount  integer := round((nullif(p ->> 'TransAmount', '')::numeric) * 100);
  v_ref     text := nullif(trim(p ->> 'BillRefNumber'), '');
  v_short   text := nullif(trim(p ->> 'BusinessShortCode'), '');
  v_time    timestamptz;
  v_student public.students%rowtype;
  v_campus  uuid;
  v_payment uuid;
  v_name    text := nullif(trim(concat_ws(' ', p ->> 'FirstName', p ->> 'MiddleName', p ->> 'LastName')), '');
  v_row     uuid;
  v_receipt text;
begin
  if v_trans is null or v_amount is null or v_amount <= 0 then
    raise exception 'Invalid M-Pesa notification.';
  end if;
  begin
    -- Safaricom sends Nairobi wall-clock digits; read them as exactly that, whatever the server timezone is.
    v_time := (to_timestamp(p ->> 'TransTime', 'YYYYMMDDHH24MISS')::timestamp) at time zone 'Africa/Nairobi';
  exception when others then v_time := now();
  end;

  select id into v_campus from public.campuses where paybill_number = v_short or till_number = v_short limit 1;
  select * into v_student from public.students where admission_number = public._normalize_admission(v_ref);

  insert into public.mpesa_transactions (trans_id, trans_time, amount_cents, msisdn, bill_ref, payer_name, shortcode, campus_id, raw)
  values (v_trans, v_time, v_amount, p ->> 'MSISDN', v_ref, v_name, v_short, coalesce(v_student.campus_id, v_campus), p)
  on conflict (trans_id) do nothing
  returning id into v_row;

  if v_row is null then
    return jsonb_build_object('status', 'duplicate');
  end if;

  if v_student.id is not null then
    v_payment := public._insert_payment(v_student.id, v_amount, 'mpesa', v_trans, v_name, p ->> 'MSISDN',
                                        (v_time at time zone 'Africa/Nairobi')::date, 'mpesa_c2b',
                                        'Paybill account: ' || coalesce(v_ref, ''), null);
    update public.mpesa_transactions set status = 'matched', student_id = v_student.id, payment_id = v_payment where id = v_row;
    select receipt_number into v_receipt from public.payments where id = v_payment;
    return jsonb_build_object('status', 'matched', 'receipt', v_receipt);
  end if;
  return jsonb_build_object('status', 'unmatched');
end;
$$;

-- Staff: put an unmatched M-Pesa payment on the right child's account.
create function public.mpesa_assign_transaction(p_transaction uuid, p_student uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  t public.mpesa_transactions%rowtype;
  s public.students%rowtype;
  v_payment uuid;
begin
  select * into t from public.mpesa_transactions where id = p_transaction for update;
  if not found then raise exception 'Transaction not found.'; end if;
  select * into s from public.students where id = p_student;
  if not found then raise exception 'Student not found.'; end if;
  if not public.can_manage_campus(s.campus_id) then raise exception 'You do not have permission for this school.'; end if;
  if t.campus_id is not null and not public.can_manage_campus(t.campus_id) then
    raise exception 'This transaction belongs to another school.';
  end if;
  if t.status <> 'unmatched' then raise exception 'This transaction has already been handled.'; end if;

  v_payment := public._insert_payment(s.id, t.amount_cents, 'mpesa', t.trans_id, t.payer_name, t.msisdn,
                                      (t.trans_time at time zone 'Africa/Nairobi')::date, 'mpesa_c2b',
                                      'Assigned manually from account "' || coalesce(t.bill_ref, '') || '"', auth.uid());
  update public.mpesa_transactions
     set status = 'matched', student_id = s.id, campus_id = s.campus_id, payment_id = v_payment
   where id = t.id;
  return v_payment;
end;
$$;

create function public.mpesa_ignore_transaction(p_transaction uuid)
returns void language plpgsql security definer set search_path = public as $$
declare t public.mpesa_transactions%rowtype;
begin
  select * into t from public.mpesa_transactions where id = p_transaction for update;
  if not found then raise exception 'Transaction not found.'; end if;
  if not (public.is_group_admin() or (t.campus_id is not null and public.can_manage_campus(t.campus_id))) then
    raise exception 'You do not have permission for this transaction.';
  end if;
  if t.status <> 'unmatched' then raise exception 'This transaction has already been handled.'; end if;
  update public.mpesa_transactions set status = 'ignored' where id = t.id;
end;
$$;

-- Called when the parent's phone prompt (STK push) succeeds or fails.
create function public.mpesa_stk_complete(p_checkout text, p_success boolean, p_receipt text, p_amount_cents integer, p_desc text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r public.mpesa_stk_requests%rowtype;
  v_payment uuid;
begin
  select * into r from public.mpesa_stk_requests where checkout_request_id = p_checkout for update;
  if not found then return jsonb_build_object('status', 'unknown'); end if;
  if r.status <> 'pending' then return jsonb_build_object('status', r.status); end if;

  if not p_success then
    update public.mpesa_stk_requests set status = 'failed', result_desc = left(p_desc, 200) where id = r.id;
    return jsonb_build_object('status', 'failed');
  end if;

  -- The same M-Pesa receipt may also arrive as a Paybill/Till notification: record it once only.
  if exists (select 1 from public.payments where method = 'mpesa' and upper(reference) = upper(p_receipt) and status = 'confirmed') then
    update public.mpesa_stk_requests set status = 'paid', mpesa_receipt = p_receipt, result_desc = 'Already recorded' where id = r.id;
    return jsonb_build_object('status', 'paid');
  end if;

  v_payment := public._insert_payment(r.student_id, coalesce(p_amount_cents, r.amount_cents), 'mpesa', p_receipt,
                                      null, r.phone, current_date, 'mpesa_stk', 'Paid by phone prompt', null);
  update public.mpesa_stk_requests
     set status = 'paid', mpesa_receipt = p_receipt, payment_id = v_payment, result_desc = left(p_desc, 200)
   where id = r.id;
  -- If the Paybill notification for this same payment arrived first (possibly unmatched, e.g. a long
  -- account reference), settle that record too so nothing is left dangling in the "unmatched" list.
  insert into public.mpesa_transactions (trans_id, amount_cents, msisdn, campus_id, status, student_id, payment_id, payer_name)
  values (upper(p_receipt), coalesce(p_amount_cents, r.amount_cents), r.phone, r.campus_id, 'matched', r.student_id, v_payment, 'Phone prompt')
  on conflict (trans_id) do update
     set status = 'matched', student_id = excluded.student_id, payment_id = excluded.payment_id, campus_id = excluded.campus_id
   where public.mpesa_transactions.status = 'unmatched';
  return jsonb_build_object('status', 'paid');
end;
$$;

-- Family's own polling: has my prompt been paid?
create function public.get_stk_status(p_request uuid, p_phone text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('status', r.status, 'receipt', p.receipt_number, 'detail', r.result_desc)
    from public.mpesa_stk_requests r
    left join public.payments p on p.id = r.payment_id
   where r.id = p_request
     and right(regexp_replace(r.phone, '\D', '', 'g'), 9) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
$$;

-- ---------------------------------------------------------------------
-- Admissions -> fees: enrolling a child raises their first invoice
-- ---------------------------------------------------------------------
create or replace function public.enrol_application(p_application_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a        public.admission_applications%rowtype;
  v_seq    integer;
  v_number text;
  v_code   text;
  v_student uuid;
  v_term   public.terms%rowtype;
begin
  select * into a from public.admission_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found.'; end if;
  if not public.can_manage_campus(a.campus_id) then
    raise exception 'You do not have permission to enrol students at this school.';
  end if;
  if a.status = 'enrolled' then raise exception 'This child is already enrolled.'; end if;
  if a.status not in ('offered', 'accepted') then
    raise exception 'Only applications that have been offered a place can be enrolled.';
  end if;

  select code into v_code from public.campuses where id = a.campus_id;
  v_seq := public.next_number(a.campus_id, 'student', a.intake_year);
  v_number := v_code || '/' || a.intake_year || '/' || lpad(v_seq::text, 3, '0');

  insert into public.students (
    admission_number, campus_id, grade_id, first_name, middle_name, last_name, date_of_birth, gender,
    guardian_name, guardian_relationship, guardian_phone, guardian_email, guardian_address,
    medical_notes, special_needs, application_id
  ) values (
    v_number, a.campus_id, a.grade_id, a.student_first_name, a.student_middle_name, a.student_last_name,
    a.date_of_birth, a.gender, a.guardian_name, a.guardian_relationship, a.guardian_phone,
    a.guardian_email, a.guardian_address, a.medical_notes, a.special_needs, a.id
  ) returning id into v_student;

  update public.admission_applications
     set status = 'enrolled', student_id = v_student
   where id = a.id;

  -- Fees: a child who asked for transport is subscribed to it, then the first invoice is raised.
  if a.wants_transport then
    insert into public.student_fee_subscriptions (student_id, fee_item_id)
    select v_student, id from public.fee_items where kind = 'transport' and is_active
    on conflict do nothing;
  end if;
  select * into v_term from public.terms where is_current;
  if found then
    perform public._invoice_student(v_student, v_term.year, v_term.number, auth.uid());
  end if;

  return v_student;
end;
$$;

-- ---------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------
revoke all on function public.generate_invoices(uuid, integer, smallint, uuid) from public;
revoke all on function public.cancel_invoice(uuid, text) from public;
revoke all on function public.record_payment(uuid, integer, text, text, text, text, date, text) from public;
revoke all on function public.reverse_payment(uuid, text) from public;
revoke all on function public.post_fee_adjustment(uuid, text, integer, text, integer, smallint) from public;
revoke all on function public.mpesa_assign_transaction(uuid, uuid) from public;
revoke all on function public.mpesa_ignore_transaction(uuid) from public;
revoke all on function public.mpesa_record_c2b(jsonb) from public, anon, authenticated;
revoke all on function public.mpesa_stk_complete(text, boolean, text, integer, text) from public, anon, authenticated;
revoke all on function public.get_fee_account(text, text) from public;
revoke all on function public.get_stk_status(uuid, text) from public;
revoke all on function public.enrol_application(uuid) from public;

grant execute on function public.generate_invoices(uuid, integer, smallint, uuid) to authenticated;
grant execute on function public.cancel_invoice(uuid, text) to authenticated;
grant execute on function public.record_payment(uuid, integer, text, text, text, text, date, text) to authenticated;
grant execute on function public.reverse_payment(uuid, text) to authenticated;
grant execute on function public.post_fee_adjustment(uuid, text, integer, text, integer, smallint) to authenticated;
grant execute on function public.mpesa_assign_transaction(uuid, uuid) to authenticated;
grant execute on function public.mpesa_ignore_transaction(uuid) to authenticated;
grant execute on function public.enrol_application(uuid) to authenticated;
grant execute on function public.get_fee_account(text, text) to anon, authenticated;
grant execute on function public.get_stk_status(uuid, text) to anon, authenticated;
grant execute on function public.mpesa_record_c2b(jsonb) to service_role;
grant execute on function public.mpesa_stk_complete(text, boolean, text, integer, text) to service_role;

-- ---------------------------------------------------------------------
-- Row Level Security: staff read their campus; ALL writes go through functions
-- (except fee setup, which staff may edit directly for their own campus)
-- ---------------------------------------------------------------------
alter table public.terms                      enable row level security;
alter table public.fee_items                  enable row level security;
alter table public.fee_structures             enable row level security;
alter table public.student_fee_subscriptions  enable row level security;
alter table public.invoices                   enable row level security;
alter table public.invoice_lines              enable row level security;
alter table public.payments                   enable row level security;
alter table public.fee_adjustments            enable row level security;
alter table public.mpesa_transactions         enable row level security;
alter table public.mpesa_stk_requests         enable row level security;

create policy "staff read terms" on public.terms for select using (public.is_staff_admin());
create policy "group admins manage terms" on public.terms for all using (public.is_group_admin()) with check (public.is_group_admin());

create policy "staff read fee items" on public.fee_items for select using (public.is_staff_admin());
create policy "group admins manage fee items" on public.fee_items for all using (public.is_group_admin()) with check (public.is_group_admin());

create policy "staff manage their fee structures" on public.fee_structures
  for all using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));

create policy "staff manage subscriptions" on public.student_fee_subscriptions
  for all using (exists (select 1 from public.students s where s.id = student_id and public.can_manage_campus(s.campus_id)))
  with check (exists (select 1 from public.students s where s.id = student_id and public.can_manage_campus(s.campus_id)));

create policy "staff read invoices" on public.invoices for select using (public.can_manage_campus(campus_id));
create policy "staff read invoice lines" on public.invoice_lines for select using (
  exists (select 1 from public.invoices i where i.id = invoice_id and public.can_manage_campus(i.campus_id)));
create policy "staff read payments" on public.payments for select using (public.can_manage_campus(campus_id));
create policy "staff read adjustments" on public.fee_adjustments for select using (public.can_manage_campus(campus_id));
create policy "staff read mpesa transactions" on public.mpesa_transactions
  for select using (public.is_group_admin() or (campus_id is not null and public.can_manage_campus(campus_id)));
create policy "staff read stk requests" on public.mpesa_stk_requests for select using (public.can_manage_campus(campus_id));

-- ---------------------------------------------------------------------
-- Seed: common fee items (edit in Admin > Fees > Setup)
-- ---------------------------------------------------------------------
insert into public.fee_items (name, kind, is_optional, sort_order) values
  ('Tuition',        'tuition',   false, 1),
  ('Activity fee',   'activity',  false, 2),
  ('Lunch',          'meals',     true,  3),
  ('Transport',      'transport', true,  4);

-- Set the payment details for each school in Admin > Schools (Paybill / Till / instructions).
