-- =====================================================================
-- Bulk import of existing pupils (with opening fee balances)
-- Run once in the Supabase SQL Editor, after 0006.
--
-- * Pupils who joined before the system existed have no admission
--   application, so their date of birth may be unknown: it is now optional.
-- * import_students() checks (dry run) and then loads up to 2,000 pupils
--   for ONE campus. Each row succeeds or fails on its own, so one bad row
--   never blocks the rest, and nothing is ever imported twice.
-- =====================================================================

alter table public.students alter column date_of_birth drop not null;

alter table public.students
  add column upi_number text check (char_length(upi_number) <= 40),
  add column source text not null default 'admission' check (source in ('admission', 'import'));

create unique index students_upi_unique on public.students (upi_number) where upi_number is not null;

create function public.import_students(p_campus uuid, p_rows jsonb, p_commit boolean default false)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c         public.campuses%rowtype;
  r         jsonb;
  i         integer := 0;
  v_out     jsonb := '[]'::jsonb;
  v_created integer := 0;
  v_dups    integer := 0;
  v_errors  integer := 0;
  v_status  text;
  v_msg     text;
  v_number  text;
  v_given   text;
  v_year    integer;
  v_seq     integer;
  v_first   text;
  v_last    text;
  v_phone   text;
  v_grade   uuid;
  v_balance integer;
  v_student uuid;
  v_seen    text[] := '{}';
  v_nums    text[] := '{}';   -- admission numbers claimed earlier in this same file
  v_upis    text[] := '{}';   -- UPI numbers claimed earlier in this same file
  v_upi     text;
  v_key     text;
begin
  select * into c from public.campuses where id = p_campus;
  if not found then raise exception 'School not found.'; end if;
  if not public.can_manage_campus(p_campus) then
    raise exception 'You do not have permission to import students for this school.';
  end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'No rows to import.'; end if;
  if jsonb_array_length(p_rows) > 2000 then raise exception 'Please import at most 2,000 pupils at a time.'; end if;

  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1;
    v_status := 'ok'; v_msg := null; v_number := null; v_student := null;

    begin
      v_first := nullif(trim(r ->> 'first_name'), '');
      v_last  := nullif(trim(r ->> 'last_name'), '');
      v_phone := nullif(trim(r ->> 'guardian_phone'), '');
      v_grade := nullif(r ->> 'grade_id', '')::uuid;
      v_balance := nullif(r ->> 'opening_balance_cents', '')::integer;
      v_given := nullif(public._normalize_admission(r ->> 'admission_number'), '');
      v_year := coalesce(nullif(r ->> 'admission_year', '')::integer, extract(year from current_date)::integer);

      if v_first is null or v_last is null then raise exception 'First and last name are required.'; end if;
      if coalesce(r ->> 'gender', '') not in ('female', 'male') then raise exception 'Gender must be male or female.'; end if;
      if v_phone is null or char_length(regexp_replace(v_phone, '\D', '', 'g')) < 9 then
        raise exception 'A parent phone number (at least 9 digits) is required — parents use it to see fees.';
      end if;
      if nullif(trim(r ->> 'guardian_name'), '') is null then raise exception 'Parent / guardian name is required.'; end if;
      if v_grade is null or not exists (select 1 from public.campus_grades where campus_id = p_campus and grade_id = v_grade) then
        raise exception 'That class is not offered at this school.';
      end if;
      if v_balance is not null and abs(v_balance) > 100000000 then raise exception 'The opening balance looks too large.'; end if;
      if v_given is not null and char_length(v_given) > 30 then raise exception 'Admission number is too long (30 characters at most).'; end if;

      -- Same child already in this school? (same name + same parent phone)
      v_key := lower(v_first) || '|' || lower(v_last) || '|' || right(regexp_replace(v_phone, '\D', '', 'g'), 9);
      if v_key = any(v_seen) or exists (
           select 1 from public.students s
            where s.campus_id = p_campus and lower(s.first_name) = lower(v_first) and lower(s.last_name) = lower(v_last)
              and right(regexp_replace(s.guardian_phone, '\D', '', 'g'), 9) = right(regexp_replace(v_phone, '\D', '', 'g'), 9)) then
        v_status := 'duplicate';
        v_msg := 'Already in the system (same name and parent phone) — skipped.';
      else
        v_upi := nullif(trim(r ->> 'upi_number'), '');
        -- A clash with an existing pupil OR with another row of this file (so a dry run tells the whole truth).
        if v_given is not null and (v_given = any(v_nums) or exists (select 1 from public.students where admission_number = v_given)) then
          raise exception 'Admission number % is already used by another pupil or another row.', v_given;
        end if;
        if v_upi is not null and (v_upi = any(v_upis) or exists (select 1 from public.students where upi_number = v_upi)) then
          raise exception 'UPI number % is already used by another pupil or another row.', v_upi;
        end if;
        v_seen := array_append(v_seen, v_key);
        if v_given is not null then v_nums := array_append(v_nums, v_given); end if;
        if v_upi is not null then v_upis := array_append(v_upis, v_upi); end if;

        if p_commit then
          v_number := v_given;
          if v_number is null then
            loop
              v_seq := public.next_number(p_campus, 'student', v_year);
              v_number := c.code || '/' || v_year || '/' || lpad(v_seq::text, 3, '0');
              exit when not exists (select 1 from public.students where admission_number = v_number);
            end loop;
          end if;

          insert into public.students (
            admission_number, campus_id, grade_id, first_name, middle_name, last_name, date_of_birth, gender,
            guardian_name, guardian_relationship, guardian_phone, guardian_email, upi_number, source, enrolled_on
          ) values (
            v_number, p_campus, v_grade, v_first, nullif(trim(r ->> 'middle_name'), ''), v_last,
            nullif(r ->> 'date_of_birth', '')::date, r ->> 'gender',
            trim(r ->> 'guardian_name'), nullif(trim(r ->> 'guardian_relationship'), ''), v_phone,
            nullif(trim(r ->> 'guardian_email'), ''), v_upi, 'import',
            coalesce(nullif(r ->> 'enrolled_on', '')::date, current_date)
          ) returning id into v_student;

          if v_balance is not null and v_balance <> 0 then
            insert into public.fee_adjustments (student_id, campus_id, kind, amount_cents, description, created_by)
            values (v_student, p_campus, 'opening_balance', v_balance, 'Balance brought forward', auth.uid());
          end if;
        end if;
      end if;
    exception
      when unique_violation then
        v_status := 'error';
        v_msg := 'Admission or UPI number is already in use.';
      when others then
        v_status := 'error';
        v_msg := sqlerrm;
    end;

    if v_status = 'ok' then v_created := v_created + 1;
    elsif v_status = 'duplicate' then v_dups := v_dups + 1;
    else v_errors := v_errors + 1; end if;

    v_out := v_out || jsonb_build_object('row', i, 'status', v_status, 'admission_number', v_number, 'message', v_msg);
  end loop;

  return jsonb_build_object('committed', p_commit, 'ok', v_created, 'duplicates', v_dups, 'errors', v_errors, 'rows', v_out);
end;
$$;

revoke all on function public.import_students(uuid, jsonb, boolean) from public;
grant execute on function public.import_students(uuid, jsonb, boolean) to authenticated;
