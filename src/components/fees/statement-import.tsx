'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileUp, Loader2 } from 'lucide-react';
import { runStatementImport, type StatementResult } from '@/app/admin/fees-statement-actions';
import { parseStatement } from '@/lib/fees/statement-parse';
import { formatKES } from '@/lib/fees/money';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface StatementCampus { id: string; name: string }
type Channel = 'kcb' | 'mpesa' | 'bank';
type Phase = 'edit' | 'checked' | 'done';

const CHANNEL_LABEL: Record<Channel, string> = { kcb: 'KCB Lipa Karo / KCB account', mpesa: 'M-Pesa Paybill report', bank: 'Another bank' };
const STATUS_STYLE: Record<string, string> = {
  matched: 'bg-green-100 text-green-800', unmatched: 'bg-amber-100 text-amber-800', duplicate: 'bg-slate-200 text-slate-700', error: 'bg-red-100 text-red-800',
};
const STATUS_LABEL: Record<string, string> = { matched: 'On a child’s account', unmatched: 'Waiting to be matched', duplicate: 'Already recorded', error: 'Not imported' };

export function StatementImport({ campuses }: { campuses: StatementCampus[] }) {
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? '');
  const [channel, setChannel] = useState<Channel>('kcb');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [phase, setPhase] = useState<Phase>('edit');
  const [result, setResult] = useState<StatementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => (text.trim() ? parseStatement(text) : null), [text]);
  const sendable = useMemo(() => (parsed?.lines ?? []).filter((l) => l.data), [parsed]);
  const total = sendable.reduce((a, l) => a + (l.data?.amount_cents ?? 0), 0);
  const badRows = (parsed?.lines ?? []).filter((l) => !l.data);

  function reset(next?: Partial<{ text: string; fileName: string }>) {
    setPhase('edit'); setResult(null); setError(null);
    if (next?.text !== undefined) setText(next.text);
    if (next?.fileName !== undefined) setFileName(next.fileName);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5_000_000) return setError('That file is too large. A statement should be well under 5 MB.');
    if (/\.xlsx?$/i.test(file.name)) return setError('Please save the Excel file as CSV first (File → Save As → CSV), or paste the cells into the box below.');
    reset({ text: await file.text(), fileName: file.name });
  }

  function run(commit: boolean) {
    setError(null);
    startTransition(async () => {
      const response = await runStatementImport(campusId, channel, sendable.map((l) => l.data), commit);
      if (!response.ok) return setError(response.error);
      setResult(response.result);
      setPhase(commit ? 'done' : 'checked');
    });
  }

  const issues = (result?.rows ?? []).filter((r) => r.status === 'unmatched' || r.status === 'error' || r.status === 'duplicate');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">1. Where is the statement from?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {campuses.length > 1 && (
              <div>
                <label htmlFor="campus" className="mb-1 block text-xs text-muted-foreground">School</label>
                <select id="campus" value={campusId} onChange={(e) => { setCampusId(e.target.value); reset(); }} className="h-10 rounded-md border bg-background px-3 text-sm">
                  {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="channel" className="mb-1 block text-xs text-muted-foreground">Statement type</label>
              <select id="channel" value={channel} onChange={(e) => { setChannel(e.target.value as Channel); reset(); }} className="h-10 rounded-md border bg-background px-3 text-sm">
                {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              <FileUp className="h-4 w-4" />Choose CSV file
              <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
          </div>
          <div>
            <label htmlFor="paste" className="mb-1 block text-xs text-muted-foreground">…or copy the rows from the KCB / bank / M-Pesa report (include the heading row) and paste them here</label>
            <textarea id="paste" value={text} onChange={(e) => reset({ text: e.target.value, fileName: '' })} rows={6} spellCheck={false}
              className="w-full rounded-md border bg-background p-3 font-mono text-xs" placeholder={'Date\tTransaction Reference\tReference\tCredit\n10/11/2026\tKCB0001ABC\t12345#24810\t15,000.00'} />
          </div>
          <p className="text-xs text-muted-foreground">
            We look for the date, the amount paid in, the account/reference the parent typed and (if there is one) the transaction code. Money going <em>out</em> is ignored.
            Lines whose account matches a child’s admission number go straight onto that child’s account; the rest wait under Fees → Incoming for the office.
            Importing the same file twice never counts a payment twice.
          </p>
        </CardContent>
      </Card>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {parsed && (
        <Card>
          <CardHeader><CardTitle className="text-base">2. What we understood</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {parsed.missingColumns.length > 0 ? (
              <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-medium">We could not find these columns in your statement:</p>
                <ul className="mt-1 list-disc pl-5">{parsed.missingColumns.map((m) => <li key={m}>{m}</li>)}</ul>
                <p className="mt-2">Check the heading row, then paste/choose the file again.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="rounded-md bg-green-50 px-3 py-1.5 text-green-800"><strong>{sendable.length}</strong> payments · <strong>{formatKES(total)}</strong></span>
                  {parsed.skippedMoneyOut > 0 && <span className="rounded-md bg-muted px-3 py-1.5">{parsed.skippedMoneyOut} money-out lines ignored</span>}
                  {parsed.problems > 0 && <span className="rounded-md bg-red-50 px-3 py-1.5 text-red-800"><strong>{parsed.problems}</strong> rows need fixing (left out)</span>}
                </div>
                {parsed.generatedIds && <p className="text-xs text-amber-800">This statement has no transaction-code column, so we made one from the date, amount and account. That still protects against importing the same line twice, as long as you import the same lines.</p>}
                {badRows.length > 0 && (
                  <div className="max-h-56 overflow-auto rounded-md border text-sm">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-muted text-left text-xs uppercase"><tr><th className="p-2">Line</th><th className="p-2">Payment</th><th className="p-2">Problem</th></tr></thead>
                      <tbody>{badRows.slice(0, 100).map((l) => <tr key={l.line} className="border-t align-top"><td className="p-2">{l.line}</td><td className="p-2">{l.label}</td><td className="p-2 text-red-700">{l.errors.join(' · ')}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {parsed && parsed.missingColumns.length === 0 && sendable.length > 0 && phase !== 'done' && (
        <Card>
          <CardHeader><CardTitle className="text-base">3. Check, then import</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">“Check” changes nothing — it only shows which payments would land on which child.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={pending} onClick={() => run(false)}>{pending && phase === 'edit' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Check the statement</Button>
              <Button type="button" disabled={pending || phase !== 'checked'} onClick={() => run(true)}>{pending && phase === 'checked' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Record these payments</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base">{result.committed && <CheckCircle2 className="h-5 w-5 text-green-600" />}{result.committed ? 'Done' : 'Check result — nothing recorded yet'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-green-50 p-3 text-green-900"><p className="text-2xl font-bold">{result.matched}</p><p className="text-xs">{result.committed ? 'put on accounts' : 'will go on accounts'} · {formatKES(result.matched_cents)}</p></div>
              <div className="rounded-lg bg-amber-50 p-3 text-amber-900"><p className="text-2xl font-bold">{result.unmatched}</p><p className="text-xs">waiting to be matched · {formatKES(result.unmatched_cents)}</p></div>
              <div className="rounded-lg bg-slate-100 p-3"><p className="text-2xl font-bold">{result.duplicates}</p><p className="text-xs">already recorded</p></div>
              <div className="rounded-lg bg-red-50 p-3 text-red-900"><p className="text-2xl font-bold">{result.errors}</p><p className="text-xs">not imported</p></div>
            </div>
            {issues.length > 0 && (
              <div className="max-h-72 overflow-auto rounded-md border text-sm">
                <table className="w-full">
                  <thead className="sticky top-0 bg-muted text-left text-xs uppercase"><tr><th className="p-2">Line</th><th className="p-2">Account typed</th><th className="p-2 text-right">Amount</th><th className="p-2">Result</th></tr></thead>
                  <tbody>
                    {issues.slice(0, 200).map((r) => (
                      <tr key={r.line} className="border-t align-top">
                        <td className="p-2">{r.line}</td><td className="p-2 font-mono text-xs">{r.reference || '—'}</td>
                        <td className="p-2 text-right">{r.amount_cents ? formatKES(r.amount_cents) : '—'}</td>
                        <td className="p-2"><span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>{r.message && <span className="ml-2 text-xs text-muted-foreground">{r.message}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {result.committed && (
              <div className="flex flex-wrap gap-3">
                {result.unmatched > 0 && <Button asChild><Link href="/admin/fees/mpesa">Match the {result.unmatched} waiting payments</Link></Button>}
                <Button asChild variant="outline"><Link href="/admin/fees/payments">See payments</Link></Button>
                <Button type="button" variant="ghost" onClick={() => reset({ text: '', fileName: '' })}>Import another statement</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
