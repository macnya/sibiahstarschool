-- 0012: exams, marks, CBC performance levels and report cards. Run after 0011.

create table public.learning_areas (
  id         uuid primary key default gen_random_uuid(),
  campus_id  uuid not null references public.campuses (id) on delete cascade,
  stage      text not null check (stage in ('pre_primary', 'lower_primary', 'upper_primary', 'junior_school')),
  name       text not null check (char_length(name) between 2 and 80),
  sort_order integer not null default 0
);
create unique index learning_areas_unique on public.learning_areas (campus_id, stage, lower(name));

-- Score bands. Edit these rows in the Supabase table editor if your school or KNEC uses different cut-offs.
create table public.grading_bands (
  stage     text not null check (stage in ('pre_primary', 'lower_primary', 'upper_primary', 'junior_school')),
  min_score numeric(5,2) not null check (min_score between 0 and 100),
  code      text not null,
  label     text not null,
  points    integer not null,
  primary key (stage, min_score)
);
insert into public.grading_bands (stage, min_score, code, label, points)
select s, b.min_score, b.code, b.label, b.points
  from unnest(array['pre_primary', 'lower_primary', 'upper_primary']) s
  cross join (values (75, 'EE', 'Exceeding Expectations', 4), (41, 'ME', 'Meeting Expectations', 3),
                     (21, 'AE', 'Approaching Expectations', 2), (0, 'BE', 'Below Expectations', 1)) b(min_score, code, label, points);
insert into public.grading_bands (stage, min_score, code, label, points) values
  ('junior_school', 90, 'EE1', 'Exceptional', 8), ('junior_school', 75, 'EE2', 'Very Good', 7),
  ('junior_school', 58, 'ME1', 'Good', 6), ('junior_school', 41, 'ME2', 'Fair', 5),
  ('junior_school', 31, 'AE1', 'Needs Improvement', 4), ('junior_school', 21, 'AE2', 'Below Average', 3),
  ('junior_school', 11, 'BE1', 'Well Below Average', 2), ('junior_school', 0, 'BE2', 'Minimal', 1);

create table public.exams (
  id            uuid primary key default gen_random_uuid(),
  campus_id     uuid not null references public.campuses (id) on delete cascade,
  name          text not null check (char_length(name) between 2 and 80),
  year          integer not null check (year between 2000 and 2100),
  term          smallint not null check (term between 1 and 3),
  is_published  boolean not null default false,
  show_position boolean not null default false,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create unique index exams_unique on public.exams (campus_id, year, term, lower(name));

create table public.marks (
  id         uuid primary key default gen_random_uuid(),
  exam_id    uuid not null references public.exams (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  area_id    uuid not null references public.learning_areas (id) on delete restrict,
  score      numeric(5,2) not null check (score between 0 and 100),
  entered_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (exam_id, student_id, area_id)
);
create index marks_exam_student_idx on public.marks (exam_id, student_id);

create table public.report_comments (
  exam_id         uuid not null references public.exams (id) on delete cascade,
  student_id      uuid not null references public.students (id) on delete cascade,
  teacher_comment text check (char_length(teacher_comment) <= 500),
  head_comment    text check (char_length(head_comment) <= 500),
  primary key (exam_id, student_id)
);

alter table public.learning_areas enable row level security;
alter table public.grading_bands enable row level security;
alter table public.exams enable row level security;
alter table public.marks enable row level security;
alter table public.report_comments enable row level security;

create or replace function public._teacher_in_campus(p_campus uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_teachers ct join public.classes c on c.id = ct.class_id
                  where ct.teacher_id = auth.uid() and c.campus_id = p_campus)
$$;
create or replace function public._teacher_of_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s join public.class_teachers ct on ct.class_id = s.class_id
                  where s.id = p_student and ct.teacher_id = auth.uid())
$$;
create or replace function public._is_class_teacher_of_student(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students s join public.class_teachers ct on ct.class_id = s.class_id
                  where s.id = p_student and ct.teacher_id = auth.uid() and ct.is_class_teacher)
$$;

create policy areas_read on public.learning_areas for select to authenticated
  using (public.can_manage_campus(campus_id) or public._teacher_in_campus(campus_id));
create policy areas_write on public.learning_areas for all to authenticated
  using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));
