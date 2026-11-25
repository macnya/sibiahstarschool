import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ParentSignUpForm, SignInForm } from '@/components/portal/portal-forms';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Parent Portal', description: 'Sign in to see your children’s class, teacher and school fees, and to pay.' };
export const dynamic = 'force-dynamic';

export default async function ParentPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/parent-portal/dashboard');
  return (
    <div>
      <PageHeader eyebrow="Parents" title="Parent Portal" subtitle="See your children’s class and teacher, check fee balances, view statements and pay — all in one place." />
      <section className="section-pad">
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
