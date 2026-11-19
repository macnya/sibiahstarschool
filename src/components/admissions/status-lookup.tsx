'use client';

import { useState, useTransition } from 'react';
import { Loader2, Search } from 'lucide-react';
import { lookupApplication } from '@/app/admissions/apply/actions';
import { STATUS_FAMILY_MESSAGE, STATUS_LABEL, STATUS_TONE, formatDate } from '@/lib/admissions/constants';
import type { ApplicationStatusResult } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function StatusLookup() {
  const [reference, setReference] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationStatusResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await lookupApplication(reference, phone);
      setSearched(true);
      if (!response.ok) setError(response.error);
      else setResult(response.result);
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference number</Label>
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="APP-SSS-27-0001-AB3" autoComplete="off" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number you applied with</Label>
              <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" required />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking…</> : <><Search className="mr-2 h-4 w-4" />Check status</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {searched && !error && !result && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          We could not find an application with those details. Please check the reference number and phone number and try again.
        </div>
      )}

      {result && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{result.reference}</p>
                <h2 className="text-xl font-bold text-primary">{result.student_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {result.grade_name} · {result.campus_name} · {result.intake_year} intake
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_TONE[result.status]}`}>{STATUS_LABEL[result.status]}</span>
            </div>

            <p className="text-sm">{STATUS_FAMILY_MESSAGE[result.status]}</p>

            {result.assessment_date && (
              <p className="rounded-md bg-purple-50 px-3 py-2 text-sm text-purple-900">
                <strong>Assessment date:</strong> {formatDate(result.assessment_date)}
              </p>
            )}
            {result.decision_note && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message from the school</p>
                <p className="mt-1">{result.decision_note}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Progress</p>
              <ol className="space-y-2 border-l-2 border-muted pl-4">
                {result.history.map((h, i) => (
                  <li key={i} className="relative text-sm">
                    <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                    <span className="font-medium">{STATUS_LABEL[h.status] ?? h.status}</span>
                    <span className="ml-2 text-muted-foreground">{formatDate(h.at)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
