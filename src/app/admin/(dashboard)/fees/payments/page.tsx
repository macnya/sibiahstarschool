import Link from 'next/link';
import { Search } from 'lucide-react';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { getBalances, getRecentPayments } from '@/lib/fees/admin-queries';
import { METHOD_LABEL, formatKES } from '@/lib/fees/money';
import { formatDate } from '@/lib/admissions/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  await getAdminContext();
  const [results, recent] = await Promise.all([q ? getBalances({ q }) : Promise.resolve([]), getRecentPayments(40)]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle className="text-base">Receive a payment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap gap-3">
            <div className="min-w-60 flex-1"><Input name="q" defaultValue={q} placeholder="Find the child: name, admission number, parent or phone" autoFocus /></div>
            <Button type="submit"><Search className="mr-1.5 h-4 w-4" />Find</Button>
          </form>
          {q && (
            results.length === 0 ? <p className="text-sm text-muted-foreground">No child found for “{q}”.</p> : (
              <ul className="divide-y rounded-md border">
                {results.slice(0, 12).map((b) => (
                  <li key={b.student_id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                    <div>
                      <p className="font-medium">{b.first_name} {b.last_name} <span className="font-mono text-xs text-muted-foreground">{b.admission_number}</span></p>
                      <p className="text-xs text-muted-foreground">{b.guardian_name} · {b.guardian_phone}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={b.balance > 0 ? 'font-semibold text-red-700' : 'text-green-700'}>{b.balance > 0 ? `Owes ${formatKES(b.balance)}` : b.balance < 0 ? `Credit ${formatKES(-b.balance)}` : 'Paid up'}</span>
                      <Button asChild size="sm"><Link href={`/admin/fees/students/${b.student_id}`}>Open account</Link></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-primary">Recent payments</h2>
        {recent.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p> : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Receipt</th><th className="p-3">Child</th><th className="p-3">Method</th><th className="p-3 text-right">Amount</th><th className="p-3">Date</th></tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className={`border-t ${p.status === 'reversed' ? 'text-muted-foreground line-through' : ''}`}>
                    <td className="p-3 font-mono text-xs"><Link href={`/admin/fees/receipts/${p.id}`} className="text-primary hover:underline">{p.receipt_number}</Link></td>
                    <td className="p-3">{p.student ? <Link href={`/admin/fees/students/${p.student.id}`} className="hover:underline">{p.student.first_name} {p.student.last_name}</Link> : '—'}</td>
                    <td className="p-3">{METHOD_LABEL[p.method]}{p.source !== 'staff' ? <span className="ml-1 text-xs text-muted-foreground">(auto)</span> : null}</td>
                    <td className="p-3 text-right font-medium">{formatKES(p.amount_cents)}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(p.received_on)}</td>
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
