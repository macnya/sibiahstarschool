import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import { getAdminContext, getCampusesAndGrades } from '@/lib/admissions/admin-queries';
import { getBalances } from '@/lib/fees/admin-queries';
import { formatKES } from '@/lib/fees/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

type SP = { campus?: string; grade?: string; q?: string; min?: string };

export default async function ArrearsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ctx = await getAdminContext();
  const { campuses, grades } = await getCampusesAndGrades();
  const minCents = sp.min ? Math.round(Number(sp.min) * 100) : 1;
  const all = await getBalances({ campusId: sp.campus || undefined, gradeId: sp.grade || undefined, q: sp.q, onlyOwing: true });
  const rows = all.filter((b) => b.balance >= (Number.isFinite(minCents) ? minCents : 1));
  const total = rows.reduce((a, b) => a + b.balance, 0);
  const gradeName = new Map(grades.map((g) => [g.id, g.name]));
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="min-w-48 flex-1"><label htmlFor="q" className="mb-1 block text-xs text-muted-foreground">Search</label><Input id="q" name="q" defaultValue={sp.q} placeholder="Child, parent or phone" /></div>
        {!ctx.campusId && campuses.length > 1 && (
          <div>
            <label htmlFor="campus" className="mb-1 block text-xs text-muted-foreground">School</label>
            <select id="campus" name="campus" defaultValue={sp.campus ?? ''} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">All schools</option>{campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
        )}
        <div>
          <label htmlFor="grade" className="mb-1 block text-xs text-muted-foreground">Class</label>
          <select id="grade" name="grade" defaultValue={sp.grade ?? ''} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">All classes</option>{grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
        </div>
        <div><label htmlFor="min" className="mb-1 block text-xs text-muted-foreground">Owing at least (KES)</label><Input id="min" name="min" type="number" min={0} defaultValue={sp.min} className="w-32" /></div>
        <Button type="submit"><Search className="mr-1.5 h-4 w-4" />Filter</Button>
        {qs && <Button asChild variant="ghost"><Link href="/admin/fees/arrears">Clear</Link></Button>}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm"><strong>{rows.length}</strong> {rows.length === 1 ? 'child owes' : 'children owe'} a total of <strong className="text-red-700">{formatKES(total)}</strong></p>
        <Button asChild variant="outline" size="sm"><a href={`/admin/fees/arrears/export${qs ? `?${qs}` : ''}`}><Download className="mr-1.5 h-4 w-4" />Download for Excel</a></Button>
      </div>

      {rows.length === 0 ? <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No balances match. 🎉</p> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Child</th><th className="p-3">School · class</th><th className="p-3">Parent</th><th className="p-3 text-right">Invoiced</th><th className="p-3 text-right">Paid</th><th className="p-3 text-right">Balance</th></tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.student_id} className="border-t">
                  <td className="p-3"><Link href={`/admin/fees/students/${b.student_id}`} className="font-medium text-primary hover:underline">{b.first_name} {b.last_name}</Link><p className="font-mono text-xs text-muted-foreground">{b.admission_number}</p></td>
                  <td className="p-3">{campusName.get(b.campus_id)}<p className="text-xs text-muted-foreground">{gradeName.get(b.grade_id)}</p></td>
                  <td className="p-3">{b.guardian_name}<p className="text-xs text-muted-foreground">{b.guardian_phone}</p></td>
                  <td className="p-3 text-right">{formatKES(b.invoiced + b.adjustments)}</td>
                  <td className="p-3 text-right text-green-700">{formatKES(b.paid)}</td>
                  <td className="p-3 text-right font-semibold text-red-700">{formatKES(b.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
