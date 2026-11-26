import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { portalSignOut } from '@/app/portal-actions';
import { PageHeader } from '@/components/shared/page-header';
import { StaffSignInForm } from '@/components/portal/portal-forms';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Staff Login', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let otherAccount = false;
  let noDepartment = false;
  if (user) {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const role = (p as { role: string } | null)?.role;
    if (role === 'teacher') redirect('/teacher-portal/dashboard');
    if (role === 'staff') {
      const { data: info } = await supabase.rpc('my_staff');
      if (info) redirect('/staff/dashboard');
      noDepartment = true; // staff role without a department record: never bounce back and forth
    }
    if (role === 'admin' || role === 'editor') redirect(sp.next?.startsWith('/admin') ? sp.next : '/admin');
    otherAccount = !noDepartment; // signed in, but as a parent or pupil: show the form with a way out, never loop
  }
  return (
    <div>
      <PageHeader eyebrow="School staff" title="Staff Login" subtitle="Teachers, office, transport and kitchen staff. Your account is created by the school administrator." />
      <section className="section-pad">
        <div className="container mx-auto max-w-md px-4 sm:px-6">
          {noDepartment && (
            <div role="status" className="mb-4 space-y-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>Your account is signed in but has no department yet. Please ask the school administrator to finish setting it up.</p>
              <form action={portalSignOut}><input type="hidden" name="to" value="staff" /><Button type="submit" size="sm" variant="outline">Sign out</Button></form>
            </div>
          )}
          {otherAccount && (
            <div role="status" className="mb-4 space-y-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>You are signed in on this browser with a parent or family account{sp.denied ? ', which cannot open that page' : ''}. Sign out first to use a staff login.</p>
              <form action={portalSignOut}><input type="hidden" name="to" value="staff" /><Button type="submit" size="sm" variant="outline">Sign out</Button></form>
            </div>
          )}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="display-title mb-5 text-2xl text-primary">Sign in</h2>
            <StaffSignInForm next={sp.next} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Forgot your password? Ask the school administrator to reset it. Parent? <Link href="/parent-portal" className="text-primary underline">Go to the Parent Portal</Link>.</p>
        </div>
      </section>
    </div>
  );
}
