-- =====================================================================
-- 0009  Phase 2: classes & streams, teachers, parent accounts
--       + SECURITY: people can no longer change their own role.
--
--   * classes (a year's "Grade 4 Blue"), pupils placed in them
--   * teachers attached to classes (one class teacher + subject teachers)
--   * parents create an account and link their children by proving the
--     admission number AND the phone number on file; they then see only
--     their own children (through checked functions, never raw tables)
--
-- Run once, after 0008.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Nobody may change their own role / school access (same as the hotfix)
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.campus_id is distinct from old.campus_id) then
    if auth.uid() is not null
       and coalesce(current_setting('app.privileged_change', true), '') <> 'on'
       and not public.is_group_admin() then
      raise exception 'You cannot change role or school access.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Campus admins may see (not edit) the teachers of their own school.
create policy "campus admins read their teachers" on public.profiles
  for select using (role = 'teacher' and campus_id is not null and public.can_manage_campus(campus_id));

-- ---------------------------------------------------------------------
-- 1. Classes
-- ---------------------------------------------------------------------
create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  campus_id  uuid not null references public.campuses (id) on delete cascade,
  grade_id   uuid not null references public.grade_levels (id),
  year       integer not null check (year between 2000 and 2100),
  stream     text not null default '' check (char_length(stream) <= 30),
  capacity   integer not null default 40 check (capacity between 1 and 200),
  created_at timestamptz not null default now()
);
create unique index classes_unique on public.classes (campus_id, grade_id, year, lower(stream));
create index classes_campus_year_idx on public.classes (campus_id, year);

alter table public.students add column class_id uuid references public.classes (id) on delete set null;
create index students_class_idx on public.students (class_id);

create or replace function public.check_student_class()
returns trigger language plpgsql security definer set search_path = public as $$
declare c public.classes%rowtype;
begin
  if new.class_id is not null then
    select * into c from public.classes where id = new.class_id;
    if not found or c.campus_id <> new.campus_id or c.grade_id <> new.grade_id then
      raise exception 'That class belongs to a different school or grade.';
    end if;
  end if;
  return new;
end;
$$;
create trigger students_class_check before insert or update of class_id, campus_id, grade_id on public.students
  for each row execute function public.check_student_class();

-- ---------------------------------------------------------------------
-- 2. Teachers on classes
-- ---------------------------------------------------------------------
create table public.class_teachers (
  class_id         uuid not null references public.classes (id) on delete cascade,
  teacher_id       uuid not null references public.profiles (id) on delete cascade,
  is_class_teacher boolean not null default false,
  subject          text check (char_length(subject) <= 60),
  created_at       timestamptz not null default now(),
  primary key (class_id, teacher_id)
);
create unique index class_teachers_one_head on public.class_teachers (class_id) where is_class_teacher;
create index class_teachers_teacher_idx on public.class_teachers (teacher_id);

create or replace function public.check_class_teacher()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.profiles%rowtype; c public.classes%rowtype;
begin
  select * into p from public.profiles where id = new.teacher_id;
  select * into c from public.classes where id = new.class_id;
  if p.id is null or p.role <> 'teacher' then raise exception 'That person is not a teacher.'; end if;
  if p.campus_id is distinct from c.campus_id then raise exception 'That teacher belongs to a different school.'; end if;
  return new;
end;
$$;
create trigger class_teachers_check before insert or update on public.class_teachers
  for each row execute function public.check_class_teacher();

-- ---------------------------------------------------------------------
-- 3. Parent links
-- ---------------------------------------------------------------------
create table public.guardian_links (
  user_id    uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, student_id)
);
create index guardian_links_student_idx on public.guardian_links (student_id);

create table public.guardian_claim_failures (
  id      bigint generated always as identity primary key,
  user_id uuid not null,
  at      timestamptz not null default now()
);
create index guardian_claim_failures_idx on public.guardian_claim_failures (user_id, at);

