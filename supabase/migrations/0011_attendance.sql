-- 0011: daily class attendance. Run after 0010.

alter table public.campuses add column if not exists sms_absence_enabled boolean not null default false;

create table public.attendance (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id   uuid not null references public.classes (id) on delete cascade,
  campus_id  uuid not null references public.campuses (id) on delete cascade,
  day        date not null,
  status     text not null check (status in ('present', 'absent', 'late', 'excused')),
  note       text check (char_length(note) <= 200),
  marked_by  uuid references auth.users (id) on delete set null,
  marked_at  timestamptz not null default now(),
  unique (student_id, day)
);
create index attendance_class_day_idx on public.attendance (class_id, day);
create index attendance_campus_day_idx on public.attendance (campus_id, day);

alter table public.attendance enable row level security;
create policy attendance_read on public.attendance for select to authenticated
  using (public.can_manage_campus(campus_id) or public._is_teacher_of_class(class_id));
revoke all on public.attendance from anon, authenticated;
grant select on public.attendance to authenticated;

create or replace function public._today()
returns date language sql stable as $$ select (now() at time zone 'Africa/Nairobi')::date $$;

-- Mark a whole class for one day. p_rows = [{"student_id": "...", "status": "present|absent|late|excused", "note": ""}]
create or replace function public.mark_attendance(p_class uuid, p_day date, p_rows jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_campus uuid := public._class_campus(p_class);
  v_staff boolean;
  v_today date := public._today();
  r jsonb;
  v_student uuid;
  v_status text;
  v_prev text;
  v_n integer := 0;
  s public.students%rowtype;
  c public.campuses%rowtype;
  v_phone text;
begin
  if auth.uid() is null or v_campus is null then raise exception 'Not allowed'; end if;
  v_staff := public.can_manage_campus(v_campus);
  if not v_staff and not public._is_teacher_of_class(p_class) then raise exception 'Not allowed'; end if;
  if p_day is null or p_day > v_today then raise exception 'You cannot mark a future date'; end if;
  if not v_staff and p_day < v_today - 7 then raise exception 'Teachers can change attendance for the last 7 days only. Ask the office.'; end if;
  if extract(isodow from p_day) in (6, 7) then raise exception 'That day is a weekend'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 300 then raise exception 'Bad attendance list'; end if;
  select * into c from public.campuses where id = v_campus;

  for r in select * from jsonb_array_elements(p_rows) loop
    v_student := nullif(r ->> 'student_id', '')::uuid;
    v_status := r ->> 'status';
    if v_status not in ('present', 'absent', 'late', 'excused') then raise exception 'Bad status'; end if;
    select * into s from public.students where id = v_student and class_id = p_class and status = 'active';
    if not found then raise exception 'A pupil in the list is not in this class'; end if;
    select status into v_prev from public.attendance where student_id = v_student and day = p_day;
    insert into public.attendance (student_id, class_id, campus_id, day, status, note, marked_by, marked_at)
      values (v_student, p_class, v_campus, p_day, v_status, left(nullif(trim(coalesce(r ->> 'note', '')), ''), 200), auth.uid(), now())
      on conflict (student_id, day) do update
        set status = excluded.status, note = excluded.note, class_id = excluded.class_id,
            campus_id = excluded.campus_id, marked_by = excluded.marked_by, marked_at = now();
    v_n := v_n + 1;
    -- text the parent the first time a child is marked absent today
    if v_status = 'absent' and v_prev is distinct from 'absent' and p_day = v_today and c.sms_absence_enabled then
      v_phone := public._sms_phone(s.guardian_phone);
      if v_phone is not null then
        insert into public.sms_outbox (campus_id, student_id, to_phone, body, kind, dedupe_key, created_by)
          values (v_campus, s.id, v_phone,
                  left(c.name, 40) || ': ' || s.first_name || ' was marked absent today (' || to_char(p_day, 'DD Mon') || '). Please contact the school if this is unexpected.',
                  'other', 'absent:' || s.id || ':' || p_day, auth.uid())
          on conflict (dedupe_key) do nothing;
      end if;
    end if;
  end loop;
  return v_n;
end;
$$;

-- One row per class for a day: how many pupils, how many marked, and the counts.
create or replace function public.attendance_overview(p_campus uuid, p_day date)
returns table (class_id uuid, pupils bigint, marked bigint, present bigint, absent bigint, late bigint, excused bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.can_manage_campus(p_campus) then raise exception 'Not allowed'; end if;
  return query
  select c.id,
         (select count(*) from public.students s where s.class_id = c.id and s.status = 'active'),
         count(a.id),
         count(a.id) filter (where a.status = 'present'),
         count(a.id) filter (where a.status = 'absent'),
         count(a.id) filter (where a.status = 'late'),
         count(a.id) filter (where a.status = 'excused')
    from public.classes c
    left join public.attendance a on a.class_id = c.id and a.day = p_day
   where c.campus_id = p_campus
   group by c.id;
end;
$$;

-- A parent's view of one child: last 60 days.
create or replace function public.child_attendance(p_student uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null
     or not exists (select 1 from public.guardian_links where user_id = auth.uid() and student_id = p_student) then
    return null;
  end if;
  return jsonb_build_object(
    'days', (select count(*) from public.attendance where student_id = p_student and day >= public._today() - 60),
    'present', (select count(*) from public.attendance where student_id = p_student and day >= public._today() - 60 and status in ('present', 'late')),
    'absent', (select count(*) from public.attendance where student_id = p_student and day >= public._today() - 60 and status = 'absent'),
    'late', (select count(*) from public.attendance where student_id = p_student and day >= public._today() - 60 and status = 'late'),
    'excused', (select count(*) from public.attendance where student_id = p_student and day >= public._today() - 60 and status = 'excused'),
    'recent', (select coalesce(jsonb_agg(jsonb_build_object('day', day, 'status', status, 'note', note) order by day desc), '[]'::jsonb)
                 from (select day, status, note from public.attendance
                        where student_id = p_student and status <> 'present' and day >= public._today() - 60
                        order by day desc limit 20) x));
end;
$$;

create or replace function public.set_sms_absence(p_campus uuid, p_enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.can_manage_campus(p_campus) then raise exception 'Not allowed'; end if;
  update public.campuses set sms_absence_enabled = p_enabled where id = p_campus;
end;
$$;

revoke all on function public._today(), public.mark_attendance(uuid, date, jsonb), public.attendance_overview(uuid, date),
  public.child_attendance(uuid), public.set_sms_absence(uuid, boolean) from public, anon, authenticated;
grant execute on function public._today() to authenticated;
grant execute on function public.mark_attendance(uuid, date, jsonb), public.attendance_overview(uuid, date),
  public.child_attendance(uuid), public.set_sms_absence(uuid, boolean) to authenticated;
