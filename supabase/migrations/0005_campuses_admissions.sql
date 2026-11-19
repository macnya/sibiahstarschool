-- =====================================================================
-- Sibiah Star School group — multi-campus foundation + online admissions
-- Paste this into the Supabase SQL Editor and run it once, after
-- 0001-0004 have been applied.
--
-- What this adds
--   * campuses            one row per school/campus under the group
--   * grade_levels        Playgroup, PP1, PP2, Grade 1 - Grade 9
--   * campus_grades       which classes each campus offers (+ capacity)
--   * admission_applications / application_events   online admissions
--   * students            created when an application is enrolled
--   * campus-scoped admins (profiles.campus_id)
--
-- Security model
--   * Visitors never touch tables directly. They call two SECURITY
--     DEFINER functions: submit_admission_application() and
--     get_application_status().
--   * Group admins (role = 'admin', campus_id IS NULL) manage everything.
--   * Campus admins (role = 'admin', campus_id = <campus>) see and manage
--     only their own campus's applications and students.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Profiles: optional campus scope
-- ---------------------------------------------------------------------
create table public.campuses (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique check (code ~ '^[A-Z]{2,6}$'),
  name            text not null check (char_length(name) between 3 and 120),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  tagline         text,
  description     text,
  address         text,
  town            text,
  phone           text,
  email           text,
  map_url         text,
  website_url     text,
  logo_url        text,
  image_url       text,
  admissions_open boolean not null default true,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles
  add column campus_id uuid references public.campuses (id) on delete set null;

-- ---------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER for the same reason as in 0001)
--
-- is_admin() / can_edit_content() now mean GROUP level: a campus admin
-- must not be able to edit site-wide content or manage other users.
-- Existing admins have campus_id NULL, so nothing changes for them.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and campus_id is null
  );
$$;

create or replace function public.can_edit_content()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor') and campus_id is null
  );
$$;

create function public.is_group_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin();
$$;

-- True for a group admin, or for an admin attached to exactly this campus.
create function public.can_manage_campus(p_campus uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and (campus_id is null or campus_id = p_campus)
  );
$$;

-- ---------------------------------------------------------------------
-- Classes (Playgroup -> Grade 9, Kenya CBC stages)
-- ---------------------------------------------------------------------
create table public.grade_levels (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null,
  stage      text not null check (stage in ('pre_primary', 'lower_primary', 'upper_primary', 'junior_school')),
  sort_order integer not null unique
);

create table public.campus_grades (
  campus_id uuid not null references public.campuses (id) on delete cascade,
  grade_id  uuid not null references public.grade_levels (id) on delete cascade,
  capacity  integer not null default 30 check (capacity >= 0),
  primary key (campus_id, grade_id)
);

