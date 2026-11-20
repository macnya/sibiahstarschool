import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { reversePaymentAction } from '@/app/admin/fees-actions';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { getReceipt } from '@/lib/fees/admin-queries';
import { METHOD_LABEL, formatKES } from '@/lib/fees/money';
import { formatDate } from '@/lib/admissions/constants';
import { PrintButton } from '@/components/fees/print-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getAdminContext();
  const data = await getReceipt(id);
  if (!data) notFound();
  const { payment: p, student, campus, grade, balance } = data;
  const reversed = p.status === 'reversed';

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href={student ? `/admin/fees/students/${student.id}` : '/admin/fees/payments'} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back to account</Link>
        <PrintButton label="Print receipt" />
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 print:hidden">{sp.ok}</div>}

      <article className="relative rounded-lg border bg-card p-8 print:border-0 print:p-0">
        {reversed && <p className="absolute right-6 top-6 rotate-6 rounded border-2 border-red-600 px-3 py-1 text-lg font-bold text-red-600">REVERSED</p>}
        <header className="border-b pb-4 text-center">
          <h2 className="text-xl font-bold text-primary">{campus?.name}</h2>
          <p className="text-sm text-muted-foreground">{[campus?.address, campus?.town].filter(Boolean).join(', ')}</p>
          {campus?.phone && <p className="text-sm text-muted-foreground">{campus.phone}</p>}
          <p className="mt-3 text-lg font-semibold tracking-wide">OFFICIAL RECEIPT</p>
          <p className="font-mono text-sm">{p.receipt_number}</p>
        </header>
        <dl className="space-y-2 py-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd>{formatDate(p.received_on)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Received from</dt><dd>{p.payer_name || student?.guardian_name || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Student</dt><dd className="text-right">{student?.first_name} {student?.last_name}<br /><span className="text-xs text-muted-foreground">{student?.admission_number} · {grade?.name}</span></dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Payment method</dt><dd>{METHOD_LABEL[p.method]}{p.reference ? ` · ${p.reference}` : ''}</dd></div>
        </dl>
        <div className="rounded-md bg-muted px-4 py-3">
          <p className="text-xs uppercase text-muted-foreground">Amount received</p>
          <p className="text-3xl font-bold text-primary">{formatKES(p.amount_cents)}</p>
        </div>
        {balance && !reversed && (
          <p className="mt-3 text-sm">Fee balance after this payment: <strong>{balance.balance > 0 ? formatKES(balance.balance) : balance.balance < 0 ? `${formatKES(-balance.balance)} credit` : 'Nil — paid up'}</strong></p>
        )}
        {p.notes && <p className="mt-3 text-sm text-muted-foreground">{p.notes}</p>}
        {reversed && <p className="mt-3 text-sm text-red-700">Reversed on {formatDate(p.reversed_at)}: {p.reversal_reason}</p>}
        <footer className="mt-8 flex justify-between border-t pt-3 text-xs text-muted-foreground"><span>Thank you.</span><span>Issued {formatDate(p.created_at)}</span></footer>
      </article>

      {!reversed && ctx.isGroupAdmin && (
        <form action={reversePaymentAction} className="flex flex-wrap items-end gap-3 rounded-lg border p-4 print:hidden">
          <input type="hidden" name="id" value={p.id} />
          <div className="min-w-60 flex-1"><label htmlFor="reason" className="mb-1 block text-xs text-muted-foreground">Reverse this payment (recorded against the wrong child, bounced cheque…)</label><Input id="reason" name="reason" placeholder="Reason (required)" required minLength={5} /></div>
          <Button type="submit" variant="outline" className="text-red-700">Reverse payment</Button>
        </form>
      )}
    </div>
  );
}
