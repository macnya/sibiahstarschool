'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { allowRequest } from '@/lib/rate-limit';

export type PortalState = { error: string | null; notice?: string | null };

async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown').split(',')[0].trim();
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parents: create an account. They link their children afterwards by proving the admission + phone number. */
export async function parentSignUp(_prev: PortalState, formData: FormData): Promise<PortalState> {
  if (!allowRequest(`portal-signup:${await clientIp()}`, 6)) return { error: 'Too many attempts. Please wait a few minutes.' };
  const name = String(formData.get('full_name') ?? '').trim().slice(0, 120);
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (name.length < 3) return { error: 'Enter your full name.' };
  if (!EMAIL.test(email)) return { error: 'Enter a valid email address.' };
  if (password.length < 8) return { error: 'Choose a password of at least 8 characters.' };
  if (password !== String(formData.get('confirm') ?? '')) return { error: 'The two passwords do not match.' };

  const supabase = await createClient();
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { full_name: name }, ...(site ? { emailRedirectTo: `${site}/parent-portal` } : {}) },
  });
  if (error) {
    return { error: /password/i.test(error.message) ? 'That password is too weak. Try a longer one.' : 'We could not create the account. Please try again.' };
  }
  if (data.session) {
    // keep the typed name on the profile (the database creates the profile row on sign-up)
    await supabase.from('profiles').update({ full_name: name }).eq('id', data.session.user.id);
    revalidatePath('/', 'layout');
    redirect('/parent-portal/dashboard');
  }
  // same message whether or not the email already had an account: do not reveal who is registered
  return { error: null, notice: 'Almost done. Check your email and click the link to confirm, then sign in here.' };
}

async function signInWith(formData: FormData, who: 'parent' | 'teacher'): Promise<PortalState> {
  if (!allowRequest(`portal-signin:${await clientIp()}`, 12)) return { error: 'Too many attempts. Please wait a few minutes.' };
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'Those details do not match an account, or the email is not confirmed yet.' };

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).maybeSingle();
  const role = (profile as { role: string } | null)?.role;

  if (who === 'teacher' && role !== 'teacher') {
    await supabase.auth.signOut();
    return { error: 'This account is not a teacher account. Ask the school office to add you.' };
  }
  if (who === 'parent' && role && ['admin', 'editor', 'teacher'].includes(role)) {
    await supabase.auth.signOut();
    return { error: 'This is a staff account. Please use the staff or teacher sign-in instead.' };
  }
  revalidatePath('/', 'layout');
  redirect(who === 'teacher' ? '/teacher-portal/dashboard' : '/parent-portal/dashboard');
}

export async function parentSignIn(_prev: PortalState, formData: FormData): Promise<PortalState> {
  return signInWith(formData, 'parent');
}
export async function teacherSignIn(_prev: PortalState, formData: FormData): Promise<PortalState> {
  return signInWith(formData, 'teacher');
}

export async function portalSignOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(String(formData.get('to') ?? '') === 'teacher' ? '/teacher-portal' : '/parent-portal');
}

/** A parent links a child: admission number AND the phone number the school holds for them. */
export async function claimChildAction(_prev: PortalState, formData: FormData): Promise<PortalState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/parent-portal');
  if (!allowRequest(`claim:${user.id}`, 12)) return { error: 'Too many attempts. Please wait a few minutes.' };
  const admission = String(formData.get('admission') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  if (admission.length < 3 || phone.replace(/\D/g, '').length < 7) return { error: 'Enter the admission number and the phone number the school has for you.' };

  const { data, error } = await supabase.rpc('claim_child', { p_admission_number: admission, p_phone: phone });
  if (error) return { error: error.code === 'P0001' ? error.message : 'We could not check that just now. Please try again.' };
  if (!data) return { error: 'We could not match that admission number with that phone number. Use the number the school has on file for you; if it has changed, ask the school office to update it.' };
  revalidatePath('/parent-portal/dashboard');
  return { error: null, notice: `${data.student_name} has been added to your account.` };
}

export async function unlinkChildAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get('student_id') ?? '');
  if (/^[0-9a-f-]{36}$/i.test(id)) await supabase.rpc('unlink_child', { p_student: id });
  revalidatePath('/parent-portal/dashboard');
  redirect('/parent-portal/dashboard');
}
