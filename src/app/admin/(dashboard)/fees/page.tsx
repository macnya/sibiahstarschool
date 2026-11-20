import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { getCollectionSummary, getMpesaTransactions, getTerms } from '@/lib/fees/admin-queries';
import { formatKES } from '@/lib/fees/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold ${tone ?? 'text-primary'}`}>{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function FeesOverviewPage() {
  const ctx = await getAdminContext();
  const terms = await getTerms();
  const current = terms.find((t) => t.is_current) ?? null;
  const year = current?.year ?? new Date().getFullYear();
  const [summary, mpesa] = await Promise.all([getCollectionSummary(year, current?.number ?? null), getMpesaTransactions()]);
  const unmatched = mpesa.filter((t) => t.status === 'unmatched').length;
  const rate = summary.invoiced > 0 ? Math.min(100, Math.round((summary.collectedYear / summary.invoiced) * 100)) : 0;

  return (
    <div className="space-y-8">
      {!current && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>No current term is set. {ctx.isGroupAdmin ? <>Go to <Link href="/admin/fees/setup" className="underline">Setup</Link> to add this year’s terms and fees.</> : 'Ask a group administrator to set it up.'}</p>
        </div>
      )}
      {unmatched > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>{unmatched}</strong> M-Pesa payment{unmatched === 1 ? '' : 's'} could not be matched to a child. <Link href="/admin/fees/mpesa" className="underline">Assign {unmatched === 1 ? 'it' : 'them'}</Link>.</p>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {current ? `${current.name} ${current.year}` : `${year}`} at a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Invoiced this term" value={formatKES(summary.invoiced)} />
          <Stat label="Collected this year" value={formatKES(summary.collectedYear)} sub={`${rate}% of this term’s invoices`} tone="text-green-700" />
          <Stat label="Total outstanding" value={formatKES(summary.outstanding)} sub={`${summary.owingCount} of ${summary.studentCount} children owe`} tone="text-red-700" />
          <Stat label="Collected today" value={formatKES(summary.collectedToday)} />
        </div>
        {summary.credit > 0 && <p className="mt-3 text-xs text-muted-foreground">Families have {formatKES(summary.credit)} paid in advance (credit).</p>}
      </div>

      {summary.byCampus.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">By school</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="pb-2">School</th><th className="pb-2 text-right">Invoiced (term)</th><th className="pb-2 text-right">Collected (year)</th><th className="pb-2 text-right">Outstanding</th><th className="pb-2 text-right">Owing</th></tr>
              </thead>
              <tbody>
                {summary.byCampus.map((c) => (
                  <tr key={c.name} className="border-t">
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="py-2 text-right">{formatKES(c.invoiced)}</td>
                    <td className="py-2 text-right text-green-700">{formatKES(c.collected)}</td>
                    <td className="py-2 text-right text-red-700">{formatKES(c.outstanding)}</td>
                    <td className="py-2 text-right">{c.owingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Outstanding by class</CardTitle></CardHeader>
          <CardContent>
            {summary.byGrade.length === 0 ? <p className="text-sm text-muted-foreground">No outstanding balances. 🎉</p> : (
              <ul className="space-y-2 text-sm">
                {summary.byGrade.map((g) => (
                  <li key={g.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span>{g.name} <span className="text-muted-foreground">({g.count})</span></span>
                    <span className="font-medium text-red-700">{formatKES(g.outstanding)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Largest balances</CardTitle><Link href="/admin/fees/arrears" className="text-sm text-primary underline">All arrears</Link></CardHeader>
          <CardContent>
            {summary.topArrears.length === 0 ? <p className="text-sm text-muted-foreground">Nobody owes anything right now.</p> : (
              <ul className="space-y-2 text-sm">
                {summary.topArrears.map((b) => (
                  <li key={b.student_id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <Link href={`/admin/fees/students/${b.student_id}`} className="hover:underline">
                      {b.first_name} {b.last_name} <span className="text-muted-foreground">· {b.admission_number}</span>
                    </Link>
                    <span className="font-medium text-red-700">{formatKES(b.balance)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
