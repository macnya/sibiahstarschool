import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cancelInvoiceAction } from '@/app/admin/fees-actions';
import { getInvoice } from '@/lib/fees/admin-queries';
import { formatKES } from '@/lib/fees/money';
import { channelsFor } from '@/lib/fees/payment-channels';
import { formatDate } from '@/lib/admissions/constants';
import { PrintButton } from '@/components/fees/print-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const data = await getInvoice(id);
  if (!data) notFound();
  const { invoice, lines, student, campus } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/fees/invoices" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />All invoices</Link>
        <PrintButton label="Print invoice" />
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 print:hidden">{sp.ok}</div>}

      <article className="rounded-lg border bg-card p-8 print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-primary">{campus?.name}</h2>
            <p className="text-sm text-muted-foreground">{[campus?.address, campus?.town].filter(Boolean).join(', ')}</p>
            {campus?.phone && <p className="text-sm text-muted-foreground">{campus.phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">FEE INVOICE</p>
            <p className="font-mono text-sm">{invoice.number}</p>
            {invoice.status === 'cancelled' && <p className="mt-1 text-sm font-semibold text-red-700">CANCELLED</p>}
          </div>
        </header>
        <section className="grid gap-4 py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Student</p>
            <p className="font-medium">{student?.first_name} {student?.middle_name} {student?.last_name}</p>
            <p className="text-muted-foreground">{student?.admission_number}</p>
            <p className="text-muted-foreground">Parent: {student?.guardian_name}</p>
          </div>
          <div className="sm:text-right">
            <p><span className="text-muted-foreground">Term:</span> Term {invoice.term_number}, {invoice.year}</p>
            <p><span className="text-muted-foreground">Date:</span> {formatDate(invoice.created_at)}</p>
            <p><span className="text-muted-foreground">Due:</span> {formatDate(invoice.due_date)}</p>
          </div>
        </section>
        <table className="w-full text-sm">
          <thead className="border-y bg-muted/40 text-left text-xs uppercase"><tr><th className="p-2">Description</th><th className="p-2 text-right">Amount</th></tr></thead>
          <tbody>
            {lines.map((l) => <tr key={l.id} className="border-b"><td className="p-2">{l.description}</td><td className="p-2 text-right">{formatKES(l.amount_cents)}</td></tr>)}
            <tr><td className="p-2 text-right font-semibold">Total</td><td className="p-2 text-right text-lg font-bold">{formatKES(invoice.total_cents)}</td></tr>
          </tbody>
        </table>
        {(() => {
          const channels = campus ? channelsFor(campus, student?.admission_number ?? '', campus.name) : [];
          if (channels.length === 0) return null;
          return (
            <footer className="mt-6 rounded-md bg-muted p-4 text-sm">
              <p className="mb-2 font-semibold">How to pay</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {channels.map((ch) => (
                  <div key={ch.id}>
                    <p className="font-medium">{ch.title}</p>
                    {ch.steps.map((st, n) => <p key={n}>{st.label}{st.value && <> <strong>{st.value}</strong></>}</p>)}
                    {ch.note && <p className="whitespace-pre-line text-muted-foreground">{ch.note}</p>}
                  </div>
                ))}
              </div>
            </footer>
          );
        })()}
        {invoice.notes && <p className="mt-4 text-sm text-muted-foreground">Note: {invoice.notes}</p>}
      </article>

      {invoice.status === 'open' && (
        <form action={cancelInvoiceAction} className="flex flex-wrap items-end gap-3 rounded-lg border p-4 print:hidden">
          <input type="hidden" name="id" value={invoice.id} />
          <div className="min-w-60 flex-1"><label htmlFor="reason" className="mb-1 block text-xs text-muted-foreground">Cancel this invoice (e.g. raised by mistake)</label><Input id="reason" name="reason" placeholder="Reason" required minLength={3} /></div>
          <Button type="submit" variant="outline" className="text-red-700">Cancel invoice</Button>
        </form>
      )}
    </div>
  );
}