-- ---------------------------------------------------------------------
-- Students (a minimal record for now: created by enrolling an application)
-- ---------------------------------------------------------------------
create table public.students (
  id                    uuid primary key default gen_random_uuid(),
  admission_number      text not null unique,
  campus_id             uuid not null references public.campuses (id),
  grade_id              uuid not null references public.grade_levels (id),
  first_name            text not null,
  middle_name           text,
  last_name             text not null,
  date_of_birth         date not null,
  gender                text not null check (gender in ('female', 'male')),
  guardian_name         text not null,
  guardian_relationship text,
  guardian_phone        text not null,
  guardian_email        text,
  guardian_address      text,
  medical_notes         text,
  special_needs         text,
  status                text not null default 'active'
                          check (status in ('active', 'transferred', 'graduated', 'withdrawn')),
  enrolled_on           date not null default current_date,
  application_id        uuid unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Admission applications
-- ---------------------------------------------------------------------
create table public.admission_applications (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null unique,
  campus_id             uuid not null references public.campuses (id),
  grade_id              uuid not null references public.grade_levels (id),
  intake_year           integer not null check (intake_year between 2000 and 2100),
  intake_term           smallint not null default 1 check (intake_term between 1 and 3),
  status                text not null default 'submitted'
                          check (status in ('submitted', 'under_review', 'assessment', 'offered',
                                            'accepted', 'enrolled', 'waitlisted', 'declined', 'withdrawn')),

  student_first_name    text not null check (char_length(student_first_name) between 1 and 80),
  student_middle_name   text check (char_length(student_middle_name) <= 80),
  student_last_name     text not null check (char_length(student_last_name) between 1 and 80),
  date_of_birth         date not null,
  gender                text not null check (gender in ('female', 'male')),
  nationality           text check (char_length(nationality) <= 80),
  birth_cert_number     text check (char_length(birth_cert_number) <= 60),
  previous_school       text check (char_length(previous_school) <= 160),
  previous_grade        text check (char_length(previous_grade) <= 60),
  medical_notes         text check (char_length(medical_notes) <= 1000),
  special_needs         text check (char_length(special_needs) <= 1000),

  guardian_name         text not null check (char_length(guardian_name) between 2 and 120),
  guardian_relationship text not null check (char_length(guardian_relationship) between 2 and 60),
  guardian_phone        text not null check (char_length(guardian_phone) between 7 and 40),
  guardian_email        text check (char_length(guardian_email) <= 200),
  guardian_occupation   text check (char_length(guardian_occupation) <= 120),
  guardian_address      text check (char_length(guardian_address) <= 300),
  guardian2_name        text check (char_length(guardian2_name) <= 120),
  guardian2_relationship text check (char_length(guardian2_relationship) <= 60),
  guardian2_phone       text check (char_length(guardian2_phone) <= 40),

  how_heard             text check (char_length(how_heard) <= 160),
  wants_transport       boolean not null default false,
  consent_given         boolean not null check (consent_given),

  assessment_date       date,
  decision_note         text check (char_length(decision_note) <= 1000),  -- shown to the family
  internal_notes        text check (char_length(internal_notes) <= 4000), -- staff only
  reviewed_by           uuid references auth.users (id) on delete set null,
  reviewed_at           timestamptz,
  student_id            uuid references public.students (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.students
  add constraint students_application_fk
  foreign key (application_id) references public.admission_applications (id) on delete set null;

create table public.application_events (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.admission_applications (id) on delete cascade,
  event          text not null,
  from_status    text,
  to_status      text,
  note           text,
  actor          uuid,
  created_at     timestamptz not null default now()
);

-- Per-campus running numbers (application references, admission numbers).
create table public.number_counters (
  campus_id  uuid not null references public.campuses (id) on delete cascade,
  scope      text not null,
  year       integer not null,
  last_value integer not null default 0,
  primary key (campus_id, scope, year)
);

create index admission_applications_campus_status_idx
  on public.admission_applications (campus_id, status, created_at desc);
create index admission_applications_created_idx
  on public.admission_applications (created_at desc);
create index students_campus_idx on public.students (campus_id, status);
create index application_events_app_idx on public.application_events (application_id, created_at);

create trigger campuses_touch before update on public.campuses
  for each row execute function public.touch_updated_at();
create trigger admission_applications_touch before update on public.admission_applications
  for each row execute function public.touch_updated_at();
create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Numbering
-- ---------------------------------------------------------------------
create function public.next_number(p_campus uuid, p_scope text, p_year integer)
returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  insert into public.number_counters (campus_id, scope, year, last_value)
  values (p_campus, p_scope, p_year, 1)
  on conflict (campus_id, scope, year)
  do update set last_value = public.number_counters.last_value + 1
  returning last_value into v;
  return v;
end;
$$;
revoke all on function public.next_number(uuid, text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Status history + who reviewed
-- ---------------------------------------------------------------------
create function public.application_before_update()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create trigger admission_applications_review before update on public.admission_applications
  for each row execute function public.application_before_update();

create function public.application_log_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, event, to_status)
    values (new.id, 'submitted', new.status);
  elsif new.status is distinct from old.status then
    insert into public.application_events (application_id, event, from_status, to_status, note, actor)
    values (new.id, 'status_changed', old.status, new.status, new.decision_note, auth.uid());
  end if;
  return new;
end;
$$;

create trigger admission_applications_events
  after insert or update on public.admission_applications
  for each row execute function public.application_log_events();

-- ---------------------------------------------------------------------
-- Public function 1: submit an application (the ONLY way a visitor writes)
-- ---------------------------------------------------------------------
create function public.submit_admission_application(p jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_campus   public.campuses%rowtype;
  v_grade_id uuid := nullif(p ->> 'grade_id', '')::uuid;
  v_year     integer := coalesce(nullif(p ->> 'intake_year', '')::integer, extract(year from current_date)::integer);
  v_term     integer := coalesce(nullif(p ->> 'intake_term', '')::integer, 1);
  v_dob      date := nullif(p ->> 'date_of_birth', '')::date;
  v_ref      text;
  v_id       uuid;
  v_seq      integer;
begin
  select * into v_campus from public.campuses
   where id = nullif(p ->> 'campus_id', '')::uuid and is_active;
  if not found then raise exception 'That school is not available.'; end if;
  if not v_campus.admissions_open then
    raise exception '% is not accepting online applications right now.', v_campus.name;
  end if;

  if not exists (select 1 from public.campus_grades where campus_id = v_campus.id and grade_id = v_grade_id) then
    raise exception 'That class is not offered at this school.';
  end if;

  if v_year < extract(year from current_date)::integer
     or v_year > extract(year from current_date)::integer + 2 then
    raise exception 'Please choose an intake year from this year to two years ahead.';
  end if;
  if v_term not between 1 and 3 then raise exception 'Invalid intake term.'; end if;

  if v_dob is null or v_dob > current_date - interval '1 year'
     or v_dob < current_date - interval '19 years' then
    raise exception 'Please check the date of birth.';
  end if;

  if char_length(trim(coalesce(p ->> 'student_first_name', ''))) < 1
     or char_length(trim(coalesce(p ->> 'student_last_name', ''))) < 1 then
    raise exception 'Please enter the child''s first and last name.';
  end if;
  if coalesce(p ->> 'gender', '') not in ('female', 'male') then
    raise exception 'Please choose the child''s gender.';
  end if;
  if char_length(trim(coalesce(p ->> 'guardian_name', ''))) < 2
     or char_length(trim(coalesce(p ->> 'guardian_relationship', ''))) < 2 then
    raise exception 'Please enter the parent or guardian''s name and relationship to the child.';
  end if;
  if char_length(regexp_replace(coalesce(p ->> 'guardian_phone', ''), '\D', '', 'g')) < 9 then
    raise exception 'Please enter a valid phone number for the parent or guardian.';
  end if;

  if coalesce((p ->> 'consent_given')::boolean, false) is not true then
    raise exception 'Please confirm the declaration before submitting.';
  end if;

  v_seq := public.next_number(v_campus.id, 'application', v_year);
  v_ref := 'APP-' || v_campus.code || '-' || right(v_year::text, 2) || '-' ||
           lpad(v_seq::text, 4, '0') || '-' ||
           upper(substr(md5(random()::text || clock_timestamp()::text), 1, 3));

  insert into public.admission_applications (
    reference, campus_id, grade_id, intake_year, intake_term,
    student_first_name, student_middle_name, student_last_name, date_of_birth, gender,
    nationality, birth_cert_number, previous_school, previous_grade, medical_notes, special_needs,
    guardian_name, guardian_relationship, guardian_phone, guardian_email, guardian_occupation, guardian_address,
    guardian2_name, guardian2_relationship, guardian2_phone,
    how_heard, wants_transport, consent_given
  ) values (
    v_ref, v_campus.id, v_grade_id, v_year, v_term,
    trim(p ->> 'student_first_name'), nullif(trim(p ->> 'student_middle_name'), ''),
    trim(p ->> 'student_last_name'), v_dob, p ->> 'gender',
    nullif(trim(p ->> 'nationality'), ''), nullif(trim(p ->> 'birth_cert_number'), ''),
    nullif(trim(p ->> 'previous_school'), ''), nullif(trim(p ->> 'previous_grade'), ''),
    nullif(trim(p ->> 'medical_notes'), ''), nullif(trim(p ->> 'special_needs'), ''),
    trim(p ->> 'guardian_name'), trim(p ->> 'guardian_relationship'), trim(p ->> 'guardian_phone'),
    nullif(trim(p ->> 'guardian_email'), ''), nullif(trim(p ->> 'guardian_occupation'), ''),
    nullif(trim(p ->> 'guardian_address'), ''),
    nullif(trim(p ->> 'guardian2_name'), ''), nullif(trim(p ->> 'guardian2_relationship'), ''),
    nullif(trim(p ->> 'guardian2_phone'), ''),
    nullif(trim(p ->> 'how_heard'), ''), coalesce((p ->> 'wants_transport')::boolean, false), true
  ) returning id into v_id;

  return v_ref;
end;
$$;

-- ---------------------------------------------------------------------
-- Public function 2: let a family check their own application
-- Needs BOTH the reference and the guardian's phone number.
-- ---------------------------------------------------------------------
create function public.get_application_status(p_reference text, p_phone text)
returns table (
  reference       text,
  status          text,
  student_name    text,
  campus_name     text,
  grade_name      text,
  intake_year     integer,
  assessment_date date,
  decision_note   text,
  updated_at      timestamptz,
  history         jsonb
)
language plpgsql security definer set search_path = public as $$
declare
  v_digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
begin
  if char_length(v_digits) < 7 then
    perform pg_sleep(0.4);
    return;
  end if;

  return query
  select a.reference, a.status,
         a.student_first_name || ' ' || a.student_last_name,
         c.name, g.name, a.intake_year, a.assessment_date, a.decision_note, a.updated_at,
         coalesce((
           select jsonb_agg(jsonb_build_object('status', e.to_status, 'at', e.created_at) order by e.created_at)
             from public.application_events e
            where e.application_id = a.id and e.to_status is not null
         ), '[]'::jsonb)
    from public.admission_applications a
    join public.campuses c on c.id = a.campus_id
    join public.grade_levels g on g.id = a.grade_id
   where upper(a.reference) = upper(trim(p_reference))
     and (right(regexp_replace(a.guardian_phone, '\D', '', 'g'), 9) = v_digits
          or right(regexp_replace(coalesce(a.guardian2_phone, ''), '\D', '', 'g'), 9) = v_digits);

  if not found then perform pg_sleep(0.4); end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Staff function: turn an offered/accepted application into a student
-- (atomic: creates the student, issues the admission number, closes the file)
-- ---------------------------------------------------------------------
create function public.enrol_application(p_application_id uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a        public.admission_applications%rowtype;
  v_seq    integer;
  v_number text;
  v_code   text;
  v_student uuid;
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

  return v_student;
end;
$$;

-- ---------------------------------------------------------------------
-- Function permissions
-- ---------------------------------------------------------------------
revoke all on function public.submit_admission_application(jsonb) from public;
revoke all on function public.get_application_status(text, text) from public;
revoke all on function public.enrol_application(uuid) from public;
grant execute on function public.submit_admission_application(jsonb) to anon, authenticated;
grant execute on function public.get_application_status(text, text) to anon, authenticated;
grant execute on function public.enrol_application(uuid) to authenticated;
grant execute on function public.can_manage_campus(uuid) to anon, authenticated;
grant execute on function public.is_group_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.campuses                enable row level security;
alter table public.grade_levels            enable row level security;
alter table public.campus_grades           enable row level security;
alter table public.students                enable row level security;
alter table public.admission_applications  enable row level security;
alter table public.application_events      enable row level security;
alter table public.number_counters         enable row level security;  -- no policies: functions only

-- campuses: the public sees active schools; only group admins change them
create policy "active campuses are public" on public.campuses
  for select using (is_active or public.can_manage_campus(id));
create policy "group admins add campuses" on public.campuses
  for insert with check (public.is_group_admin());
create policy "group admins edit campuses" on public.campuses
  for update using (public.is_group_admin()) with check (public.is_group_admin());
create policy "group admins delete campuses" on public.campuses
  for delete using (public.is_group_admin());

-- classes
create policy "classes are public" on public.grade_levels for select using (true);
create policy "group admins manage classes" on public.grade_levels
  for all using (public.is_group_admin()) with check (public.is_group_admin());

create policy "campus classes are public" on public.campus_grades for select using (true);
create policy "campus admins manage their classes" on public.campus_grades
  for all using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));

-- applications: staff only (visitors use the functions above)
create policy "staff read their campus applications" on public.admission_applications
  for select using (public.can_manage_campus(campus_id));
create policy "staff update their campus applications" on public.admission_applications
  for update using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));
create policy "group admins delete applications" on public.admission_applications
  for delete using (public.is_group_admin());

create policy "staff read application history" on public.application_events
  for select using (exists (
    select 1 from public.admission_applications a
     where a.id = application_id and public.can_manage_campus(a.campus_id)
  ));

-- students
create policy "staff read their campus students" on public.students
  for select using (public.can_manage_campus(campus_id));
create policy "staff update their campus students" on public.students
  for update using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));
