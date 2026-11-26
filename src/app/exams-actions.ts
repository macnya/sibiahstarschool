'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { createClient } from '@/lib/supabase/server';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (f: FormData, k: string, max = 200) => { const v = f.get(k); return typeof v === 'string' ? v.trim().slice(0, max) : ''; };

function go(path: string, error?: string, ok?: string, extra?: Record<string, string>): never {
  const p = new URLSearchParams(extra);
  if (error) p.set('error', error.slice(0, 200));
  if (ok) p.set('ok', ok);
  redirect(`${path}${p.toString() ? `?${p.toString()}` : ''}`);
}

/* ---------- marks and comments: teachers and staff, checked by the database ---------- */

export async function saveMarksAction(formData: FormData) {
  const exam = str(formData, 'exam', 40), classId = str(formData, 'class_id', 40), area = str(formData, 'area', 40);
  if (![exam, classId, area].every((v) => UUID.test(v))) redirect('/');
  const admin = str(formData, 'return_to', 10) === 'admin';
  const path = admin ? `/admin/exams/${exam}/marks` : `/teacher-portal/class/${classId}/marks`;
  const rows: { student_id: string; score: number | null }[] = [];
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith('m_') || typeof v !== 'string' || !UUID.test(k.slice(2))) continue;
    const t = v.trim();
    if (t === '') { rows.push({ student_id: k.slice(2), score: null }); continue; }
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0 || n > 100) go(path, 'Every mark must be a number from 0 to 100.', undefined, { exam, class: classId, area });
    rows.push({ student_id: k.slice(2), score: Math.round(n * 100) / 100 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(admin ? '/staff-login' : '/teacher-portal');
  const { error } = await supabase.rpc('save_marks', { p_exam: exam, p_class: classId, p_area: area, p_rows: rows });
  revalidatePath(path);
  go(path, error?.message, error ? undefined : 'Marks saved.', { exam, class: classId, area });
}

export async function saveCommentsAction(formData: FormData) {
  const exam = str(formData, 'exam', 40), classId = str(formData, 'class_id', 40);
  if (![exam, classId].every((v) => UUID.test(v))) redirect('/');
  const admin = str(formData, 'return_to', 10) === 'admin';
  const path = admin ? `/admin/exams/${exam}/comments` : `/teacher-portal/class/${classId}/comments`;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(admin ? '/staff-login' : '/teacher-portal');
  let failure: string | undefined;
  for (const [k] of formData.entries()) {
    if (!k.startsWith('t_') || !UUID.test(k.slice(2))) continue;
    const id = k.slice(2);
    const { error } = await supabase.rpc('save_comment', { p_exam: exam, p_student: id, p_teacher: str(formData, `t_${id}`, 500), p_head: str(formData, `h_${id}`, 500) });
    if (error) { failure = error.message; break; }
  }
  revalidatePath(path);
  go(path, failure, failure ? undefined : 'Comments saved.', { exam, class: classId });
}

/* ---------- exams and learning areas: school administrators ---------- */

async function staff() {
  const c = await getAdminContext();
  if (!c.isAdmin) redirect('/admin');
  return c;
}

export async function createExamAction(formData: FormData) {
  const c = await staff();
  const campus = c.campusId ?? str(formData, 'campus', 40);
  const name = str(formData, 'name', 80);
  const year = Number(str(formData, 'year', 4)), term = Number(str(formData, 'term', 1));
  if (!UUID.test(campus) || name.length < 2 || !(year >= 2000 && year <= 2100) || ![1, 2, 3].includes(term)) go('/admin/exams', 'Enter a name, year and term.');
  const { error } = await c.supabase.from('exams').insert({ campus_id: campus, name, year, term, show_position: str(formData, 'show_position', 3) === 'on', created_by: c.user.id });
  if (error) go('/admin/exams', error.code === '23505' ? 'An exam with that name already exists for this term.' : 'Could not create the exam.');
  revalidatePath('/admin/exams');
  go('/admin/exams', undefined, 'Exam created. Teachers can now enter marks.');
}

export async function publishExamAction(formData: FormData) {
  const c = await staff();
  const id = str(formData, 'id', 40);
  if (!UUID.test(id)) redirect('/admin/exams');
  const publish = str(formData, 'publish', 5) === 'true';
  const { error } = await c.supabase.from('exams').update({ is_published: publish }).eq('id', id);
  revalidatePath('/admin/exams');
  go(`/admin/exams`, error ? 'Could not change that exam.' : undefined, error ? undefined : publish ? 'Published: parents can now see these report cards.' : 'Hidden from parents again.');
}

export async function deleteExamAction(formData: FormData) {
  const c = await staff();
  const id = str(formData, 'id', 40);
  if (!UUID.test(id)) redirect('/admin/exams');
  const { error } = await c.supabase.from('exams').delete().eq('id', id).eq('is_published', false);
  revalidatePath('/admin/exams');
  go('/admin/exams', error ? 'Could not delete that exam.' : undefined, error ? undefined : 'Exam deleted with all its marks.');
}

export async function seedAreasAction(formData: FormData) {
  const c = await staff();
  const campus = c.campusId ?? str(formData, 'campus', 40);
  if (!UUID.test(campus)) go('/admin/exams', 'Choose a school.');
  const { error } = await c.supabase.rpc('seed_learning_areas', { p_campus: campus });
  revalidatePath('/admin/exams');
  go('/admin/exams', error?.message, error ? undefined : 'Standard CBC learning areas added.');
}

export async function addAreaAction(formData: FormData) {
  const c = await staff();
  const campus = c.campusId ?? str(formData, 'campus', 40);
  const stage = str(formData, 'stage', 20), name = str(formData, 'name', 80);
  if (!UUID.test(campus) || name.length < 2 || !['pre_primary', 'lower_primary', 'upper_primary', 'junior_school'].includes(stage)) go('/admin/exams', 'Enter the learning area name and stage.');
  const { error } = await c.supabase.from('learning_areas').insert({ campus_id: campus, stage, name, sort_order: 50 });
  revalidatePath('/admin/exams');
  go('/admin/exams', error ? (error.code === '23505' ? 'That learning area already exists.' : 'Could not add it.') : undefined, error ? undefined : 'Learning area added.');
}

export async function deleteAreaAction(formData: FormData) {
  const c = await staff();
  const id = str(formData, 'id', 40);
  if (!UUID.test(id)) redirect('/admin/exams');
  const { error } = await c.supabase.from('learning_areas').delete().eq('id', id);
  revalidatePath('/admin/exams');
  go('/admin/exams', error ? (error.code === '23503' ? 'That learning area already has marks, so it cannot be removed.' : 'Could not remove it.') : undefined, error ? undefined : 'Learning area removed.');
}
