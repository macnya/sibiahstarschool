import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ParentSignUpForm, SignInForm } from '@/components/portal/portal-forms';
import { portalSignOut } from '@/app/portal-actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Parent Portal', description: 'Sign in to see your children’s class, teacher and school fees, and to pay.' };
export const dynamic = 'force-dynamic';

export default async function ParentPortalPage({ searchParams }: { searchParams: Promise<{ staff?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let staffSignedIn = false;
  if (user) {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const role = (p as { role: string } | null)?.role;
    if (role && ['admin', 'editor', 'teacher'].includes(role)) staffSignedIn = true;
    else redirect('/parent-portal/dashboard');
  }
  return (
    <div>
      <PageHeader eyebrow="Parents" title="Parent Portal" subtitle="See your children’s class and teacher, check fee balances, view statements and pay — all in one place." />
      <section className="section-pad">
        {staffSignedIn && (
          <div className="container mx-auto mb-6 max-w-5xl px-4 sm:px-6 lg:px-8">
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>You are signed in as school staff on this browser. To use the Parent Portal, sign out first and sign in with a parent account.</span>
              <form action={portalSignOut}><input type="hidden" name="to" value="parent" /><Button type="submit" size="sm" variant="outline">Sign out</Button></form>
            </div>
          </div>
        )}
        <div className="container mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="display-title mb-1 text-2xl text-primary">Sign in</h2>
            <p className="mb-5 text-sm text-muted-foreground">Already have an account?</p>
            <SignInForm who="parent" />
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="display-title mb-1 text-2xl text-primary">Create an account</h2>
            <p className="mb-5 text-sm text-muted-foreground">New here? It takes a minute.</p>
            <ParentSignUpForm />
          </div>
          <p className="text-sm text-muted-foreground md:col-span-2">
            Just want to check a balance and pay without an account? Use <Link href="/pay-fees" className="text-primary underline">Pay school fees</Link>. School staff and teachers sign in at <Link href="/teacher-portal" className="text-primary underline">the teacher portal</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
