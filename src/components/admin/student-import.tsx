'use client';

import { useMemo, useState, useTransition } from 'react';
import { CheckCircle2, Download, FileUp, Loader2 } from 'lucide-react';
import { runStudentImport, type ImportResult } from '@/app/admin/students-import-actions';
import { mapTable, parseCsv, type GradeRef, type MappedLine } from '@/lib/students/import-parse';
import { formatKES } from '@/lib/fees/money';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ImportCampus { id: string; name: string; grades: GradeRef[] }

type Phase = 'edit' | 'checked' | 'done';

function csvCell(v: string | number | null | undefined) {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
}

export function StudentImport({ campuses }: { campuses: ImportCampus[] }) {
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? '');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [phase, setPhase] = useState<Phase>('edit');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const campus = campuses.find((c) => c.id === campusId);
  const mapped = useMemo(() => (text.trim() ? mapTable(parseCsv(text), campus?.grades ?? []) : null), [text, campus]);
  const sendable = useMemo(() => (mapped?.lines ?? []).filter((l): l is MappedLine & { data: NonNullable<MappedLine['data']> } => !!l.data), [mapped]);
  const owed = sendable.reduce((a, l) => a + Math.max(l.data.opening_balance_cents ?? 0, 0), 0);

  function reset(next?: Partial<{ text: string; fileName: string }>) {
    setPhase('edit'); setResult(null); setError(null);
    if (next?.text !== undefined) setText(next.text);
    if (next?.fileName !== undefined) setFileName(next.fileName);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 3_000_000) return setError('That file is too large. A pupil list should be well under 3 MB.');
    if (/\.xlsx?$/i.test(file.name)) return setError('Please save the Excel file as CSV first (File → Save As → CSV), or paste the cells into the box below.');
    reset({ text: await file.text(), fileName: file.name });
  }

  function run(commit: boolean) {
    setError(null);
    startTransition(async () => {
      const response = await runStudentImport(campusId, sendable.map((l) => l.data), commit);
      if (!response.ok) return setError(response.error);
      setResult(response.result);
      setPhase(commit ? 'done' : 'checked');
    });
  }

  const outcome = (index: number) => result?.rows[index];
  function downloadReport() {
    const lines = (mapped?.lines ?? []).map((l) => {
      const sentIndex = sendable.findIndex((s) => s.line === l.line);
      const r = sentIndex >= 0 ? outcome(sentIndex) : undefined;
      const status = r ? (r.status === 'ok' ? (result?.committed ? 'Imported' : 'Ready') : r.status === 'duplicate' ? 'Skipped (duplicate)' : 'Not imported') : 'Not imported';
      return [l.line, l.label, status, r?.admission_number ?? l.data?.admission_number ?? '', r?.message ?? l.errors.join('; ')].map(csvCell).join(',');
    });
    const blob = new Blob(['\ufeff' + ['File line,Pupil,Result,Admission number,Note'].concat(lines).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `import-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const badRows = (mapped?.lines ?? []).filter((l) => !l.data);
  const dbIssues = (result?.rows ?? []).map((r, i) => ({ ...r, label: sendable[i]?.label, line: sendable[i]?.line })).filter((r) => r.status !== 'ok');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">1. Choose the school and add your list</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {campuses.length > 1 && (
            <div>
              <label htmlFor="campus" className="mb-1 block text-xs text-muted-foreground">Import into</label>
              <select id="campus" value={campusId} onChange={(e) => { setCampusId(e.target.value); reset(); }} className="h-10 rounded-md border bg-background px-3 text-sm">
                {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              <FileUp className="h-4 w-4" />Choose CSV file
              <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
            <Button asChild variant="ghost" size="sm"><a href="/admin/students/import/template"><Download className="mr-1.5 h-4 w-4" />Download template</a></Button>
          </div>
          <div>
            <label htmlFor="paste" className="mb-1 block text-xs text-muted-foreground">…or copy the cells from Excel (include the heading row) and paste them here</label>
            <textarea id="paste" value={text} onChange={(e) => reset({ text: e.target.value, fileName: '' })} rows={6} spellCheck={false}
              className="w-full rounded-md border bg-background p-3 font-mono text-xs" placeholder={'First name\tLast name\tGender\tClass\tParent name\tParent phone\tBalance\nWanjiru\tKamau\tF\tGrade 4\tMary Kamau\t0712 345 678\t15000'} />
          </div>
          <p className="text-xs text-muted-foreground">
            Needed for every pupil: <strong>name, gender, class, parent name, parent phone</strong>. Optional: date of birth, admission number, UPI number, parent email, opening balance
            (money owed; put it in brackets or after a minus for a credit). Column names are recognised in many spellings (e.g. “Surname”, “Adm No”, “Fee Balance”).
          </p>
        </CardContent>
      </Card>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {mapped && (
        <Card>
          <CardHeader><CardTitle className="text-base">2. What we understood</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {mapped.missingColumns.length > 0 ? (
              <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
                <p className="font-medium">We could not find these columns in your heading row:</p>
                <ul className="mt-1 list-disc pl-5">{mapped.missingColumns.map((m) => <li key={m}>{m}</li>)}</ul>
                <p className="mt-2">Add or rename them, then paste/choose the file again.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="rounded-md bg-green-50 px-3 py-1.5 text-green-800"><strong>{mapped.ready}</strong> pupils ready</span>
                  {mapped.problems > 0 && <span className="rounded-md bg-red-50 px-3 py-1.5 text-red-800"><strong>{mapped.problems}</strong> rows need fixing (they will be left out)</span>}
                  {owed > 0 && <span className="rounded-md bg-muted px-3 py-1.5">Opening balances owed: <strong>{formatKES(owed)}</strong></span>}
                </div>
                {mapped.unusedHeaders.length > 0 && <p className="text-xs text-muted-foreground">Ignored columns: {mapped.unusedHeaders.join(', ')}</p>}
                {badRows.length > 0 && (
                  <div className="max-h-64 overflow-auto rounded-md border text-sm">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-muted text-left text-xs uppercase"><tr><th className="p-2">Line</th><th className="p-2">Pupil</th><th className="p-2">Problem</th></tr></thead>
                      <tbody>{badRows.slice(0, 100).map((l) => <tr key={l.line} className="border-t align-top"><td className="p-2">{l.line}</td><td className="p-2">{l.label}</td><td className="p-2 text-red-700">{l.errors.join(' · ')}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
                {sendable.some((l) => l.warnings.length > 0) && (
                  <p className="text-xs text-amber-800">Notes: {sendable.filter((l) => l.warnings.length).slice(0, 5).map((l) => `line ${l.line}: ${l.warnings.join(', ')}`).join(' · ')}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {mapped && mapped.missingColumns.length === 0 && sendable.length > 0 && phase !== 'done' && (
        <Card>
          <CardHeader><CardTitle className="text-base">3. Check, then import</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              “Check” compares the list with the school’s records (duplicates, admission numbers already used) and <strong>saves nothing</strong>. Importing is safe to repeat:
              pupils already in the system are skipped, never doubled.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={pending} onClick={() => run(false)}>
                {pending && phase === 'edit' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking…</> : 'Check the list'}
              </Button>
              {phase === 'checked' && result && result.ok > 0 && (
                <Button type="button" disabled={pending} onClick={() => run(true)}>
                  {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</> : `Import ${result.ok} pupil${result.ok === 1 ? '' : 's'}`}
                </Button>
              )}
            </div>
            {phase === 'checked' && result && (
              <div className="space-y-2 text-sm">
                <p><strong className="text-green-700">{result.ok}</strong> will be imported · <strong>{result.duplicates}</strong> already exist (skipped) · <strong className="text-red-700">{result.errors}</strong> cannot be imported</p>
                {dbIssues.length > 0 && (
                  <ul className="max-h-48 overflow-auto rounded-md border p-3 text-xs">
                    {dbIssues.slice(0, 80).map((r) => <li key={r.row} className={r.status === 'error' ? 'text-red-700' : 'text-muted-foreground'}>Line {r.line} · {r.label}: {r.message}</li>)}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {phase === 'done' && result && (
        <Card className="border-green-300">
          <CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 text-lg font-semibold text-green-800"><CheckCircle2 className="h-5 w-5" />Import complete</p>
            <p className="text-sm"><strong>{result.ok}</strong> pupils imported · <strong>{result.duplicates}</strong> skipped as duplicates · <strong>{result.errors}</strong> not imported</p>
            <p className="text-sm text-muted-foreground">Next: set up fees (Fees → Setup), then raise this term’s invoices (Fees → Invoices). Opening balances are already on each child’s account.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={downloadReport}><Download className="mr-1.5 h-4 w-4" />Download report with admission numbers</Button>
              <Button asChild><a href="/admin/students">View students</a></Button>
              <Button asChild variant="ghost"><a href="/admin/fees/setup">Set up fees</a></Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
