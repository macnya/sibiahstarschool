import 'server-only';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import type { ClassRow, ClassTeacherRow, GradeLevelRow, ProfileRow, StudentRow } from '@/lib/supabase/types';

export { classLabel } from '@/lib/classes/queries-shared';
import { classLabel } from '@/lib/classes/queries-shared';

export interface ClassSummary extends ClassRow {
  label: string;
  pupils: number;
  headTeacher: string | null;
}

export async function getClassSummaries(filters: { campusId?: string; year?: number } = {}) {
  const { supabase, campusId: scoped } = await getAdminContext();
  let query = supabase.from('classes').select('*').order('year', { ascending: false });
  const campusId = scoped ?? filters.campusId;
  if (campusId) query = query.eq('campus_id', campusId);
  if (filters.year) query = query.eq('year', filters.year);
  const [{ data: classRows }, { data: gradeRows }] = await Promise.all([query, supabase.from('grade_levels').select('*').order('sort_order')]);
  const classes = (classRows ?? []) as ClassRow[];
  const grades = (gradeRows ?? []) as GradeLevelRow[];
  if (classes.length === 0) return { classes: [] as ClassSummary[], grades };

  const ids = classes.map((c) => c.id);
  const [{ data: pupilRows }, { data: ctRows }] = await Promise.all([
    supabase.from('students').select('class_id').in('class_id', ids).limit(5000),
    supabase.from('class_teachers').select('*').in('class_id', ids).eq('is_class_teacher', true),
  ]);
  const counts = new Map<string, number>();
  for (const r of (pupilRows ?? []) as { class_id: string }[]) counts.set(r.class_id, (counts.get(r.class_id) ?? 0) + 1);
  const heads = new Map(((ctRows ?? []) as ClassTeacherRow[]).map((r) => [r.class_id, r.teacher_id]));
  const teacherIds = [...new Set(heads.values())];
  const { data: profs } = teacherIds.length ? await supabase.from('profiles').select('id, full_name').in('id', teacherIds) : { data: [] };
  const names = new Map(((profs ?? []) as Pick<ProfileRow, 'id' | 'full_name'>[]).map((p) => [p.id, p.full_name]));
  const gradeName = new Map(grades.map((g) => [g.id, g.name]));

  return {
    grades,
    classes: classes
      .map((c) => ({
        ...c,
        label: classLabel(gradeName.get(c.grade_id), c.stream),
        pupils: counts.get(c.id) ?? 0,
        headTeacher: heads.has(c.id) ? (names.get(heads.get(c.id)!) ?? 'Teacher') : null,
      }))
      .sort((a, b) => (grades.findIndex((g) => g.id === a.grade_id) - grades.findIndex((g) => g.id === b.grade_id)) || a.stream.localeCompare(b.stream)),
  };
}

export async function getClassDetail(id: string) {
  const { supabase } = await getAdminContext();
  const { data: cls } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
  if (!cls) return null;
  const c = cls as ClassRow;
  const [grade, campus, roster, unplaced, cts, teachers] = await Promise.all([
    supabase.from('grade_levels').select('*').eq('id', c.grade_id).maybeSingle(),
    supabase.from('campuses').select('id, name').eq('id', c.campus_id).maybeSingle(),
    supabase.from('students').select('*').eq('class_id', c.id).order('first_name'),
    supabase.from('students').select('*').eq('campus_id', c.campus_id).eq('grade_id', c.grade_id).eq('status', 'active').is('class_id', null).order('first_name'),
    supabase.from('class_teachers').select('*').eq('class_id', c.id),
    supabase.from('profiles').select('id, full_name').eq('role', 'teacher').eq('campus_id', c.campus_id).order('full_name'),
  ]);
  const teacherList = (teachers.data ?? []) as Pick<ProfileRow, 'id' | 'full_name'>[];
  const name = new Map(teacherList.map((t) => [t.id, t.full_name]));
  return {
    cls: c,
    gradeName: (grade.data as GradeLevelRow | null)?.name ?? 'Class',
    campusName: (campus.data as { name: string } | null)?.name ?? '',
    roster: (roster.data ?? []) as StudentRow[],
    unplaced: (unplaced.data ?? []) as StudentRow[],
    assigned: ((cts.data ?? []) as ClassTeacherRow[]).map((r) => ({ ...r, name: name.get(r.teacher_id) ?? 'Teacher' })),
    teachers: teacherList,
  };
}

