-- 0010: SMS outbox, automatic fee receipts, fee reminders and notices.
-- Messages are QUEUED in the database; the web server sends them through the SMS provider
-- (Africa's Talking) and records the result. Run after 0009.

alter table public.campuses add column if not exists sms_receipts_enabled boolean not null default false;

create table public.sms_outbox (
  id            uuid primary key default gen_random_uuid(),
  campus_id     uuid not null references public.campuses (id) on delete cascade,
  student_id    uuid references public.students (id) on delete set null,
  to_phone      text not null check (to_phone ~ '^\+254[17][0-9]{8}$'),
  body          text not null check (char_length(body) between 1 and 640),
  kind          text not null check (kind in ('receipt', 'reminder', 'notice', 'other')),
  status        text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  attempts      integer not null default 0,
  provider_id   text,
  error         text,
  dedupe_key    text unique,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  sent_at       timestamptz
);
create index sms_outbox_status_idx on public.sms_outbox (status, created_at);
create index sms_outbox_campus_idx on public.sms_outbox (campus_id, created_at desc);

alter table public.sms_outbox enable row level security;
create policy sms_outbox_staff_read on public.sms_outbox for select to authenticated
  using (public.can_manage_campus(campus_id));
revoke all on public.sms_outbox from anon, authenticated;
grant select on public.sms_outbox to authenticated;

-- Kenyan number -> +2547XXXXXXXX / +2541XXXXXXXX, or NULL when it is not a mobile number.
create or replace function public._sms_phone(p text)
returns text language sql immutable set search_path = public as $$
  select case
    when d ~ '^254[17][0-9]{8}$' then '+' || d
    when d ~ '^0[17][0-9]{8}$' then '+254' || substr(d, 2)
    when d ~ '^[17][0-9]{8}$' then '+254' || d
    else null end
  from (select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') as d) x;
$$;

create or replace function public._kes(p_cents bigint)
returns text language sql immutable as $$
  select 'KES ' || to_char(abs(p_cents) / 100, 'FM999,999,999,990');
$$;

-- 1. Automatic receipt for every new confirmed payment (not for imported statements or old payments).
create or replace function public._queue_receipt()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  s public.students%rowtype;
  c public.campuses%rowtype;
  v_phone text;
  v_bal bigint;
  v_body text;
begin
  if new.status <> 'confirmed' or new.source = 'statement' or new.received_on < current_date - 7 then return new; end if;
  select * into c from public.campuses where id = new.campus_id;
  if not found or not c.sms_receipts_enabled then return new; end if;
  select * into s from public.students where id = new.student_id;
  if not found then return new; end if;
  v_phone := public._sms_phone(s.guardian_phone);
  if v_phone is null then return new; end if;
  v_bal := public._balance(s.id);
  v_body := left(c.name, 40) || ': Received ' || public._kes(new.amount_cents) || ' for ' || s.first_name
         || ' (' || s.admission_number || '). Receipt ' || new.receipt_number || '. '
         || case when v_bal > 0 then 'Balance ' || public._kes(v_bal) || '.'
                 when v_bal < 0 then 'Credit ' || public._kes(v_bal) || '.'
                 else 'Fees fully paid.' end
         || ' Thank you.';
  insert into public.sms_outbox (campus_id, student_id, to_phone, body, kind, dedupe_key)
    values (new.campus_id, s.id, v_phone, v_body, 'receipt', 'receipt:' || new.id)
    on conflict (dedupe_key) do nothing;
  return new;
exception when others then
  return new;  -- an SMS problem must never block recording a payment
end;
$$;
create trigger payments_queue_receipt after insert on public.payments
  for each row execute function public._queue_receipt();

-- 2. Fee reminders to families who owe at least p_min_cents. Preview with p_commit = false.
create or replace function public.queue_fee_reminders(p_campus uuid, p_min_cents integer, p_template text, p_commit boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c public.campuses%rowtype;
  r record;
  v_body text;
  v_count integer := 0;
  v_sample text;
begin
  if auth.uid() is null or not public.can_manage_campus(p_campus) then raise exception 'Not allowed'; end if;
  if p_template is null or char_length(trim(p_template)) < 10 or char_length(p_template) > 300 then raise exception 'Message must be 10 to 300 characters'; end if;
  select * into c from public.campuses where id = p_campus;
  if not found then raise exception 'Unknown school'; end if;
  for r in
    select s.id, s.first_name, s.admission_number, public._sms_phone(s.guardian_phone) as phone, public._balance(s.id) as bal
      from public.students s
     where s.campus_id = p_campus and s.status = 'active'
     order by s.first_name
  loop
    continue when r.phone is null or r.bal < greatest(p_min_cents, 1);
    v_body := replace(replace(replace(replace(p_template, '{child}', r.first_name), '{balance}', public._kes(r.bal)), '{admission}', r.admission_number), '{school}', c.name);
    v_count := v_count + 1;
    if v_sample is null then v_sample := v_body; end if;
    if p_commit then
      insert into public.sms_outbox (campus_id, student_id, to_phone, body, kind, dedupe_key, created_by)
        values (p_campus, r.id, r.phone, left(v_body, 640), 'reminder', 'reminder:' || r.id || ':' || current_date, auth.uid())
        on conflict (dedupe_key) do nothing;
    end if;
  end loop;
  return jsonb_build_object('count', v_count, 'sample', v_sample, 'committed', p_commit);
end;
$$;

-- 3. A notice to every family of a school, or of one class. One message per phone number.
create or replace function public.queue_notice(p_campus uuid, p_class uuid, p_body text, p_commit boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_phones text[];
  v_phone text;
begin
  if auth.uid() is null or not public.can_manage_campus(p_campus) then raise exception 'Not allowed'; end if;
  if p_body is null or char_length(trim(p_body)) < 5 or char_length(p_body) > 480 then raise exception 'Message must be 5 to 480 characters'; end if;
  if p_class is not null and not exists (select 1 from public.classes where id = p_class and campus_id = p_campus) then raise exception 'That class is not in this school'; end if;
  select array_agg(distinct public._sms_phone(s.guardian_phone)) into v_phones
    from public.students s
   where s.campus_id = p_campus and s.status = 'active' and (p_class is null or s.class_id = p_class)
     and public._sms_phone(s.guardian_phone) is not null;
  v_phones := coalesce(v_phones, '{}');
  if p_commit then
    foreach v_phone in array v_phones loop
      insert into public.sms_outbox (campus_id, to_phone, body, kind, created_by) values (p_campus, v_phone, trim(p_body), 'notice', auth.uid());
    end loop;
  end if;
  return jsonb_build_object('count', coalesce(array_length(v_phones, 1), 0), 'committed', p_commit);
end;
$$;

-- 4. Staff: put failed messages back in the queue; switch automatic receipts on or off.
create or replace function public.sms_requeue_failed(p_campus uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null or not public.can_manage_campus(p_campus) then raise exception 'Not allowed'; end if;
  update public.sms_outbox set status = 'queued', attempts = 0, error = null, updated_at = now()
   where campus_id = p_campus and status = 'failed';
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.set_sms_receipts(p_campus uuid, p_enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.can_manage_campus(p_campus) then raise exception 'Not allowed'; end if;
  update public.campuses set sms_receipts_enabled = p_enabled where id = p_campus;
end;
$$;

-- 5. Sending side (server only, service-role key).
create or replace function public.sms_claim_batch(p_limit integer)
returns setof public.sms_outbox language plpgsql security definer set search_path = public as $$
begin
  return query
  update public.sms_outbox o set status = 'sending', attempts = o.attempts + 1, updated_at = now()
   where o.id in (
     select id from public.sms_outbox
      where (status = 'queued' or (status = 'sending' and updated_at < now() - interval '10 minutes')) and attempts < 5
      order by created_at limit greatest(1, least(p_limit, 200)) for update skip locked)
  returning o.*;
end;
$$;

create or replace function public.sms_mark(p_id uuid, p_ok boolean, p_provider_id text, p_error text)
returns void language sql security definer set search_path = public as $$
  update public.sms_outbox
     set status = case when p_ok then 'sent' when attempts >= 5 then 'failed' else 'queued' end,
         provider_id = coalesce(p_provider_id, provider_id),
         error = case when p_ok then null else left(p_error, 300) end,
         sent_at = case when p_ok then now() else sent_at end,
         updated_at = now()
   where id = p_id;
$$;

revoke all on function public._sms_phone(text), public._kes(bigint), public._queue_receipt(),
  public.queue_fee_reminders(uuid, integer, text, boolean), public.queue_notice(uuid, uuid, text, boolean),
  public.sms_requeue_failed(uuid), public.set_sms_receipts(uuid, boolean),
  public.sms_claim_batch(integer), public.sms_mark(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.queue_fee_reminders(uuid, integer, text, boolean), public.queue_notice(uuid, uuid, text, boolean),
  public.sms_requeue_failed(uuid), public.set_sms_receipts(uuid, boolean) to authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.sms_claim_batch(integer), public.sms_mark(uuid, boolean, text, text) to service_role;
  end if;
end $$;
