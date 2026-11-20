import { NextResponse } from 'next/server';
import { callbackSecretOk, parseStkCallback, type StkCallbackBody } from '@/lib/mpesa/daraja';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/** Result of the PIN prompt sent to a parent's phone. */
export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get('s');
  if (!callbackSecretOk(secret)) return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorised' }, { status: 401 });

  try {
    const parsed = parseStkCallback((await request.json()) as StkCallbackBody);
    if (parsed) {
      const { error } = await createServiceClient().rpc('mpesa_stk_complete', {
        p_checkout: parsed.checkoutRequestId,
        p_success: parsed.success,
        p_receipt: parsed.receipt,
        p_amount_cents: parsed.amountCents,
        p_desc: parsed.description,
      });
      if (error) console.error('[mpesa stk] could not record:', error.code, error.message);
    }
  } catch (err) {
    console.error('[mpesa stk] error:', err instanceof Error ? err.message : err);
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
