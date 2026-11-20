'use server';

import { headers } from 'next/headers';
import { createPublicClient } from '@/lib/supabase/public';
import { createServiceClient } from '@/lib/supabase/service';
import { callbackUrl, getMpesaConfig, normalizeKenyanPhone, stkPush } from '@/lib/mpesa/daraja';
import { allowRequest } from '@/lib/rate-limit';
import type { FeeAccount } from '@/lib/supabase/types';

export type AccountResult = { ok: true; account: FeeAccount | null; phoneCapable: boolean } | { ok: false; error: string };
export type StartResult = { ok: true; requestId: string } | { ok: false; error: string };
export type StatusResult = { ok: true; status: 'pending' | 'paid' | 'failed'; receipt?: string | null; detail?: string | null } | { ok: false; error: string };

async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown').split(',')[0].trim();
}

async function lookup(admissionNumber: string, phone: string) {
  const { data, error } = await createPublicClient().rpc('get_fee_account', { p_admission_number: admissionNumber, p_phone: phone });
  if (error) {
    console.error('[pay-fees] lookup failed:', error.code, error.message);
    return { error: true as const, account: null };
  }
  return { error: false as const, account: (data ?? null) as FeeAccount | null };
}

/** A family looks up their child's fees with the admission number AND the phone number on file. */
export async function lookupFeeAccount(admissionNumber: string, phone: string): Promise<AccountResult> {
  if (!allowRequest(`fees-lookup:${await clientIp()}`, 15)) {
    return { ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
  }
  if (admissionNumber.trim().length < 5 || phone.replace(/\D/g, '').length < 7) {
    return { ok: false, error: 'Enter the admission number and the phone number the school has for you.' };
  }
  const result = await lookup(admissionNumber, phone);
  if (result.error) return { ok: false, error: 'We could not check the account just now. Please try again.' };
  const phoneCapable = result.account ? getMpesaConfig(result.account.campus_code) !== null : false;
  return { ok: true, account: result.account, phoneCapable };
}

/** Sends the M-Pesa PIN prompt to the parent's phone. */
export async function startFeePayment(input: { admissionNumber: string; phone: string; amountKes: number; payPhone: string }): Promise<StartResult> {
  if (!allowRequest(`fees-pay:${await clientIp()}`, 6)) {
    return { ok: false, error: 'Too many payment attempts. Please wait a few minutes.' };
  }
  const amount = Math.round(Number(input.amountKes));
  if (!Number.isFinite(amount) || amount < 10 || amount > 150000) {
    return { ok: false, error: 'Enter an amount between KES 10 and KES 150,000. For larger amounts, pay by Paybill or at the school.' };
  }
  const payPhone = normalizeKenyanPhone(input.payPhone);
  if (!payPhone) return { ok: false, error: 'Enter the M-Pesa number to charge, e.g. 0712 345 678.' };

  // Re-check who they are on the server: never trust the browser's earlier lookup.
  const { account, error } = await lookup(input.admissionNumber, input.phone);
  if (error) return { ok: false, error: 'We could not start the payment. Please try again.' };
  if (!account) return { ok: false, error: 'We could not verify this account. Please look it up again.' };

  const cfg = getMpesaConfig(account.campus_code);
  if (!cfg) return { ok: false, error: 'Payment by phone prompt is not available yet. Please use the Paybill details shown.' };

  const service = createServiceClient();
  const { data: student } = await service.from('students').select('campus_id').eq('id', account.student_id).maybeSingle();
  if (!student) return { ok: false, error: 'We could not start the payment. Please try again.' };

  // Too many open prompts for one child is a sign of abuse or a stuck phone.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await service.from('mpesa_stk_requests').select('id', { count: 'exact', head: true })
    .eq('student_id', account.student_id).eq('status', 'pending').gte('created_at', since);
  if ((count ?? 0) >= 3) return { ok: false, error: 'A payment is already waiting for this child. Please finish it on your phone or wait a few minutes.' };

  const { data: row, error: insertError } = await service.from('mpesa_stk_requests')
    .insert({ student_id: account.student_id, campus_id: student.campus_id, amount_cents: amount * 100, phone: payPhone })
    .select('id').single();
  if (insertError || !row) return { ok: false, error: 'We could not start the payment. Please try again.' };

  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || `${proto}://${host}`;
    const sent = await stkPush(cfg, {
      phone: payPhone,
      amountKes: amount,
      accountReference: account.admission_number,
      description: 'School fees',
      callbackUrl: callbackUrl(origin, '/api/payments/stk/callback'),
    });
    await service.from('mpesa_stk_requests')
      .update({ checkout_request_id: sent.checkoutRequestId, merchant_request_id: sent.merchantRequestId })
      .eq('id', row.id);
    return { ok: true, requestId: row.id };
  } catch (err) {
    console.error('[pay-fees] STK push failed:', err instanceof Error ? err.message : err);
    await service.from('mpesa_stk_requests').update({ status: 'failed', result_desc: 'Could not send prompt' }).eq('id', row.id);
    return { ok: false, error: 'We could not send the payment prompt to your phone. Please try again, or use the Paybill details shown.' };
  }
}

/** The page polls this while the parent enters their PIN. */
export async function checkFeePayment(requestId: string, phone: string): Promise<StatusResult> {
  if (!allowRequest(`fees-status:${await clientIp()}`, 80)) return { ok: false, error: 'Too many checks. Please wait a moment.' };
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false, error: 'Invalid request.' };
  const { data, error } = await createPublicClient().rpc('get_stk_status', { p_request: requestId, p_phone: phone });
  if (error || !data) return { ok: false, error: 'We could not check the payment just now.' };
  const row = data as { status: 'pending' | 'paid' | 'failed'; receipt?: string | null; detail?: string | null };
  return { ok: true, status: row.status, receipt: row.receipt, detail: row.detail };
}
