import Link from 'next/link';
import { generateInvoicesAction } from '@/app/admin/fees-actions';
import { getAdminContext, getCampusesAndGrades } from '@/lib/admissions/admin-queries';
import { getInvoices, getTerms } from '@/lib/fees/admin-queries';
import { formatKES } from '@/lib/fees/money';
import { formatDate } from '@/lib/admissions/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

type SP = { year?: string; term?: string; q?: string; error?: string; ok?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ctx = await getAdminContext();
  const [terms, { campuses, grades }] = await Promise.all([getTerms(), getCampusesAndGrades()]);
  const myCampuses = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses;
  const current = terms.find((t) => t.is_current);
  const invoices = await getInvoices({ year: Number(sp.year) || undefined, term: Number(sp.term) || undefined, q: sp.q });

  return (
    <div className="space-y-8">
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <Card>
        <CardHeader><CardTitle className="text-base">Raise invoices for a term</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Creates one invoice per enrolled child from the fee structure. Children who already have an invoice for that term are skipped, so it is safe to run again
            (for example after fixing a missing fee).
          </p>
          <form action={generateInvoicesAction} className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="campus_id" className="mb-1 block text-xs text-muted-foreground">School</label>
              <select id="campus_id" name="campus_id" required className="h-10 rounded-md border bg-background px-3 text-sm">
                {myCampuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label htmlFor="year" className="mb-1 block text-xs text-muted-foreground">Year</label><Input id="year" name="year" type="number" defaultValue={current?.year ?? new Date().getFullYear()} className="w-24" required /></div>
            <div>
              <label htmlFor="term" className="mb-1 block text-xs text-muted-foreground">Term</label>
              <select id="term" name="term" defaultValue={current?.number ?? 1} className="h-10 rounded-md border bg-background px-3 text-sm">{[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}</select>
            </div>
            <div>
              <label htmlFor="grade_id" className="mb-1 block text-xs text-muted-foreground">Class</label>
              <select id="grade_id" name="grade_id" className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">All classes</option>
                {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Button type="submit">Create invoices</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <div><label htmlFor="q" className="mb-1 block text-xs text-muted-foreground">Invoice no.</label><Input id="q" name="q" defaultValue={sp.q} placeholder="INV-SSS-2027-" /></div>
          <div><label htmlFor="fy" className="mb-1 block text-xs text-muted-foreground">Year</label><Input id="fy" name="year" type="number" defaultValue={sp.year} className="w-24" /></div>
          <div>
            <label htmlFor="ft" className="mb-1 block text-xs text-muted-foreground">Term</label>
            <select id="ft" name="term" defaultValue={sp.term ?? ''} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">Any</option>{[1, 2, 3].map((t) => <option key={t} value={t}>Term {t}</option>)}</select>
          </div>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
        {invoices.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No invoices yet.</p> : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Invoice</th><th className="p-3">Child</th><th className="p-3">Term</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th><th className="p-3">Raised</th></tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-t">
                    <td className="p-3 font-mono text-xs"><Link href={`/admin/fees/invoices/${i.id}`} className="text-primary hover:underline">{i.number}</Link></td>
                    <td className="p-3">{i.student ? <Link href={`/admin/fees/students/${i.student.id}`} className="hover:underline">{i.student.first_name} {i.student.last_name}</Link> : '—'}</td>
                    <td className="p-3">T{i.term_number} {i.year}</td>
                    <td className="p-3 text-right">{formatKES(i.total_cents)}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${i.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{i.status}</span></td>
                    <td className="p-3 text-muted-foreground">{formatDate(i.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
