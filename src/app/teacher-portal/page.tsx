import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { SignInForm } from '@/components/portal/portal-forms';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Teacher Portal', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TeacherPortalPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && !sp.denied) {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if ((p as { role: string } | null)?.role === 'teacher') redirect('/teacher-portal/dashboard');
  }
  return (
    <div>
      <PageHeader eyebrow="Staff" title="Teacher Portal" subtitle="See your classes and your pupils’ parent contacts." />
      <section className="section-pad">
        <div className="container mx-auto max-w-md px-4 sm:px-6">
          {sp.denied && <p role="alert" className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">That account is not a teacher account. Sign in with your teacher login, or ask the school office.</p>}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="display-title mb-5 text-2xl text-primary">Sign in</h2>
            <SignInForm who="teacher" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Your login is created by the school office. Parent? <Link href="/parent-portal" className="text-primary underline">Go to the Parent Portal</Link>.</p>
        </div>
      </section>
    </div>
  );
}