create policy bands_read on public.grading_bands for select to authenticated using (true);
create policy exams_read on public.exams for select to authenticated
  using (public.can_manage_campus(campus_id) or public._teacher_in_campus(campus_id));
create policy exams_write on public.exams for all to authenticated
  using (public.can_manage_campus(campus_id)) with check (public.can_manage_campus(campus_id));
create policy marks_read on public.marks for select to authenticated
  using (public._teacher_of_student(student_id) or exists (select 1 from public.students s where s.id = student_id and public.can_manage_campus(s.campus_id)));
create policy comments_read on public.report_comments for select to authenticated
  using (public._teacher_of_student(student_id) or exists (select 1 from public.students s where s.id = student_id and public.can_manage_campus(s.campus_id)));

revoke all on public.learning_areas, public.grading_bands, public.exams, public.marks, public.report_comments from anon, authenticated;
grant select on public.grading_bands, public.marks, public.report_comments to authenticated;
grant select, insert, update, delete on public.learning_areas, public.exams to authenticated;

-- Standard CBC learning areas for every school (safe to run again; adds only what is missing).
create or replace function public._seed_areas(p_campus uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.learning_areas (campus_id, stage, name, sort_order)
  select p_campus, v.stage, v.name, v.ord
    from (values
      ('pre_primary', 'Language Activities', 1), ('pre_primary', 'Mathematical Activities', 2), ('pre_primary', 'Environmental Activities', 3),
      ('pre_primary', 'Creative Activities', 4), ('pre_primary', 'Religious Activities', 5),
      ('lower_primary', 'English', 1), ('lower_primary', 'Kiswahili', 2), ('lower_primary', 'Indigenous Language', 3), ('lower_primary', 'Mathematics', 4),
      ('lower_primary', 'Environmental Activities', 5), ('lower_primary', 'Religious Education', 6), ('lower_primary', 'Creative Activities', 7),
      ('upper_primary', 'English', 1), ('upper_primary', 'Kiswahili', 2), ('upper_primary', 'Mathematics', 3), ('upper_primary', 'Science and Technology', 4),
      ('upper_primary', 'Agriculture and Nutrition', 5), ('upper_primary', 'Social Studies', 6), ('upper_primary', 'Religious Education', 7),
      ('upper_primary', 'Creative Arts', 8), ('upper_primary', 'Physical and Health Education', 9),
      ('junior_school', 'English', 1), ('junior_school', 'Kiswahili', 2), ('junior_school', 'Mathematics', 3), ('junior_school', 'Integrated Science', 4),
      ('junior_school', 'Health Education', 5), ('junior_school', 'Pre-Technical Studies', 6), ('junior_school', 'Social Studies', 7),
      ('junior_school', 'Religious Education', 8), ('junior_school', 'Business Studies', 9), ('junior_school', 'Agriculture', 10),
      ('junior_school', 'Life Skills Education', 11), ('junior_school', 'Sports and Physical Education', 12), ('junior_school', 'Creative Arts', 13)
    ) v(stage, name, ord)
  on conflict do nothing;
$$;
create or replace function public.seed_learning_areas(p_campus uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.can_manage_campus(p_campus) then raise exception 'Not allowed'; end if;
  perform public._seed_areas(p_campus);
end;
$$;
select public._seed_areas(id) from public.campuses;

-- Teachers (of the class) or school staff enter one learning area for a whole class.
-- p_rows = [{"student_id": "...", "score": 78.5 or null}]
create or replace function public.save_marks(p_exam uuid, p_class uuid, p_area uuid, p_rows jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare
  e public.exams%rowtype;
  v_campus uuid := public._class_campus(p_class);
  v_stage text;
  v_staff boolean;
  r jsonb;
  v_student uuid;
  v_score numeric;
  n integer := 0;
begin
  if auth.uid() is null or v_campus is null then raise exception 'Not allowed'; end if;
  v_staff := public.can_manage_campus(v_campus);
  if not v_staff and not public._is_teacher_of_class(p_class) then raise exception 'Not allowed'; end if;
  select * into e from public.exams where id = p_exam and campus_id = v_campus;
  if not found then raise exception 'That exam is not for this school'; end if;
  if e.is_published and not v_staff then raise exception 'This exam is published. Ask the office to change marks.'; end if;
  select g.stage into v_stage from public.classes c join public.grade_levels g on g.id = c.grade_id where c.id = p_class;
  if not exists (select 1 from public.learning_areas where id = p_area and campus_id = v_campus and stage = v_stage) then
    raise exception 'That learning area does not belong to this class';
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 300 then raise exception 'Bad marks list'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_student := (r ->> 'student_id')::uuid;
    if not exists (select 1 from public.students where id = v_student and class_id = p_class) then raise exception 'A pupil in the list is not in this class'; end if;
    if r -> 'score' is null or jsonb_typeof(r -> 'score') = 'null' then
      delete from public.marks where exam_id = p_exam and student_id = v_student and area_id = p_area;
    else
      v_score := (r ->> 'score')::numeric;
      if v_score < 0 or v_score > 100 then raise exception 'Marks must be between 0 and 100'; end if;
      insert into public.marks (exam_id, student_id, area_id, score, entered_by, updated_at)
        values (p_exam, v_student, p_area, v_score, auth.uid(), now())
        on conflict (exam_id, student_id, area_id) do update set score = excluded.score, entered_by = excluded.entered_by, updated_at = now();
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- Comments: the class teacher writes the teacher's comment; staff may write both.
create or replace function public.save_comment(p_exam uuid, p_student uuid, p_teacher text, p_head text)
returns void language plpgsql security definer set search_path = public as $$
declare
  s public.students%rowtype;
  e public.exams%rowtype;
  v_staff boolean;
begin
  if auth.uid() is null then raise exception 'Not allowed'; end if;
  select * into s from public.students where id = p_student;
  select * into e from public.exams where id = p_exam;
  if s.id is null or e.id is null or e.campus_id <> s.campus_id then raise exception 'Not allowed'; end if;
  v_staff := public.can_manage_campus(s.campus_id);
  if not v_staff and not public._is_class_teacher_of_student(p_student) then raise exception 'Only the class teacher can write comments'; end if;
  if e.is_published and not v_staff then raise exception 'This exam is published. Ask the office to change comments.'; end if;
  insert into public.report_comments (exam_id, student_id, teacher_comment, head_comment)
    values (p_exam, p_student, left(nullif(trim(coalesce(p_teacher, '')), ''), 500), case when v_staff then left(nullif(trim(coalesce(p_head, '')), ''), 500) end)
    on conflict (exam_id, student_id) do update
      set teacher_comment = excluded.teacher_comment,
          head_comment = case when v_staff then excluded.head_comment else public.report_comments.head_comment end;
end;
$$;

-- One pupil's report card as JSON. Staff and the pupil's teachers: any exam. A linked parent: published exams only.
create or replace function public.report_card(p_exam uuid, p_student uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  e public.exams%rowtype;
  s public.students%rowtype;
  g public.grade_levels%rowtype;
  v_ok boolean;
  v_rows jsonb;
  v_avg numeric;
  v_total numeric;
  v_count integer;
  v_pos integer;
  v_size integer;
  v_class text;
  cm public.report_comments%rowtype;
begin
  select * into e from public.exams where id = p_exam;
  select * into s from public.students where id = p_student;
  if e.id is null or s.id is null or e.campus_id <> s.campus_id then return null; end if;
  v_ok := auth.uid() is not null and (
            public.can_manage_campus(s.campus_id) or public._teacher_of_student(p_student)
            or (e.is_published and exists (select 1 from public.guardian_links where user_id = auth.uid() and student_id = p_student)));
  if not v_ok then return null; end if;
  select * into g from public.grade_levels where id = s.grade_id;

  select coalesce(jsonb_agg(jsonb_build_object('area', a.name, 'score', m.score, 'code', b.code, 'label', b.label, 'points', b.points) order by a.sort_order, a.name), '[]'::jsonb),
         avg(m.score), sum(m.score), count(m.score)
    into v_rows, v_avg, v_total, v_count
    from public.learning_areas a
    left join public.marks m on m.area_id = a.id and m.exam_id = p_exam and m.student_id = p_student
    left join lateral (select * from public.grading_bands gb where gb.stage = g.stage and gb.min_score <= m.score order by gb.min_score desc limit 1) b on m.score is not null
   where a.campus_id = s.campus_id and a.stage = g.stage;

  if e.show_position and s.class_id is not null and v_count > 0 then
    select count(*) + 1 into v_pos from (
      select ms.student_id, avg(ms.score) av from public.marks ms join public.students st on st.id = ms.student_id
       where ms.exam_id = p_exam and st.class_id = s.class_id group by ms.student_id) x where x.av > v_avg;
    select count(distinct ms.student_id) into v_size from public.marks ms join public.students st on st.id = ms.student_id where ms.exam_id = p_exam and st.class_id = s.class_id;
  end if;
  select public._class_label(s.class_id) into v_class;
  select * into cm from public.report_comments where exam_id = p_exam and student_id = p_student;

  return jsonb_build_object(
    'exam', jsonb_build_object('name', e.name, 'year', e.year, 'term', e.term, 'published', e.is_published),
    'student', jsonb_build_object('id', s.id, 'name', s.first_name || ' ' || coalesce(s.middle_name || ' ', '') || s.last_name, 'admission', s.admission_number, 'class', v_class, 'grade', g.name, 'stage', g.stage),
    'school', (select name from public.campuses where id = s.campus_id),
    'rows', v_rows, 'areas_scored', v_count,
    'average', round(v_avg, 1), 'total', v_total,
    'average_level', (select jsonb_build_object('code', b.code, 'label', b.label) from public.grading_bands b where b.stage = g.stage and b.min_score <= v_avg order by b.min_score desc limit 1),
    'position', v_pos, 'class_size', v_size,
    'teacher_comment', cm.teacher_comment, 'head_comment', cm.head_comment);
end;
$$;

create or replace function public.class_report_cards(p_exam uuid, p_class uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_campus uuid := public._class_campus(p_class);
begin
  if auth.uid() is null or v_campus is null or not (public.can_manage_campus(v_campus) or public._is_teacher_of_class(p_class)) then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(public.report_card(p_exam, s.id) order by s.first_name, s.last_name)
                     from public.students s where s.class_id = p_class and s.status = 'active'), '[]'::jsonb);
end;
$$;

-- How many marks are in for each learning area of a class: [{area_id, name, entered, pupils}]
create or replace function public.marks_progress(p_exam uuid, p_class uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_campus uuid := public._class_campus(p_class);
begin
  if auth.uid() is null or v_campus is null or not (public.can_manage_campus(v_campus) or public._is_teacher_of_class(p_class)) then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('area_id', a.id, 'name', a.name,
            'entered', (select count(*) from public.marks m join public.students s on s.id = m.student_id where m.exam_id = p_exam and m.area_id = a.id and s.class_id = p_class),
            'pupils', (select count(*) from public.students s where s.class_id = p_class and s.status = 'active')) order by a.sort_order, a.name)
     from public.learning_areas a join public.classes c on c.id = p_class join public.grade_levels g on g.id = c.grade_id
    where a.campus_id = v_campus and a.stage = g.stage), '[]'::jsonb);
end;
$$;

-- Parent: published exams that have results for this child.
create or replace function public.my_child_exams(p_student uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from public.guardian_links where user_id = auth.uid() and student_id = p_student) then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'year', e.year, 'term', e.term) order by e.year desc, e.term desc, e.created_at desc)
    from public.exams e where e.is_published and exists (select 1 from public.marks m where m.exam_id = e.id and m.student_id = p_student)), '[]'::jsonb);
end;
$$;

revoke all on function public._teacher_in_campus(uuid), public._teacher_of_student(uuid), public._is_class_teacher_of_student(uuid), public._seed_areas(uuid),
  public.seed_learning_areas(uuid), public.save_marks(uuid, uuid, uuid, jsonb), public.save_comment(uuid, uuid, text, text),
  public.report_card(uuid, uuid), public.class_report_cards(uuid, uuid), public.marks_progress(uuid, uuid), public.my_child_exams(uuid) from public, anon, authenticated;
grant execute on function public.seed_learning_areas(uuid), public.save_marks(uuid, uuid, uuid, jsonb), public.save_comment(uuid, uuid, text, text),
  public.report_card(uuid, uuid), public.class_report_cards(uuid, uuid), public.marks_progress(uuid, uuid), public.my_child_exams(uuid) to authenticated;

-- Row Level Security policies call these helpers as the signed-in user, so they must be executable.
grant execute on function public._teacher_in_campus(uuid), public._teacher_of_student(uuid) to authenticated;
