import Link from 'next/link';
import { assignMpesaAction, ignoreMpesaAction } from '@/app/admin/fees-actions';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { getMpesaTransactions } from '@/lib/fees/admin-queries';
import { formatKES } from '@/lib/fees/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

const when = (v: string | null) => (v ? new Date(v).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

export default async function MpesaPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  await getAdminContext();
  const transactions = await getMpesaTransactions();
  const unmatched = transactions.filter((t) => t.status === 'unmatched');
  const handled = transactions.filter((t) => t.status !== 'unmatched').slice(0, 30);

  return (
    <div className="space-y-8">
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <div>
        <h2 className="text-lg font-semibold text-primary">Mobile and bank payments waiting to be matched ({unmatched.length})</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          These came in through your Paybill or a KCB / bank statement with an account number we did not recognise (a typo, or the parent used the child’s name). Put each one on the right child’s account.
        </p>
        {unmatched.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Everything received so far is matched. 🎉</p> : (
          <ul className="space-y-3">
            {unmatched.map((t) => (
              <li key={t.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-primary">{formatKES(t.amount_cents)}</p>
                    <p className="font-mono text-xs text-muted-foreground"><span className="mr-2 rounded bg-muted px-1.5 py-0.5 font-sans uppercase">{t.channel === 'kcb' ? 'KCB' : t.channel === 'bank' ? 'Bank' : 'M-Pesa'}</span>{t.trans_id} · {when(t.trans_time ?? t.created_at)}</p>
                    <p className="mt-1 text-sm">Account typed: <strong>{t.bill_ref || '(none)'}</strong>{t.payer_name ? ` · ${t.payer_name}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <form action={assignMpesaAction} className="flex items-end gap-2">
                      <input type="hidden" name="transaction_id" value={t.id} />
                      <div><label htmlFor={`adm-${t.id}`} className="mb-1 block text-xs text-muted-foreground">Admission number</label><Input id={`adm-${t.id}`} name="admission_number" placeholder="SSS/2027/001" required className="w-40" /></div>
                      <Button type="submit" size="sm">Put on account</Button>
                    </form>
                    <form action={ignoreMpesaAction}>
                      <input type="hidden" name="transaction_id" value={t.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">Not school fees</Button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {handled.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-primary">Recent mobile and bank activity</h2>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Via</th><th className="p-3">Code</th><th className="p-3">When</th><th className="p-3 text-right">Amount</th><th className="p-3">Account</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {handled.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3 text-xs uppercase">{t.channel === 'kcb' ? 'KCB' : t.channel === 'bank' ? 'Bank' : 'M-Pesa'}</td>
                    <td className="p-3 font-mono text-xs">{t.trans_id}</td>
                    <td className="p-3 text-muted-foreground">{when(t.trans_time ?? t.created_at)}</td>
                    <td className="p-3 text-right">{formatKES(t.amount_cents)}</td>
                    <td className="p-3">{t.student_id ? <Link href={`/admin/fees/students/${t.student_id}`} className="text-primary hover:underline">{t.bill_ref || 'View account'}</Link> : t.bill_ref}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${t.status === 'matched' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
