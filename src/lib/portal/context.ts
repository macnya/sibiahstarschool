import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ProfileRow } from '@/lib/supabase/types';

/** The signed-in parent (any signed-in family account), or sends them to the parent sign-in page. */
export async function requireParent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/parent-portal');
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = data as ProfileRow | null;
  // staff accounts have their own areas; they should not land in the parent area by accident
  if (profile && ['admin', 'editor', 'teacher'].includes(profile.role)) redirect(profile.role === 'teacher' ? '/teacher-portal/dashboard' : '/parent-portal?staff=1');
  return { supabase, user, profile };
}

/** The signed-in teacher, or sends them to the teacher sign-in page. */
export async function requireTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/teacher-portal');
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const profile = data as ProfileRow | null;
  if (!profile || profile.role !== 'teacher') redirect('/teacher-portal?denied=1');
  return { supabase, user, profile };
}
