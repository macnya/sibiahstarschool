'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error: string | null };

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/admin');

  if (!email || !password) {
    return { error: 'Enter your email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Deliberately vague: distinguishing "wrong password" from "no such
    // account" tells an attacker which emails are registered.
    return { error: 'Those details do not match an account.' };
  }

  // Confirm the account actually has content permissions. Someone could
  // hold a valid login with the default 'student' role and otherwise
  // reach the admin shell before any query fails.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: 'This account does not have admin access.' };
  }

  revalidatePath('/', 'layout');
  // Only allow relative paths, so ?next= cannot redirect off-site.
  redirect(next.startsWith('/') ? next : '/admin');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/admin/login');
}
