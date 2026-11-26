-- 0014: department staff accounts, transport routes, kitchen headcount, and
-- tracking an application with the parent's phone number plus one name of the child.
-- Run after 0013.

-- ---------------------------------------------------------------- staff members
create table public.staff_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  campus_id  uuid not null references public.campuses (id) on delete cascade,
  department text not null check (department in ('transport', 'kitchen', 'general')),
  job_title  text check (char_length(job_title) <= 80),
  created_at timestamptz not null default now()
);
alter table public.staff_members enable row level security;
create policy staff_members_read on public.staff_members for select to authenticated
  using (user_id = auth.uid() or public.can_manage_campus(campus_id));
revoke all on public.staff_members from anon, authenticated;
grant select on public.staff_members to authenticated;
-- No write policy on purpose: accounts are created on the server with the service key, by an administrator.

-- ---------------------------------------------------------------- transport
create table public.transport_routes (
  id        uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses (id) on delete cascade,
  name      text not null check (char_length(name) between 2 and 80)
);
create unique index transport_routes_unique on public.transport_routes (campus_id, lower(name));
alter table public.transport_routes enable row level security;
create policy transport_routes_staff on public.transport_routes for all to authenticated
  using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));
revoke all on public.transport_routes from anon, authenticated;
grant select, insert, update, delete on public.transport_routes to authenticated;

alter table public.students add column if not exists route_id uuid references public.transport_routes (id) on delete set null;

