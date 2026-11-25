'use client';

import { useActionState } from 'react';
import { claimChildAction, parentSignIn, parentSignUp, teacherSignIn, type PortalState } from '@/app/portal-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initial: PortalState = { error: null };

function Message({ state }: { state: PortalState }) {
  if (state.error) return <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>;
  if (state.notice) return <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{state.notice}</p>;
  return null;
}

export function SignInForm({ who }: { who: 'parent' | 'teacher' }) {
  const [state, action, pending] = useActionState(who === 'teacher' ? teacherSignIn : parentSignIn, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2"><Label htmlFor={`${who}-email`}>Email</Label><Input id={`${who}-email`} name="email" type="email" autoComplete="username" required /></div>
      <div className="space-y-2"><Label htmlFor={`${who}-password`}>Password</Label><Input id={`${who}-password`} name="password" type="password" autoComplete="current-password" required /></div>
      <Message state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? 'Signing in…' : 'Sign in'}</Button>
    </form>
  );
}

export function ParentSignUpForm() {
  const [state, action, pending] = useActionState(parentSignUp, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="su-name">Your full name</Label><Input id="su-name" name="full_name" required minLength={3} maxLength={120} autoComplete="name" /></div>
      <div className="space-y-2"><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" required autoComplete="email" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="su-pw">Password</Label><Input id="su-pw" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>
        <div className="space-y-2"><Label htmlFor="su-pw2">Repeat password</Label><Input id="su-pw2" name="confirm" type="password" required minLength={8} autoComplete="new-password" /></div>
      </div>
      <Message state={state} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? 'Creating account…' : 'Create account'}</Button>
      <p className="text-xs text-muted-foreground">You will add your child next, using their admission number and the phone number the school has for you. See our <a href="/privacy" className="underline">privacy notice</a>.</p>
    </form>
  );
}

export function ClaimChildForm() {
  const [state, action, pending] = useActionState(claimChildAction, initial);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-3 sm:items-end">
      <div className="space-y-2"><Label htmlFor="cc-adm">Admission number</Label><Input id="cc-adm" name="admission" required placeholder="e.g. SSS/2026/001" autoComplete="off" /></div>
      <div className="space-y-2"><Label htmlFor="cc-phone">Phone number the school has for you</Label><Input id="cc-phone" name="phone" type="tel" required placeholder="0712 345 678" autoComplete="off" /></div>
      <Button type="submit" disabled={pending}>{pending ? 'Checking…' : 'Add child'}</Button>
      <div className="sm:col-span-3"><Message state={state} /></div>
    </form>
  );
}