-- ---------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------
alter table public.classes enable row level security;
alter table public.class_teachers enable row level security;
alter table public.guardian_links enable row level security;
alter table public.guardian_claim_failures enable row level security;

-- Helpers read the other table as the database owner, so the policies below cannot loop into each other.
create or replace function public._is_teacher_of_class(p_class uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_teachers where class_id = p_class and teacher_id = auth.uid())
$$;
create or replace function public._class_campus(p_class uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select campus_id from public.classes where id = p_class
$$;

create policy "staff and own teachers read classes" on public.classes
  for select using (public.can_manage_campus(campus_id) or public._is_teacher_of_class(id));
create policy "staff write classes" on public.classes
  for all using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));

create policy "staff and the teacher read class teachers" on public.class_teachers
  for select using (teacher_id = auth.uid() or public.can_manage_campus(public._class_campus(class_id)));
create policy "staff write class teachers" on public.class_teachers
  for all using (public.can_manage_campus(public._class_campus(class_id)))
  with check (public.can_manage_campus(public._class_campus(class_id)));

-- A teacher sees the pupils of the classes they teach.
create policy "teachers read their pupils" on public.students
  for select using (class_id is not null and public._is_teacher_of_class(class_id));

create policy "parents read their own links" on public.guardian_links
  for select using (user_id = auth.uid());
-- no insert/update/delete policies: links are made only by claim_child()

-- ---------------------------------------------------------------------
-- 5. Staff functions
-- ---------------------------------------------------------------------
create or replace function public.create_class(p_campus uuid, p_grade uuid, p_year integer, p_stream text, p_capacity integer)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.can_manage_campus(p_campus) then raise exception 'You do not have permission for this school.'; end if;
  if not exists (select 1 from public.campus_grades where campus_id = p_campus and grade_id = p_grade) then
    raise exception 'This school does not offer that class. Tick it under Schools first.';
  end if;
  insert into public.classes (campus_id, grade_id, year, stream, capacity)
  values (p_campus, p_grade, p_year, coalesce(trim(p_stream), ''), coalesce(p_capacity, 40))
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'That class already exists for this year.';
end;
$$;

