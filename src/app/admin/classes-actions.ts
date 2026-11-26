'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getAdminContext } from '@/lib/admissions/admin-queries';

/**
 * Classes, teachers and class placement.
 * Class and placement changes run as the signed-in user through checked database functions,
 * so a campus admin cannot touch another school's classes. Creating a teacher's login is the one
 * step that needs the service key (Supabase only lets the server create users); it is limited here
 * to administrators, and to their own school for campus administrators.
 */

function back(path: string, error?: string, ok?: string): never {
  const params = new URLSearchParams();
  if (error) params.set('error', error);
  if (ok) params.set('ok', ok);
  const qs = params.toString();
  redirect(qs ? `${path}?${qs}` : path);
}

function text(formData: FormData, key: string, max = 200) {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (v: string) => UUID.test(v);

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/staff-login');
  return supabase;
}

function friendly(message: string | undefined) {
  return message && message.length < 200 && !/violates|constraint|syntax|relation|column/i.test(message) ? message : 'That did not work. Please try again.';
}

// ---------------------------------------------------------------- classes

export async function createClassAction(formData: FormData) {
  const supabase = await authed();
  const campus = text(formData, 'campus_id', 60);
  const grade = text(formData, 'grade_id', 60);
  const year = Number(text(formData, 'year', 4));
  const capacity = Number(text(formData, 'capacity', 3) || 40);
  if (!isId(campus) || !isId(grade)) back('/admin/classes', 'Choose the school and the class.');
  if (!Number.isInteger(year) || year < 2000 || year > 2100) back('/admin/classes', 'Enter a valid year.');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) back('/admin/classes', 'Capacity must be between 1 and 200.');
  const { data, error } = await supabase.rpc('create_class', {
    p_campus: campus, p_grade: grade, p_year: year, p_stream: text(formData, 'stream', 30), p_capacity: capacity,
  });
  if (error || !data) back('/admin/classes', friendly(error?.message));
  revalidatePath('/admin/classes');
  back(`/admin/classes/${data}`, undefined, 'Class created. Add pupils and teachers below.');
}

export async function updateClassCapacityAction(formData: FormData) {
  const supabase = await authed();
  const id = text(formData, 'class_id', 60);
  const capacity = Number(text(formData, 'capacity', 3));
  const path = `/admin/classes/${id}`;
  if (!isId(id)) back('/admin/classes');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) back(path, 'Capacity must be between 1 and 200.');
  const { data, error } = await supabase.from('classes').update({ capacity }).eq('id', id).select('id');
  if (error || !data?.length) back(path, 'Could not save the capacity.');
  revalidatePath(path);
  back(path, undefined, 'Capacity saved.');
}

export async function placeStudentsAction(formData: FormData) {
  const supabase = await authed();
  const id = text(formData, 'class_id', 60);
  const path = `/admin/classes/${id}`;
  const ids = formData.getAll('student_id').filter((v): v is string => typeof v === 'string' && isId(v));
  if (!isId(id)) back('/admin/classes');
  if (ids.length === 0) back(path, 'Tick at least one pupil.');
  const { data, error } = await supabase.rpc('place_students', { p_class: id, p_students: ids });
  if (error) back(path, friendly(error.message));
  revalidatePath(path);
  back(path, undefined, `${data ?? 0} pupil${data === 1 ? '' : 's'} added.`);
}

export async function placeUnplacedAction(formData: FormData) {
  const supabase = await authed();
  const id = text(formData, 'class_id', 60);
  const path = `/admin/classes/${id}`;
  if (!isId(id)) back('/admin/classes');
  const { data, error } = await supabase.rpc('place_unplaced', { p_class: id });
  if (error) back(path, friendly(error.message));
  revalidatePath(path);
  back(path, undefined, `${data ?? 0} pupil${data === 1 ? '' : 's'} added.`);
}

export async function removeFromClassAction(formData: FormData) {
  const supabase = await authed();
  const student = text(formData, 'student_id', 60);
  const next = text(formData, 'next', 200);
  const fallback = next.startsWith('/admin/') ? next : '/admin/classes';
  if (!isId(student)) back(fallback);
  const { error } = await supabase.rpc('remove_from_class', { p_student: student });
  if (error) back(fallback, friendly(error.message));
  revalidatePath('/admin/classes');
  back(fallback, undefined, 'Removed from the class.');
}

export async function placeOneStudentAction(formData: FormData) {
  const supabase = await authed();
  const student = text(formData, 'student_id', 60);
  const klass = text(formData, 'class_id', 60);
  const path = `/admin/students/${student}`;
  if (!isId(student)) back('/admin/students');
  if (!isId(klass)) back(path, 'Choose a class.');
  const { error } = await supabase.rpc('place_students', { p_class: klass, p_students: [student] });
  if (error) back(path, friendly(error.message));
  revalidatePath(path);
  back(path, undefined, 'Class saved.');
}

export async function deleteClassAction(formData: FormData) {
  const supabase = await authed();
  const id = text(formData, 'class_id', 60);
  if (!isId(id)) back('/admin/classes');
  const { error } = await supabase.rpc('delete_class', { p_class: id });
  if (error) back(`/admin/classes/${id}`, friendly(error.message));
  revalidatePath('/admin/classes');
  back('/admin/classes', undefined, 'Class deleted.');
}

