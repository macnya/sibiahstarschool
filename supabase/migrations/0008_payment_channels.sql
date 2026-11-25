-- =====================================================================
-- 0008  Payment channels: Paybill account numbers, KCB Lipa Karo, bank
--       statement import, card/POS.
--
--   * Each school can set how parents type the ACCOUNT NUMBER on its
--     Paybill (admission number by default, or a fixed one) and whether it
--     also has a Till (no account number) and/or a KCB Lipa Karo number.
--   * KCB / bank / M-Pesa statements can be imported in bulk; every line
--     is matched to a child by the account/reference text.
--   * Payments that cannot be matched wait in Fees -> M-Pesa (Unmatched).
--
-- Safe to run once, after 0007.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Per-school payment settings
-- ---------------------------------------------------------------------
alter table public.campuses
  add column paybill_account_format text check (char_length(paybill_account_format) <= 80),
  add column kcb_till_number        text check (char_length(kcb_till_number) <= 30),
  add column kcb_paybill_number     text check (char_length(kcb_paybill_number) <= 30),
  add column kcb_account_format     text check (char_length(kcb_account_format) <= 80);

comment on column public.campuses.paybill_account_format is
  'What a parent types as ACCOUNT NUMBER on the school''s M-Pesa Paybill. Placeholders: {admission}. Empty = admission number.';
comment on column public.campuses.kcb_account_format is
  'What a parent types as ACCOUNT on the KCB Paybill (522522). Placeholders: {till}, {admission}. Example: {till}#{admission}.';

-- ---------------------------------------------------------------------
-- 2. More payment methods; statement-imported payments
-- ---------------------------------------------------------------------
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check
  check (method in ('mpesa', 'kcb', 'bank', 'cash', 'cheque', 'card', 'other'));

alter table public.payments drop constraint if exists payments_source_check;
alter table public.payments add constraint payments_source_check
  check (source in ('staff', 'mpesa_c2b', 'mpesa_stk', 'statement'));

alter table public.mpesa_transactions
  add column channel text not null default 'mpesa' check (channel in ('mpesa', 'kcb', 'bank'));