export async function getTeachers() {
  const { supabase, campusId: scoped } = await getAdminContext();
  let query = supabase.from('profiles').select('*').eq('role', 'teacher').order('full_name');
  if (scoped) query = query.eq('campus_id', scoped);
  const { data } = await query;
  const teachers = (data ?? []) as ProfileRow[];
  const ids = teachers.map((t) => t.id);
  const { data: ct } = ids.length ? await supabase.from('class_teachers').select('*').in('teacher_id', ids) : { data: [] };
  const classIds = [...new Set(((ct ?? []) as ClassTeacherRow[]).map((r) => r.class_id))];
  const { data: cls } = classIds.length ? await supabase.from('classes').select('*').in('id', classIds) : { data: [] };
  const { data: grades } = await supabase.from('grade_levels').select('*');
  const gradeName = new Map(((grades ?? []) as GradeLevelRow[]).map((g) => [g.id, g.name]));
  const classLabelById = new Map(((cls ?? []) as ClassRow[]).map((c) => [c.id, `${classLabel(gradeName.get(c.grade_id), c.stream)} (${c.year})`]));
  return teachers.map((t) => ({
    ...t,
    classes: ((ct ?? []) as ClassTeacherRow[]).filter((r) => r.teacher_id === t.id).map((r) => ({
      label: classLabelById.get(r.class_id) ?? 'Class', head: r.is_class_teacher, subject: r.subject, classId: r.class_id,
    })),
  }));
}

export async function getStudentProfile(id: string) {
  const { supabase } = await getAdminContext();
  const { data: s } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
  if (!s) return null;
  const student = s as StudentRow;
  const [grade, campus, current, options, allGrades, links] = await Promise.all([
    supabase.from('grade_levels').select('*').eq('id', student.grade_id).maybeSingle(),
    supabase.from('campuses').select('id, name').eq('id', student.campus_id).maybeSingle(),
    student.class_id ? supabase.from('classes').select('*').eq('id', student.class_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('classes').select('*').eq('campus_id', student.campus_id).gte('year', new Date().getFullYear() - 1).order('year', { ascending: false }).order('grade_id').order('stream'),
    supabase.from('grade_levels').select('*'),
    supabase.from('guardian_links').select('user_id').eq('student_id', id),
  ]);
  const { data: routeData } = await supabase.from('transport_routes').select('id, name').eq('campus_id', student.campus_id).order('name');
  const gradeRow = grade.data as GradeLevelRow | null;
  const klass = current.data as ClassRow | null;
  return {
    student,
    gradeName: gradeRow?.name ?? '',
    campusName: (campus.data as { name: string } | null)?.name ?? '',
    currentClass: klass ? classLabel(gradeRow?.name, klass.stream) + ` (${klass.year})` : null,
    options: ((options.data ?? []) as ClassRow[])
      .map((c) => ({ id: c.id, order: ((allGrades.data ?? []) as GradeLevelRow[]).find((g) => g.id === c.grade_id)?.sort_order ?? 0, year: c.year,
        label: `${classLabel(((allGrades.data ?? []) as GradeLevelRow[]).find((g) => g.id === c.grade_id)?.name, c.stream)} (${c.year})` }))
      .sort((a, b) => b.year - a.year || a.order - b.order)
      .map(({ id, label }) => ({ id, label })),
    parentAccounts: (links.data ?? []).length,
    routes: (routeData ?? []) as { id: string; name: string }[],
  };
}
