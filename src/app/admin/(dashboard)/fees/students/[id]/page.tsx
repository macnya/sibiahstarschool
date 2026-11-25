import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { postAdjustmentAction, recordPaymentAction, toggleSubscriptionAction } from '@/app/admin/fees-actions';
import { getStudentFinance } from '@/lib/fees/admin-queries';
import { ADJUSTMENT_LABEL, formatKES } from '@/lib/fees/money';
import { formatDate } from '@/lib/admissions/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export default async function StudentFeesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const data = await getStudentFinance(id);
  if (!data) notFound();
  const { student: s, campus, grade, balance, ledger, subscribed, optionalItems } = data;
  const owed = balance?.balance ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm';

  return (
    <div className="space-y-6">
      <Link href="/admin/fees/payments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Payments</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-primary">{s.first_name} {s.middle_name} {s.last_name}</h2>
          <p className="text-sm text-muted-foreground">{s.admission_number} · {grade?.name} · {campus?.name}</p>
          <p className="text-sm text-muted-foreground">Parent: {s.guardian_name} · {s.guardian_phone}</p>
        </div>
        <div className="rounded-lg border bg-card px-6 py-3 text-right">
          <p className="text-xs uppercase text-muted-foreground">{owed > 0 ? 'Balance owed' : owed < 0 ? 'Credit' : 'Balance'}</p>
          <p className={`text-3xl font-bold ${owed > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatKES(Math.abs(owed))}</p>
        </div>
      </div>

      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Receive payment</CardTitle></CardHeader>
            <CardContent>
              <form action={recordPaymentAction} className="space-y-3">
                <input type="hidden" name="student_id" value={s.id} />
                <div><label htmlFor="amount" className="mb-1 block text-xs text-muted-foreground">Amount (KES)</label><Input id="amount" name="amount" inputMode="decimal" defaultValue={owed > 0 ? String(owed / 100) : ''} required /></div>
                <div>
                  <label htmlFor="method" className="mb-1 block text-xs text-muted-foreground">Method</label>
                  <select id="method" name="method" defaultValue="kcb" className={field}>
                    <option value="kcb">KCB Lipa Karo</option><option value="mpesa">M-Pesa</option><option value="bank">Bank transfer / deposit</option><option value="cash">Cash</option><option value="cheque">Cheque</option><option value="card">Card (POS)</option><option value="other">Other</option>
                  </select>
                </div>
                <div><label htmlFor="reference" className="mb-1 block text-xs text-muted-foreground">KCB / M-Pesa code, cheque no. or bank slip</label><Input id="reference" name="reference" maxLength={60} autoComplete="off" /></div>
                <div><label htmlFor="payer_name" className="mb-1 block text-xs text-muted-foreground">Paid by</label><Input id="payer_name" name="payer_name" defaultValue={s.guardian_name} maxLength={120} /></div>
                <div><label htmlFor="received_on" className="mb-1 block text-xs text-muted-foreground">Date received</label><Input id="received_on" name="received_on" type="date" defaultValue={today} max={today} /></div>
                <Button type="submit" className="w-full">Record &amp; print receipt</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Bursary, discount or adjustment</CardTitle></CardHeader>
            <CardContent>
              <form action={postAdjustmentAction} className="space-y-3">
                <input type="hidden" name="student_id" value={s.id} />
                <select name="kind" required defaultValue="" className={field}>
                  <option value="" disabled>Type…</option>
                  {Object.entries(ADJUSTMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Input name="amount" inputMode="decimal" placeholder="Amount (KES)" required />
                <Input name="description" placeholder="Reason, e.g. Sibling bursary Term 2" required minLength={2} maxLength={300} />
                <p className="text-xs text-muted-foreground">Bursaries, discounts and waivers reduce the balance. Penalties and refunds increase it. For opening balances and corrections, put “-” before the amount to reduce.</p>
                <Button type="submit" variant="outline" className="w-full">Save adjustment</Button>
              </form>
            </CardContent>
          </Card>

          {optionalItems.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Optional fees</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {optionalItems.map((item) => {
                  const on = subscribed.has(item.id);
                  return (
                    <form key={item.id} action={toggleSubscriptionAction} className="flex items-center justify-between gap-2 text-sm">
                      <input type="hidden" name="student_id" value={s.id} />
                      <input type="hidden" name="fee_item_id" value={item.id} />
                      <input type="hidden" name="on" value={on ? '0' : '1'} />
                      <span>{item.name}: <strong className={on ? 'text-green-700' : 'text-muted-foreground'}>{on ? 'Yes' : 'No'}</strong></span>
                      <Button type="submit" size="sm" variant="ghost">{on ? 'Remove' : 'Add'}</Button>
                    </form>
                  );
                })}
                <p className="text-xs text-muted-foreground">Applies from the next invoice.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Statement</CardTitle></CardHeader>
            <CardContent>
              {ledger.length === 0 ? <p className="text-sm text-muted-foreground">No invoices or payments yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="pb-2">Date</th><th className="pb-2">Details</th><th className="pb-2 text-right">Charged</th><th className="pb-2 text-right">Paid / credited</th><th className="pb-2 text-right">Balance</th></tr>
                    </thead>
                    <tbody>
                      {ledger.map((l, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{formatDate(l.date)}</td>
                          <td className="py-2 pr-3">{l.link ? <Link href={l.link} className="text-primary hover:underline">{l.description}</Link> : l.description}</td>
                          <td className="py-2 text-right">{l.amountCents > 0 ? formatKES(l.amountCents) : ''}</td>
                          <td className="py-2 text-right text-green-700">{l.amountCents < 0 ? formatKES(-l.amountCents) : ''}</td>
                          <td className="py-2 pl-3 text-right font-medium">{formatKES(l.balanceCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
