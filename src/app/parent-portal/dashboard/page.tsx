import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, LogOut } from 'lucide-react';
import { portalSignOut } from '@/app/portal-actions';
import { ClaimChildForm } from '@/components/portal/portal-forms';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { formatKES } from '@/lib/fees/money';
import { requireParent } from '@/lib/portal/context';
import type { MyChild } from '@/lib/supabase/types';

export const metadata: Metadata = { title: 'My children', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage() {
  const { supabase, profile, user } = await requireParent();
  const { data } = await supabase.rpc('my_children');
  const children = (data ?? []) as MyChild[];
  const name = profile?.full_name || user.email;

  return (
    <div>
      <PageHeader eyebrow="Parent Portal" title={`Welcome, ${String(name).split(' ')[0]}`} subtitle="Your children, their classes and their fees." className="py-10 md:py-14" />
      <section className="section-pad">
        <div className="container mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <form action={portalSignOut}><input type="hidden" name="to" value="parent" /><Button type="submit" variant="outline" size="sm"><LogOut className="mr-1.5 h-4 w-4" />Sign out</Button></form>
          </div>

          {children.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <GraduationCap className="mx-auto mb-3 h-10 w-10 text-accent" aria-hidden="true" />
              <h2 className="display-title text-2xl text-primary">Add your first child</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Use your child’s admission number and the phone number the school has on file for you.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {children.map((c) => (
                <article key={c.student_id} className="rounded-xl border bg-card p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.school}</p>
                  <h2 className="display-title text-2xl text-primary">{c.name}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{c.admission_number}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Class</dt><dd className="font-medium">{c.class_name ?? 'Being arranged'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Class teacher</dt><dd className="font-medium">{c.class_teacher ?? '—'}</dd></div>
                    <div className="col-span-2"><dt className="text-xs text-muted-foreground">Fee balance</dt>
                      <dd className={`text-xl font-bold ${c.balance_cents > 0 ? 'text-red-700' : 'text-green-700'}`}>{c.balance_cents > 0 ? formatKES(c.balance_cents) : c.balance_cents < 0 ? `${formatKES(-c.balance_cents)} paid in advance` : 'Fully paid'}</dd></div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button asChild><Link href={`/parent-portal/child/${c.student_id}`}>Statement &amp; how to pay</Link></Button>
                    <Button asChild variant="outline"><Link href={`/pay-fees?adm=${encodeURIComponent(c.admission_number)}`}>Pay by M-Pesa</Link></Button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-1 text-lg font-semibold text-primary">{children.length === 0 ? 'Add a child' : 'Add another child'}</h2>
            <p className="mb-4 text-sm text-muted-foreground">We check the admission number against the phone number the school holds for you, so only a parent or guardian can link a child.</p>
            <ClaimChildForm />
          </div>
        </div>
      </section>
    </div>
  );
}