create policy "group admins delete students" on public.students
  for delete using (public.is_group_admin());

-- ---------------------------------------------------------------------
-- Seed: classes and the first school (the existing Sibiah Star School)
-- ---------------------------------------------------------------------
insert into public.grade_levels (code, name, stage, sort_order) values
  ('PLAYGROUP', 'Playgroup', 'pre_primary',   0),
  ('PP1',       'PP1',       'pre_primary',   1),
  ('PP2',       'PP2',       'pre_primary',   2),
  ('G1',        'Grade 1',   'lower_primary', 3),
  ('G2',        'Grade 2',   'lower_primary', 4),
  ('G3',        'Grade 3',   'lower_primary', 5),
  ('G4',        'Grade 4',   'upper_primary', 6),
  ('G5',        'Grade 5',   'upper_primary', 7),
  ('G6',        'Grade 6',   'upper_primary', 8),
  ('G7',        'Grade 7',   'junior_school', 9),
  ('G8',        'Grade 8',   'junior_school', 10),
  ('G9',        'Grade 9',   'junior_school', 11);

insert into public.campuses (code, name, slug, tagline, sort_order)
values ('SSS', 'Sibiah Star School', 'sibiah-star-school', 'Pre-school to Grade 9', 1);

insert into public.campus_grades (campus_id, grade_id, capacity)
select c.id, g.id, 30
  from public.campuses c cross join public.grade_levels g
 where c.code = 'SSS';

-- ---------------------------------------------------------------------
-- HOW TO ADD THE SECOND SCHOOL: sign in to /admin as a group admin and use
-- Admin > Campuses > Add campus. (No SQL needed.)
--
-- HOW TO MAKE A CAMPUS ADMIN: create the user in Supabase Auth, then run
--   update public.profiles
--      set role = 'admin',
--          campus_id = (select id from public.campuses where code = 'SSS')
--    where id = '<that user''s id>';
-- ---------------------------------------------------------------------