export async function assignTeacherAction(formData: FormData) {
  const supabase = await authed();
  const klass = text(formData, 'class_id', 60);
  const teacher = text(formData, 'teacher_id', 60);
  const path = `/admin/classes/${klass}`;
  if (!isId(klass)) back('/admin/classes');
  if (!isId(teacher)) back(path, 'Choose a teacher.');
  const { error } = await supabase.rpc('assign_class_teacher', {
    p_class: klass, p_teacher: teacher, p_is_head: formData.get('is_head') === 'on', p_subject: text(formData, 'subject', 60) || null,
  });
  if (error) back(path, friendly(error.message));
  revalidatePath(path);
  back(path, undefined, 'Teacher saved.');
}

export async function removeTeacherFromClassAction(formData: FormData) {
  const supabase = await authed();
  const klass = text(formData, 'class_id', 60);
  const teacher = text(formData, 'teacher_id', 60);
  const path = `/admin/classes/${klass}`;
  if (!isId(klass) || !isId(teacher)) back('/admin/classes');
  const { error } = await supabase.rpc('remove_class_teacher', { p_class: klass, p_teacher: teacher });
  if (error) back(path, friendly(error.message));
  revalidatePath(path);
  back(path, undefined, 'Teacher removed from the class.');
}

// ---------------------------------------------------------------- teacher accounts

export async function createTeacherAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('/admin/teachers', 'Only administrators can add teachers.');
  const name = text(formData, 'full_name', 120);
  const email = text(formData, 'email', 200).toLowerCase();
  const password = String(formData.get('password') ?? '');
  const campus = ctx.campusId ?? text(formData, 'campus_id', 60);
  if (name.length < 3) back('/admin/teachers', 'Enter the teacher’s full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back('/admin/teachers', 'Enter a valid email address.');
  if (password.length < 10) back('/admin/teachers', 'The first password must be at least 10 characters. The teacher can change it later.');
  if (!isId(campus)) back('/admin/teachers', 'Choose the school.');
  // a campus administrator can only add teachers to their own school
  if (ctx.campusId && ctx.campusId !== campus) back('/admin/teachers', 'You can only add teachers to your own school.');

  let admin;
  try { admin = createServiceClient(); } catch { back('/admin/teachers', 'The server is missing its service key (SUPABASE_SERVICE_ROLE_KEY), so teacher logins cannot be created yet.'); }
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (created.error || !created.data.user) {
    back('/admin/teachers', /already|registered|exists/i.test(created.error?.message ?? '') ? 'That email already has an account.' : 'Could not create the account. Please try again.');
  }
  const { error } = await admin.from('profiles').update({ full_name: name, role: 'teacher', campus_id: campus }).eq('id', created.data.user.id);
  if (error) {
    await admin.auth.admin.deleteUser(created.data.user.id);
    back('/admin/teachers', 'Could not finish setting up the teacher. Nothing was created.');
  }
  revalidatePath('/admin/teachers');
  back('/admin/teachers', undefined, `${name} can now sign in at /teacher-portal with ${email}.`);
}

async function teacherInScope(ctxCampus: string | null, teacherId: string) {
  const admin = createServiceClient();
  const { data } = await admin.from('profiles').select('id, role, campus_id, full_name').eq('id', teacherId).maybeSingle();
  const p = data as { id: string; role: string; campus_id: string | null; full_name: string | null } | null;
  if (!p || p.role !== 'teacher') return null;
  if (ctxCampus && p.campus_id !== ctxCampus) return null;
  return { admin, profile: p };
}

export async function resetTeacherPasswordAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('/admin/teachers', 'Only administrators can do this.');
  const id = text(formData, 'teacher_id', 60);
  const password = String(formData.get('password') ?? '');
  if (!isId(id)) back('/admin/teachers');
  if (password.length < 10) back('/admin/teachers', 'The new password must be at least 10 characters.');
  const found = await teacherInScope(ctx.campusId, id).catch(() => null);
  if (!found) back('/admin/teachers', 'Teacher not found, or not in your school.');
  const { error } = await found.admin.auth.admin.updateUserById(id, { password });
  if (error) back('/admin/teachers', 'Could not change the password.');
  back('/admin/teachers', undefined, 'Password changed. Tell the teacher the new one in person.');
}

export async function removeTeacherAccessAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('/admin/teachers', 'Only administrators can do this.');
  const id = text(formData, 'teacher_id', 60);
  if (!isId(id)) back('/admin/teachers');
  const found = await teacherInScope(ctx.campusId, id).catch(() => null);
  if (!found) back('/admin/teachers', 'Teacher not found, or not in your school.');
  await found.admin.from('class_teachers').delete().eq('teacher_id', id);
  const { error } = await found.admin.from('profiles').update({ role: 'student', campus_id: null }).eq('id', id);
  if (error) back('/admin/teachers', 'Could not remove access.');
  revalidatePath('/admin/teachers');
  back('/admin/teachers', undefined, 'Teacher access removed. Their classes are now without that teacher.');
}
