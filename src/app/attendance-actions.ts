'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { STATUSES } from '@/lib/attendance/shared';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saves one class for one day. The database decides who is allowed (the class's teacher, or school staff). */
export async function saveAttendanceAction(formData: FormData) {
  const classId = String(formData.get('class_id') ?? '');
  const day = String(formData.get('day') ?? '');
  const returnTo = String(formData.get('return_to') ?? '');
  const ok = returnTo === 'admin' ? `/admin/attendance/${classId}` : `/teacher-portal/class/${classId}/attendance`;
  if (!UUID.test(classId) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) redirect('/');
  const rows: { student_id: string; status: string; note: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('s_') || typeof value !== 'string') continue;
    const id = key.slice(2);
    if (!UUID.test(id) || !(STATUSES as readonly string[]).includes(value)) continue;
    rows.push({ student_id: id, status: value, note: String(formData.get(`n_${id}`) ?? '').trim().slice(0, 200) });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(returnTo === 'admin' ? '/staff-login' : '/teacher-portal');
  const { error } = await supabase.rpc('mark_attendance', { p_class: classId, p_day: day, p_rows: rows });
  const qs = new URLSearchParams({ date: day });
  if (error) qs.set('error', error.message.slice(0, 160)); else qs.set('ok', `Saved for ${rows.length} pupils.`);
  revalidatePath(ok);
  redirect(`${ok}?${qs.toString()}`);
}

export async function toggleAbsenceSmsAction(formData: FormData) {
  const campus = String(formData.get('campus') ?? '');
  if (!UUID.test(campus)) redirect('/admin/fees/sms');
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_sms_absence', { p_campus: campus, p_enabled: String(formData.get('enabled')) === 'true' });
  revalidatePath('/admin/fees/sms');
  redirect(`/admin/fees/sms?${error ? `error=${encodeURIComponent(error.message)}` : 'ok=Saved.'}`);
}