create or replace function public.set_student_route(p_student uuid, p_route uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s public.students%rowtype;
begin
  select * into s from public.students where id = p_student;
  if not found or auth.uid() is null or not public.can_manage_campus(s.campus_id) then raise exception 'Not allowed'; end if;
  if p_route is not null and not exists (select 1 from public.transport_routes where id = p_route and campus_id = s.campus_id) then
    raise exception 'That route belongs to another school';
  end if;
  update public.students set route_id = p_route where id = p_student;
end;
$$;

-- Which department/campus is the signed-in staff member in?
create or replace function public.my_staff()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('department', m.department, 'title', m.job_title, 'campus_id', m.campus_id,
                            'campus_name', c.name, 'name', p.full_name)
    from public.staff_members m
    join public.campuses c on c.id = m.campus_id
    join public.profiles p on p.id = m.user_id
   where m.user_id = auth.uid()
$$;

-- Is the caller allowed to see this department's data for this campus?
create or replace function public._dept_ok(p_campus uuid, p_dept text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.can_manage_campus(p_campus)
    or exists (select 1 from public.staff_members m where m.user_id = auth.uid() and m.campus_id = p_campus and m.department = p_dept))
$$;

create or replace function public.transport_overview(p_campus uuid)
returns table (route_id uuid, name text, pupils bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._dept_ok(p_campus, 'transport') then raise exception 'Not allowed'; end if;
  return query
  select r.id, r.name, count(s.id) filter (where s.status = 'active')
    from public.transport_routes r left join public.students s on s.route_id = r.id
   where r.campus_id = p_campus group by r.id, r.name order by r.name;
end;
$$;

create or replace function public.transport_manifest(p_route uuid)
returns table (admission text, pupil text, class_label text, guardian_name text, guardian_phone text, today_status text)
language plpgsql stable security definer set search_path = public as $$
declare v_campus uuid;
begin
  select campus_id into v_campus from public.transport_routes where id = p_route;
  if v_campus is null or not public._dept_ok(v_campus, 'transport') then raise exception 'Not allowed'; end if;
  return query
  select s.admission_number, s.first_name || ' ' || s.last_name, public._class_label(s.class_id),
         s.guardian_name, s.guardian_phone,
         (select a.status from public.attendance a where a.student_id = s.id and a.day = public._today())
    from public.students s where s.route_id = p_route and s.status = 'active'
   order by s.first_name, s.last_name;
end;
$$;

-- ---------------------------------------------------------------- kitchen
create or replace function public.kitchen_headcount(p_campus uuid)
returns table (class_label text, pupils bigint, present bigint, late bigint, absent bigint, excused bigint, unmarked bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public._dept_ok(p_campus, 'kitchen') then raise exception 'Not allowed'; end if;
  return query
  select public._class_label(c.id),
         (select count(*) from public.students s where s.class_id = c.id and s.status = 'active'),
         count(a.id) filter (where a.status = 'present'),
         count(a.id) filter (where a.status = 'late'),
         count(a.id) filter (where a.status = 'absent'),
         count(a.id) filter (where a.status = 'excused'),
         (select count(*) from public.students s where s.class_id = c.id and s.status = 'active')
           - count(a.id)
    from public.classes c
    left join public.attendance a on a.class_id = c.id and a.day = public._today()
   where c.campus_id = p_campus and c.year = extract(year from public._today())::int
   group by c.id
   order by 1;
end;
$$;

-- ---------------------------------------------------------------- track an application by phone + child's name
create table public.application_lookup_failures (
  phone_key text not null,
  at        timestamptz not null default now()
);
create index application_lookup_failures_idx on public.application_lookup_failures (phone_key, at);
alter table public.application_lookup_failures enable row level security;
revoke all on public.application_lookup_failures from anon, authenticated;

create or replace function public.track_applications(p_phone text, p_name text)
returns table (
  reference text, status text, student_name text, campus_name text, grade_name text, intake_year integer,
  assessment_date date, decision_note text, updated_at timestamptz, history jsonb)
language plpgsql security definer set search_path = public as $$
declare
  v_key text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
  v_name text := lower(trim(regexp_replace(coalesce(p_name, ''), '[%_\\]', '', 'g')));
begin
  if char_length(v_key) < 9 or char_length(v_name) < 3 then
    perform pg_sleep(0.4);
    return;
  end if;
  if (select count(*) from public.application_lookup_failures f where f.phone_key = v_key and f.at > now() - interval '1 hour') >= 8 then
    raise exception 'Too many tries for this phone number. Please wait an hour or contact the school office.';
  end if;

  return query
  select a.reference, a.status, a.student_first_name || ' ' || a.student_last_name, c.name, g.name,
         a.intake_year, a.assessment_date, a.decision_note, a.updated_at,
         coalesce((select jsonb_agg(jsonb_build_object('status', e.to_status, 'at', e.created_at) order by e.created_at)
                     from public.application_events e where e.application_id = a.id and e.to_status is not null), '[]'::jsonb)
    from public.admission_applications a
    join public.campuses c on c.id = a.campus_id
    join public.grade_levels g on g.id = a.grade_id
   where (right(regexp_replace(a.guardian_phone, '\D', '', 'g'), 9) = v_key
          or right(regexp_replace(coalesce(a.guardian2_phone, ''), '\D', '', 'g'), 9) = v_key)
     and lower(a.student_first_name || ' ' || coalesce(a.student_middle_name, '') || ' ' || a.student_last_name) like '%' || v_name || '%'
   order by a.created_at desc
   limit 5;

  if not found then
    insert into public.application_lookup_failures (phone_key) values (v_key);
    perform pg_sleep(0.4);
  end if;
end;
$$;

revoke all on function public.set_student_route(uuid, uuid), public.my_staff(), public._dept_ok(uuid, text),
  public.transport_overview(uuid), public.transport_manifest(uuid), public.kitchen_headcount(uuid),
  public.track_applications(text, text) from public, anon, authenticated;
grant execute on function public.set_student_route(uuid, uuid), public.my_staff(), public.transport_overview(uuid),
  public.transport_manifest(uuid), public.kitchen_headcount(uuid) to authenticated;
grant execute on function public.track_applications(text, text) to anon, authenticated;
grant execute on function public._dept_ok(uuid, text) to authenticated;
