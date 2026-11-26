import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { unlinkChildAction } from '@/app/portal-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/admissions/constants';
import { formatKES } from '@/lib/fees/money';
import { channelsFor } from '@/lib/fees/payment-channels';
import { requireParent } from '@/lib/portal/context';
import type { FeeAccount, MyChild } from '@/lib/supabase/types';

export const metadata: Metadata = { title: 'Fee statement', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ChildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireParent();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: acc }, { data: kids }, { data: att }, { data: examsData }] = await Promise.all([supabase.rpc('my_child_account', { p_student: id }), supabase.rpc('my_children'), supabase.rpc('child_attendance', { p_student: id }), supabase.rpc('my_child_exams', { p_student: id })]);
  const exams = (examsData ?? []) as { id: string; name: string; year: number; term: number }[];
  const attendance = att as { days: number; present: number; absent: number; late: number; excused: number; recent: { day: string; status: string; note: string | null }[] } | null;
  const account = acc as FeeAccount | null;
  if (!account) notFound();
  const child = ((kids ?? []) as MyChild[]).find((k) => k.student_id === id);
  const channels = channelsFor(account, account.admission_number, account.campus_name);

  return (
    <div>
      <PageHeader eyebrow={account.campus_name} title={account.student_name} subtitle={<p>{child?.class_name ?? 'Class being arranged'}{child?.class_teacher ? ` · Class teacher: ${child.class_teacher}` : ''}</p>} className="py-10 md:py-14" />
      <section className="section-pad">
        <div className="container mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
          <Link href="/parent-portal/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />My children</Link>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-6">
            <div>
              <p className="text-sm text-muted-foreground">Fee balance</p>
              <p className={`text-3xl font-bold ${account.balance_cents > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {account.balance_cents > 0 ? formatKES(account.balance_cents) : account.balance_cents < 0 ? `${formatKES(-account.balance_cents)} in advance` : 'Fully paid'}
              </p>
            </div>
            <Button asChild size="lg"><Link href={`/pay-fees?adm=${encodeURIComponent(account.admission_number)}`}>Pay by M-Pesa phone prompt</Link></Button>
          </div>

          {exams.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-primary">Report cards</h2>
              <ul className="divide-y rounded-lg border bg-card text-sm">
                {exams.map((x) => <li key={x.id}><Link href={`/parent-portal/child/${id}/report/${x.id}`} className="flex justify-between gap-2 px-3 py-3 hover:bg-muted/50"><span className="font-medium text-primary">{x.name}</span><span className="text-muted-foreground">Term {x.term}, {x.year}</span></Link></li>)}
              </ul>
            </div>
          )}

          {attendance && attendance.days > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-primary">Attendance, last 60 days</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Present', attendance.present - attendance.late, 'text-green-700'], ['Late', attendance.late, 'text-amber-700'], ['Absent', attendance.absent, 'text-red-700'], ['Excused', attendance.excused, 'text-slate-700']].map(([l, n, c]) => (
                  <div key={String(l)} className="rounded-lg border bg-card p-4 text-center"><p className={`text-2xl font-bold ${c}`}>{n}</p><p className="text-xs text-muted-foreground">{l}</p></div>
                ))}
              </div>
              {attendance.recent.length > 0 && (
                <ul className="mt-3 divide-y rounded-lg border bg-card text-sm">
                  {attendance.recent.map((r) => (
                    <li key={r.day} className="flex flex-wrap justify-between gap-2 px-3 py-2"><span>{formatDate(r.day)}</span><span className="capitalize">{r.status}{r.note ? ` · ${r.note}` : ''}</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {channels.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-primary">Other ways to pay</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {channels.map((ch) => (
                  <div key={ch.id} className="rounded-lg border bg-muted/50 p-4 text-sm">
                    <p className="mb-2 font-semibold text-primary">{ch.title}</p>
                    {ch.steps.map((st, n) => <p key={n}>{st.label}{st.value && <> <strong className="rounded bg-white px-1.5 py-0.5 font-mono text-base">{st.value}</strong></>}</p>)}
                    {ch.note && <p className="mt-2 whitespace-pre-line text-muted-foreground">{ch.note}</p>}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Type the account number exactly as shown. Bank and KCB payments can take a little longer to appear.</p>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold text-primary">Statement</h2>
            {account.entries.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing on this account yet.</p> : (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Date</th><th className="p-3">Details</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Balance</th></tr></thead>
                  <tbody>
                    {account.entries.map((e, i) => (
                      <tr key={i} className="border-t">
                        <td className="whitespace-nowrap p-3 text-muted-foreground">{formatDate(e.date)}</td>
                        <td className="p-3">{e.description}</td>
                        <td className={`p-3 text-right ${e.amount_cents < 0 ? 'text-green-700' : ''}`}>{e.amount_cents < 0 ? `− ${formatKES(-e.amount_cents)}` : formatKES(e.amount_cents)}</td>
                        <td className="p-3 text-right">{formatKES(e.balance_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <form action={unlinkChildAction}><input type="hidden" name="student_id" value={id} /><Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">Remove this child from my account</Button></form>
        </div>
      </section>
    </div>
  );
}
