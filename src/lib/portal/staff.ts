import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface StaffInfo { department: 'transport' | 'kitchen' | 'general'; title: string | null; campus_id: string; campus_name: string; name: string | null }

/** The signed-in department staff member (transport, kitchen, general), or sends them to the staff login. */
export async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/staff-login');
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = (p as { role: string } | null)?.role;
  if (role === 'teacher') redirect('/teacher-portal/dashboard');
  if (role === 'admin' || role === 'editor') redirect('/admin');
  if (role !== 'staff') redirect('/staff-login?denied=1');
  const { data } = await supabase.rpc('my_staff');
  const info = data as StaffInfo | null;
  if (!info) redirect('/staff-login?denied=1');
  return { supabase, user, info };
}
