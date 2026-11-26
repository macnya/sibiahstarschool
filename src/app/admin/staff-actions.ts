'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getAdminContext } from '@/lib/admissions/admin-queries';

/**
 * Staff accounts. Only an administrator can create them, and only on the server with the service key.
 * A campus administrator can add staff to their own school only; only a group administrator can add another office administrator.
 */

const PATH = '/admin/staff';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = ['teacher', 'transport', 'kitchen', 'general', 'administration'] as const;

function back(error?: string, ok?: string): never {
  const p = new URLSearchParams();
  if (error) p.set('error', error);
  if (ok) p.set('ok', ok);
  redirect(p.toString() ? `${PATH}?${p}` : PATH);
}
const text = (f: FormData, k: string, max = 200) => { const v = f.get(k); return typeof v === 'string' ? v.trim().slice(0, max) : ''; };

export async function createStaffAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('Only administrators can add staff.');
  const kind = text(formData, 'kind', 20) as (typeof KINDS)[number];
  const name = text(formData, 'full_name', 120);
  const email = text(formData, 'email', 200).toLowerCase();
  const password = String(formData.get('password') ?? '');
  const title = text(formData, 'job_title', 80);
  const campus = ctx.campusId ?? text(formData, 'campus_id', 60);
  if (!KINDS.includes(kind)) back('Choose the role.');
  if (name.length < 3) back('Enter the full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back('Enter a valid email address.');
  if (password.length < 10) back('The first password must be at least 10 characters. They can change it later.');
  if (!UUID.test(campus)) back('Choose the school.');
  if (ctx.campusId && ctx.campusId !== campus) back('You can only add staff to your own school.');
  if (kind === 'administration' && !ctx.isGroupAdmin) back('Only the main (group) administrator can add office administrators.');

  let admin;
  try { admin = createServiceClient(); } catch { back('The server is missing its service key (SUPABASE_SERVICE_ROLE_KEY), so staff logins cannot be created yet.'); }
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (created.error || !created.data.user) {
    back(/already|registered|exists/i.test(created.error?.message ?? '') ? 'That email already has an account.' : 'Could not create the account. Please try again.');
  }
  const id = created.data.user.id;
  const role = kind === 'teacher' ? 'teacher' : kind === 'administration' ? 'admin' : 'staff';
  const { error } = await admin.from('profiles').update({ full_name: name, role, campus_id: campus }).eq('id', id);
  let failed = Boolean(error);
  if (!failed && role === 'staff') {
    const r = await admin.from('staff_members').insert({ user_id: id, campus_id: campus, department: kind, job_title: title || null });
    failed = Boolean(r.error);
  }
  if (failed) {
    await admin.auth.admin.deleteUser(id);
    back('Could not finish setting up the account. Nothing was created.');
  }
  revalidatePath(PATH);
  const where = kind === 'teacher' ? 'Then put them on a class under Classes.' : kind === 'administration' ? 'They get the office console.' : 'They see their own page.';
  back(undefined, `${name} can now sign in at Staff Login with ${email}. ${where}`);
}

async function inScope(ctxCampus: string | null, userId: string, allow: string[]) {
  const admin = createServiceClient();
  const { data } = await admin.from('profiles').select('id, role, campus_id').eq('id', userId).maybeSingle();
  const p = data as { id: string; role: string; campus_id: string | null } | null;
  if (!p || !allow.includes(p.role)) return null;
  if (ctxCampus && p.campus_id !== ctxCampus) return null;
  return { admin };
}

export async function resetStaffPasswordAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('Only administrators can do this.');
  const id = text(formData, 'user_id', 60);
  const password = String(formData.get('password') ?? '');
  if (!UUID.test(id)) back();
  if (password.length < 10) back('The new password must be at least 10 characters.');
  const found = await inScope(ctx.campusId, id, ['staff', 'teacher']).catch(() => null);
  if (!found) back('Account not found, or not in your school.');
  const { error } = await found.admin.auth.admin.updateUserById(id, { password });
  if (error) back('Could not change the password.');
  back(undefined, 'Password changed. Tell them the new one in person or by phone.');
}

export async function removeStaffAccessAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('Only administrators can do this.');
  const id = text(formData, 'user_id', 60);
  if (!UUID.test(id)) back();
  const found = await inScope(ctx.campusId, id, ['staff']).catch(() => null);
  if (!found) back('Account not found, or not in your school.');
  await found.admin.from('staff_members').delete().eq('user_id', id);
  const { error } = await found.admin.from('profiles').update({ role: 'student', campus_id: null }).eq('id', id);
  if (error) back('Could not remove access.');
  revalidatePath(PATH);
  back(undefined, 'Access removed. They can no longer sign in to the staff area.');
}

export async function addRouteAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('Only administrators can do this.');
  const campus = ctx.campusId ?? text(formData, 'campus_id', 60);
  const name = text(formData, 'name', 80);
  if (!UUID.test(campus) || name.length < 2) back('Enter the route name.');
  const { error } = await ctx.supabase.from('transport_routes').insert({ campus_id: campus, name });
  revalidatePath(PATH);
  back(error ? (error.code === '23505' ? 'That route already exists.' : 'Could not add the route.') : undefined, error ? undefined : 'Route added.');
}

export async function deleteRouteAction(formData: FormData) {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) back('Only administrators can do this.');
  const id = text(formData, 'id', 60);
  if (!UUID.test(id)) back();
  const { error } = await ctx.supabase.from('transport_routes').delete().eq('id', id);
  revalidatePath(PATH);
  back(error ? 'Could not remove the route.' : undefined, error ? undefined : 'Route removed. Pupils on it are now on no route.');
}

export async function setStudentRouteAction(formData: FormData) {
  const ctx = await getAdminContext();
  const student = text(formData, 'student_id', 60);
  const route = text(formData, 'route_id', 60);
  if (!UUID.test(student)) redirect('/admin/students');
  const { error } = await ctx.supabase.rpc('set_student_route', { p_student: student, p_route: UUID.test(route) ? route : null });
  revalidatePath(`/admin/students/${student}`);
  redirect(`/admin/students/${student}${error ? `?error=${encodeURIComponent(error.message)}` : '?ok=Transport route saved.'}`);
}
