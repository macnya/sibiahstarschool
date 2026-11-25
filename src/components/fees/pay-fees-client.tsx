'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { CheckCircle2, Loader2, Search, Smartphone } from 'lucide-react';
import { checkFeePayment, lookupFeeAccount, startFeePayment } from '@/app/pay-fees/actions';
import { formatKES } from '@/lib/fees/money';
import { channelsFor } from '@/lib/fees/payment-channels';
import { formatDate } from '@/lib/admissions/constants';
import type { FeeAccount } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Stage = 'idle' | 'sending' | 'waiting' | 'paid' | 'failed';

export function PayFeesClient() {
  const [admission, setAdmission] = useState('');
  const [phone, setPhone] = useState('');
  const [account, setAccount] = useState<FeeAccount | null>(null);
  const [phoneCapable, setPhoneCapable] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [amount, setAmount] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [payError, setPayError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function onLookup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotFound(false);
    setAccount(null);
    setStage('idle');
    startTransition(async () => {
      const result = await lookupFeeAccount(admission, phone);
      if (!result.ok) return setError(result.error);
      if (!result.account) return setNotFound(true);
      setAccount(result.account);
      setPhoneCapable(result.phoneCapable);
      setPayPhone(phone);
      setAmount(result.account.balance_cents > 0 ? String(Math.ceil(result.account.balance_cents / 100)) : '');
    });
  }

  async function onPay(event: React.FormEvent) {
    event.preventDefault();
    if (!account) return;
    setPayError(null);
    setStage('sending');
    const started = await startFeePayment({ admissionNumber: admission, phone, amountKes: Number(amount), payPhone });
    if (!started.ok) {
      setStage('failed');
      setPayError(started.error);
      return;
    }
    setStage('waiting');
    let tries = 0;
    timer.current = setInterval(async () => {
      tries += 1;
      const status = await checkFeePayment(started.requestId, payPhone);
      if (status.ok && status.status === 'paid') {
        if (timer.current) clearInterval(timer.current);
        setReceipt(status.receipt ?? null);
        setStage('paid');
        const refreshed = await lookupFeeAccount(admission, phone);
        if (refreshed.ok && refreshed.account) setAccount(refreshed.account);
      } else if (status.ok && status.status === 'failed') {
        if (timer.current) clearInterval(timer.current);
        setStage('failed');
        setPayError(status.detail ? `The payment was not completed (${status.detail}).` : 'The payment was not completed.');
      } else if (tries >= 40) {
        if (timer.current) clearInterval(timer.current);
        setStage('failed');
        setPayError('We did not receive a confirmation. If M-Pesa took your money, it will appear on the account shortly — otherwise please try again.');
      }
    }, 4000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6">
          <form onSubmit={onLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adm">Child’s admission number</Label>
              <Input id="adm" value={admission} onChange={(e) => setAdmission(e.target.value)} placeholder="SSS/2027/001" autoComplete="off" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph">Parent’s phone number on the school’s records</Label>
              <Input id="ph" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" required />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking…</> : <><Search className="mr-2 h-4 w-4" />View fee balance</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {notFound && (
        <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          We could not find a child with those details. Please check the admission number and the phone number the school has for you.
        </div>
      )}

      {account && (
        <>
          <Card>
            <CardContent className="space-y-1 p-6">
              <p className="text-sm text-muted-foreground">{account.campus_name} · {account.admission_number}</p>
              <h2 className="text-xl font-bold text-primary">{account.student_name}</h2>
              <p className="pt-2 text-sm text-muted-foreground">{account.balance_cents > 0 ? 'Balance to pay' : account.balance_cents < 0 ? 'Credit (paid in advance)' : 'Balance'}</p>
              <p className={`text-3xl font-bold ${account.balance_cents > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatKES(Math.abs(account.balance_cents))}</p>
            </CardContent>
          </Card>

          {stage === 'paid' ? (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-green-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Payment received — thank you!</p>
                {receipt && <p className="text-sm">Receipt number: <span className="font-mono font-semibold">{receipt}</span></p>}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="space-y-4 p-6">
                {phoneCapable ? (
                  <form onSubmit={onPay} className="space-y-4">
                    <h3 className="flex items-center gap-2 font-semibold text-primary"><Smartphone className="h-5 w-5" />Pay now with M-Pesa</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="amt">Amount (KES)</Label>
                        <Input id="amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pp">M-Pesa number to charge</Label>
                        <Input id="pp" type="tel" inputMode="tel" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} required />
                      </div>
                    </div>
                    <Button type="submit" disabled={stage === 'sending' || stage === 'waiting'} className="w-full">
                      {stage === 'sending' ? 'Sending prompt…' : stage === 'waiting' ? 'Waiting for your PIN…' : 'Send M-Pesa prompt'}
                    </Button>
                    {stage === 'waiting' && <p className="text-sm text-muted-foreground">Check your phone and enter your M-Pesa PIN. This page updates by itself.</p>}
                    {stage === 'failed' && payError && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{payError}</p>}
                  </form>
                ) : null}

                {(() => {
                  const channels = channelsFor(account, account.admission_number, account.campus_name);
                  if (channels.length === 0) return null;
                  return (
                    <div className="space-y-3">
                      <p className="font-semibold text-primary">{phoneCapable ? 'Or pay from your phone or bank' : 'How to pay'}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {channels.map((ch) => (
                          <div key={ch.id} className="rounded-lg border bg-muted/50 p-4 text-sm">
                            <p className="mb-2 font-semibold text-primary">{ch.title}</p>
                            {ch.steps.length > 0 && (
                              <ol className="space-y-1">
                                {ch.steps.map((st, n) => (
                                  <li key={n}>{st.label}{st.value && <> <strong className="rounded bg-white px-1.5 py-0.5 font-mono text-base">{st.value}</strong></>}</li>
                                ))}
                              </ol>
                            )}
                            {ch.note && <p className="mt-2 whitespace-pre-line text-muted-foreground">{ch.note}</p>}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Type the account number exactly as shown. Payments made this way appear on the account within a minute (bank and KCB statement payments can take a little longer).</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="mb-3 font-semibold text-primary">Recent statement</h3>
              {account.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fee records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="pb-2">Date</th><th className="pb-2">Details</th><th className="pb-2 text-right">Amount</th><th className="pb-2 text-right">Balance</th></tr>
                    </thead>
                    <tbody>
                      {account.entries.map((e, i) => (
                        <tr key={i} className="border-t">
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{formatDate(e.date)}</td>
                          <td className="py-2 pr-3">{e.description}</td>
                          <td className={`py-2 text-right whitespace-nowrap ${e.amount_cents < 0 ? 'text-green-700' : ''}`}>{e.amount_cents < 0 ? '−' : ''}{formatKES(Math.abs(e.amount_cents))}</td>
                          <td className="py-2 pl-3 text-right whitespace-nowrap font-medium">{formatKES(e.balance_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