-- Places pupils in a class. A pupil from another grade is moved up/down to this class's grade (promotion).
create or replace function public.place_students(p_class uuid, p_students uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare
  c public.classes%rowtype;
  v_now integer;
  v_new integer;
begin
  select * into c from public.classes where id = p_class;
  if not found then raise exception 'Class not found.'; end if;
  if not public.can_manage_campus(c.campus_id) then raise exception 'You do not have permission for this school.'; end if;
  if p_students is null or array_length(p_students, 1) is null then return 0; end if;

  select count(*) into v_now from public.students where class_id = c.id;
  select count(*) into v_new from public.students
   where id = any (p_students) and campus_id = c.campus_id and status = 'active' and class_id is distinct from c.id;
  if v_now + v_new > c.capacity then
    raise exception 'This class holds % pupils and already has %. Raise its capacity first.', c.capacity, v_now;
  end if;

  update public.students
     set class_id = c.id, grade_id = c.grade_id
   where id = any (p_students) and campus_id = c.campus_id and status = 'active' and class_id is distinct from c.id;
  get diagnostics v_new = row_count;
  return v_new;
end;
$$;

create or replace function public.place_unplaced(p_class uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare c public.classes%rowtype; v_room integer; v_ids uuid[];
begin
  select * into c from public.classes where id = p_class;
  if not found then raise exception 'Class not found.'; end if;
  if not public.can_manage_campus(c.campus_id) then raise exception 'You do not have permission for this school.'; end if;
  v_room := c.capacity - (select count(*) from public.students where class_id = c.id);
  if v_room <= 0 then raise exception 'This class is full.'; end if;
  select array_agg(id) into v_ids from (
    select id from public.students
     where campus_id = c.campus_id and grade_id = c.grade_id and status = 'active' and class_id is null
     order by last_name, first_name limit v_room) s;
  if v_ids is null then return 0; end if;
  return public.place_students(c.id, v_ids);
end;
$$;

create or replace function public.remove_from_class(p_student uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_campus uuid;
begin
  select campus_id into v_campus from public.students where id = p_student;
  if v_campus is null then raise exception 'Student not found.'; end if;
  if not public.can_manage_campus(v_campus) then raise exception 'You do not have permission for this school.'; end if;
  update public.students set class_id = null where id = p_student;
end;
$$;

create or replace function public.assign_class_teacher(p_class uuid, p_teacher uuid, p_is_head boolean, p_subject text)
returns void language plpgsql security definer set search_path = public as $$
declare v_campus uuid;
begin
  select campus_id into v_campus from public.classes where id = p_class;
  if v_campus is null then raise exception 'Class not found.'; end if;
  if not public.can_manage_campus(v_campus) then raise exception 'You do not have permission for this school.'; end if;
  if p_is_head then
    update public.class_teachers set is_class_teacher = false where class_id = p_class and teacher_id <> p_teacher;
  end if;
  insert into public.class_teachers (class_id, teacher_id, is_class_teacher, subject)
  values (p_class, p_teacher, coalesce(p_is_head, false), nullif(trim(p_subject), ''))
  on conflict (class_id, teacher_id) do update
     set is_class_teacher = excluded.is_class_teacher, subject = excluded.subject;
end;
$$;

create or replace function public.remove_class_teacher(p_class uuid, p_teacher uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_campus uuid;
begin
  select campus_id into v_campus from public.classes where id = p_class;
  if v_campus is null then raise exception 'Class not found.'; end if;
  if not public.can_manage_campus(v_campus) then raise exception 'You do not have permission for this school.'; end if;
  delete from public.class_teachers where class_id = p_class and teacher_id = p_teacher;
end;
$$;

create or replace function public.delete_class(p_class uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_campus uuid;
begin
  select campus_id into v_campus from public.classes where id = p_class;
  if v_campus is null then raise exception 'Class not found.'; end if;
  if not public.can_manage_campus(v_campus) then raise exception 'You do not have permission for this school.'; end if;
  if exists (select 1 from public.students where class_id = p_class) then
    raise exception 'Move the pupils out of this class before deleting it.';
  end if;
  delete from public.classes where id = p_class;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Fee account: one internal builder, used by the public lookup and by logged-in parents
-- ---------------------------------------------------------------------
create or replace function public._fee_account(p_student uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.students%rowtype;
  c public.campuses%rowtype;
  v_entries jsonb;
begin
  select * into s from public.students where id = p_student;
  if not found then return null; end if;
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
revoke all on function public._fee_account(uuid) from public, anon, authenticated;

create or replace function public.get_fee_account(p_admission_number text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.students%rowtype;
  v_digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
begin
  if char_length(v_digits) < 7 then perform pg_sleep(0.4); return null; end if;
  select * into s from public.students
   where admission_number = public._normalize_admission(p_admission_number)
     and right(regexp_replace(guardian_phone, '\D', '', 'g'), 9) = v_digits;
  if not found then perform pg_sleep(0.4); return null; end if;
  return public._fee_account(s.id);
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Parent functions (signed-in users only)
-- ---------------------------------------------------------------------
create or replace function public._class_label(p_class uuid)
returns text language sql stable security definer set search_path = public as $$
  select g.name || case when nullif(c.stream, '') is null then '' else ' ' || c.stream end
    from public.classes c join public.grade_levels g on g.id = c.grade_id where c.id = p_class
$$;
revoke all on function public._class_label(uuid) from public, anon, authenticated;

-- A parent proves the child is theirs: admission number AND the phone number the school holds.
create or replace function public.claim_child(p_admission_number text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.students%rowtype;
  v_user uuid := auth.uid();
  v_digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
begin
  if v_user is null then raise exception 'Please sign in first.'; end if;
  if (select count(*) from public.guardian_claim_failures where user_id = v_user and at > now() - interval '1 hour') >= 8 then
    raise exception 'Too many wrong attempts. Please try again in an hour, or ask the school office.';
  end if;
  if (select count(*) from public.guardian_links where user_id = v_user) >= 15 then
    raise exception 'This account already has the maximum number of children linked.';
  end if;

  select * into s from public.students
   where admission_number = public._normalize_admission(p_admission_number)
     and char_length(v_digits) >= 7
     and right(regexp_replace(guardian_phone, '\D', '', 'g'), 9) = v_digits
     and status = 'active';
  if not found then
    insert into public.guardian_claim_failures (user_id) values (v_user);
    perform pg_sleep(0.4);
    return null;
  end if;

  insert into public.guardian_links (user_id, student_id) values (v_user, s.id) on conflict do nothing;
  -- a new account starts as 'student'; becoming a parent is the only role change this function makes
  perform set_config('app.privileged_change', 'on', true);
  update public.profiles set role = 'parent' where id = v_user and role = 'student';
  perform set_config('app.privileged_change', 'off', true);
  return jsonb_build_object('student_id', s.id, 'student_name', s.first_name || ' ' || s.last_name, 'admission_number', s.admission_number);
end;
$$;

create or replace function public.my_children()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
        'student_id', s.id,
        'name', s.first_name || ' ' || s.last_name,
        'admission_number', s.admission_number,
        'school', c.name,
        'class_name', public._class_label(s.class_id),
        'class_teacher', (select p.full_name from public.class_teachers ct join public.profiles p on p.id = ct.teacher_id
                           where ct.class_id = s.class_id and ct.is_class_teacher),
        'balance_cents', public._balance(s.id)
      ) order by s.first_name)
    from public.guardian_links l
    join public.students s on s.id = l.student_id and s.status = 'active'
    join public.campuses c on c.id = s.campus_id
    where l.user_id = auth.uid()
  ), '[]'::jsonb);
end;
$$;

create or replace function public.my_child_account(p_student uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null
     or not exists (select 1 from public.guardian_links where user_id = auth.uid() and student_id = p_student) then
    return null;
  end if;
  return public._fee_account(p_student);
end;
$$;

create or replace function public.unlink_child(p_student uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.guardian_links where user_id = auth.uid() and student_id = p_student;
$$;

-- ---------------------------------------------------------------------
-- 8. Grants
-- ---------------------------------------------------------------------
revoke all on function public.create_class(uuid, uuid, integer, text, integer) from public;
revoke all on function public.place_students(uuid, uuid[]) from public;
revoke all on function public.place_unplaced(uuid) from public;
revoke all on function public.remove_from_class(uuid) from public;
revoke all on function public.assign_class_teacher(uuid, uuid, boolean, text) from public;
revoke all on function public.remove_class_teacher(uuid, uuid) from public;
revoke all on function public.delete_class(uuid) from public;
revoke all on function public.claim_child(text, text) from public;
revoke all on function public.my_children() from public;
revoke all on function public.my_child_account(uuid) from public;
revoke all on function public.unlink_child(uuid) from public;

grant execute on function public.create_class(uuid, uuid, integer, text, integer) to authenticated;
grant execute on function public.place_students(uuid, uuid[]) to authenticated;
grant execute on function public.place_unplaced(uuid) to authenticated;
grant execute on function public.remove_from_class(uuid) to authenticated;
grant execute on function public.assign_class_teacher(uuid, uuid, boolean, text) to authenticated;
grant execute on function public.remove_class_teacher(uuid, uuid) to authenticated;
grant execute on function public.delete_class(uuid) to authenticated;
grant execute on function public.claim_child(text, text) to authenticated;
grant execute on function public.my_children() to authenticated;
grant execute on function public.my_child_account(uuid) to authenticated;
grant execute on function public.unlink_child(uuid) to authenticated;