-- ---------------------------------------------------------------------
-- 3. _insert_payment accepts the new methods
-- ---------------------------------------------------------------------
create or replace function public._insert_payment(
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
  if p_method not in ('mpesa', 'kcb', 'bank', 'cash', 'cheque', 'card', 'other') then
    raise exception 'Choose a payment method.';
  end if;
  if p_method in ('mpesa', 'kcb', 'cheque', 'bank', 'card') and char_length(trim(coalesce(p_reference, ''))) < 3 then
    raise exception 'Enter the %.', case p_method when 'mpesa' then 'M-Pesa transaction code'
                                                   when 'kcb' then 'KCB transaction reference'
                                                   when 'cheque' then 'cheque number'
                                                   when 'card' then 'card slip / approval number'
                                                   else 'bank reference' end;
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

-- ---------------------------------------------------------------------
-- 4. Matching a payment's account text to a child
--    "24810", "SSS/2026/001", "sss 2026 1", "12345#24810" (KCB), "12345#John24810"
-- ---------------------------------------------------------------------
create or replace function public._adm_key(p text)
returns text language sql immutable as $$
  select regexp_replace(upper(coalesce(p, '')), '[^A-Z0-9]', '', 'g')
$$;

create index if not exists students_adm_key_idx on public.students (public._adm_key(admission_number));

create or replace function public._match_student(p_campus uuid, p_ref text)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare
  v_ref   text := trim(coalesce(p_ref, ''));
  v_a     text;
  v_b     text;
  v_ids   uuid[];
begin
  if v_ref = '' then return null; end if;
  -- KCB: "<school number>#<account>" -> only the part after the last '#'
  if position('#' in v_ref) > 0 then v_ref := substring(v_ref from '[^#]*$'); end if;
  v_a := public._adm_key(v_ref);
  if v_a = '' then return null; end if;
  -- a leading name is dropped:  JOHN24810 -> 24810   (only if what is left starts with a digit)
  v_b := substring(v_a from '^[A-Z]+([0-9].*)$');

  -- "sss 2026 1" is how a parent might type SSS/2026/001: use the same tidy-up the parent page uses
  select array_agg(id) into v_ids from public.students
   where admission_number = public._normalize_admission(v_ref) and (p_campus is null or campus_id = p_campus);
  if coalesce(array_length(v_ids, 1), 0) = 1 then return v_ids[1]; end if;

  select array_agg(id) into v_ids from public.students
   where public._adm_key(admission_number) = v_a and (p_campus is null or campus_id = p_campus);
  if coalesce(array_length(v_ids, 1), 0) = 1 then return v_ids[1]; end if;
  if coalesce(array_length(v_ids, 1), 0) > 1 then return null; end if;

  if v_b is not null and v_b <> '' then
    select array_agg(id) into v_ids from public.students
     where public._adm_key(admission_number) = v_b and (p_campus is null or campus_id = p_campus);
    if coalesce(array_length(v_ids, 1), 0) = 1 then return v_ids[1]; end if;
  end if;
  return null;
end;
$$;
revoke all on function public._match_student(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Paybill notifications use the matcher
-- ---------------------------------------------------------------------
create or replace function public.mpesa_record_c2b(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_trans   text := nullif(trim(p ->> 'TransID'), '');
  v_amount  integer := round((nullif(p ->> 'TransAmount', '')::numeric) * 100);
  v_ref     text := nullif(trim(p ->> 'BillRefNumber'), '');
  v_short   text := nullif(trim(p ->> 'BusinessShortCode'), '');
  v_time    timestamptz;
  v_student public.students%rowtype;
  v_sid     uuid;
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
    v_time := (to_timestamp(p ->> 'TransTime', 'YYYYMMDDHH24MISS')::timestamp) at time zone 'Africa/Nairobi';
  exception when others then v_time := now();
  end;

  select id into v_campus from public.campuses where paybill_number = v_short or till_number = v_short limit 1;
  v_sid := public._match_student(v_campus, v_ref);
  if v_sid is not null then select * into v_student from public.students where id = v_sid; end if;

  insert into public.mpesa_transactions (trans_id, trans_time, amount_cents, msisdn, bill_ref, payer_name, shortcode, campus_id, channel, raw)
  values (v_trans, v_time, v_amount, p ->> 'MSISDN', v_ref, v_name, v_short, coalesce(v_student.campus_id, v_campus), 'mpesa', p)
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

-- ---------------------------------------------------------------------
-- 6. Assigning an unmatched payment: method follows the channel
-- ---------------------------------------------------------------------
create or replace function public.mpesa_assign_transaction(p_transaction uuid, p_student uuid)
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

  v_payment := public._insert_payment(s.id, t.amount_cents,
                                      case t.channel when 'kcb' then 'kcb' when 'bank' then 'bank' else 'mpesa' end,
                                      t.trans_id, t.payer_name, t.msisdn,
                                      (t.trans_time at time zone 'Africa/Nairobi')::date,
                                      case t.channel when 'mpesa' then 'mpesa_c2b' else 'statement' end,
                                      'Assigned manually from account "' || coalesce(t.bill_ref, '') || '"', auth.uid());
  update public.mpesa_transactions
     set status = 'matched', student_id = s.id, campus_id = s.campus_id, payment_id = v_payment
   where id = t.id;
  return v_payment;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Statement import (KCB / bank / M-Pesa report)
--    p_rows: [{trans_id, amount_cents, date, reference, payer_name, phone}]
--    Dry run (p_commit = false) and commit follow exactly the same rules.
--    Importing the same file twice never double-counts.
-- ---------------------------------------------------------------------
create or replace function public.import_statement(
  p_campus uuid, p_channel text, p_rows jsonb, p_commit boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r          record;
  v_trans    text;
  v_amount   integer;
  v_date     date;
  v_ref      text;
  v_name     text;
  v_phone    text;
  v_sid      uuid;
  v_status   text;
  v_msg      text;
  v_sname    text;
  v_adm      text;
  v_method   text;
  v_seen     text[] := '{}';
  v_out      jsonb := '[]'::jsonb;
  n_total    integer := 0;
  n_matched  integer := 0;
  n_unmatched integer := 0;
  n_dup      integer := 0;
  n_err      integer := 0;
  v_sum_m    bigint := 0;
  v_sum_u    bigint := 0;
  v_pid      uuid;
  v_tid      uuid;
begin
  if not public.can_manage_campus(p_campus) then
    raise exception 'You do not have permission to import payments for this school.';
  end if;
  if p_channel not in ('mpesa', 'kcb', 'bank') then raise exception 'Choose where this statement is from.'; end if;
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'The statement has no payments in it.';
  end if;
  if jsonb_array_length(p_rows) > 2000 then raise exception 'Import at most 2,000 payments at a time.'; end if;
  v_method := case p_channel when 'kcb' then 'kcb' when 'bank' then 'bank' else 'mpesa' end;

  for r in select value as j, ordinality as n from jsonb_array_elements(p_rows) with ordinality loop
    n_total := n_total + 1;
    v_status := null; v_msg := null; v_sname := null; v_adm := null; v_sid := null;
    v_trans := nullif(trim(r.j ->> 'trans_id'), '');
    v_ref   := nullif(trim(r.j ->> 'reference'), '');
    v_name  := nullif(trim(r.j ->> 'payer_name'), '');
    v_phone := nullif(trim(r.j ->> 'phone'), '');

    begin
      v_amount := (r.j ->> 'amount_cents')::integer;
    exception when others then v_amount := null; end;
    begin
      v_date := (r.j ->> 'date')::date;
    exception when others then v_date := null; end;

    if v_trans is null or char_length(v_trans) < 3 or char_length(v_trans) > 60 then
      v_status := 'error'; v_msg := 'Transaction reference is missing or too long.';
    elsif v_amount is null or v_amount <= 0 or v_amount > 100000000 then
      v_status := 'error'; v_msg := 'Amount is not valid.';
    elsif v_date is null or v_date > current_date or v_date < current_date - 800 then
      v_status := 'error'; v_msg := 'Date is not valid.';
    elsif upper(v_trans) = any (v_seen) then
      v_status := 'duplicate'; v_msg := 'Appears twice in this file.';
    elsif exists (select 1 from public.mpesa_transactions where upper(trans_id) = upper(v_trans))
       or exists (select 1 from public.payments where method = v_method and upper(reference) = upper(v_trans) and status = 'confirmed') then
      v_status := 'duplicate'; v_msg := 'Already recorded.';
    end if;

    if v_status is null then
      v_seen := v_seen || upper(v_trans);
      v_sid := public._match_student(p_campus, v_ref);
      if v_sid is null then
        v_status := 'unmatched';
        v_msg := case when v_ref is null then 'No account number on this line.' else 'No child found for “' || v_ref || '”.' end;
      else
        v_status := 'matched';
        select first_name || ' ' || last_name, admission_number into v_sname, v_adm from public.students where id = v_sid;
      end if;

      if p_commit then
        begin
          insert into public.mpesa_transactions (trans_id, trans_time, amount_cents, msisdn, bill_ref, payer_name,
                                                 campus_id, channel, status, raw)
          values (v_trans, ((v_date::timestamp + time '12:00') at time zone 'Africa/Nairobi'), v_amount, v_phone, v_ref, v_name,
                  p_campus, p_channel, 'unmatched', r.j)
          returning id into v_tid;
          if v_sid is not null then
            v_pid := public._insert_payment(v_sid, v_amount, v_method, v_trans, v_name, v_phone, v_date, 'statement',
                                            'Imported statement; account "' || coalesce(v_ref, '') || '"', auth.uid());
            update public.mpesa_transactions set status = 'matched', student_id = v_sid, payment_id = v_pid where id = v_tid;
          end if;
        exception when others then
          v_status := 'error'; v_msg := sqlerrm;
        end;
      end if;
    end if;

    if v_status = 'matched' then n_matched := n_matched + 1; v_sum_m := v_sum_m + v_amount;
    elsif v_status = 'unmatched' then n_unmatched := n_unmatched + 1; v_sum_u := v_sum_u + v_amount;
    elsif v_status = 'duplicate' then n_dup := n_dup + 1;
    else n_err := n_err + 1; end if;

    v_out := v_out || jsonb_build_object('line', r.n, 'status', v_status, 'message', v_msg,
                                         'reference', v_ref, 'amount_cents', v_amount,
                                         'student_name', v_sname, 'admission_number', v_adm);
  end loop;

  return jsonb_build_object('committed', p_commit, 'total', n_total, 'matched', n_matched, 'unmatched', n_unmatched,
                            'duplicates', n_dup, 'errors', n_err,
                            'matched_cents', v_sum_m, 'unmatched_cents', v_sum_u, 'rows', v_out);
end;
$$;
revoke all on function public.import_statement(uuid, text, jsonb, boolean) from public;
grant execute on function public.import_statement(uuid, text, jsonb, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 8. Parents' fee lookup also returns how to pay
-- ---------------------------------------------------------------------
create or replace function public.get_fee_account(p_admission_number text, p_phone text)
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
    'paybill_account_format', c.paybill_account_format,
    'till_number', c.till_number,
    'kcb_till_number', c.kcb_till_number,
    'kcb_paybill_number', c.kcb_paybill_number,
    'kcb_account_format', c.kcb_account_format,
    'payment_instructions', c.payment_instructions,
    'balance_cents', public._balance(s.id),
    'entries', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select jsonb_array_elements(v_entries) x limit 40) t)
  );
end;
$$;
