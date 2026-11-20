import { NextResponse } from 'next/server';
import { callbackSecretOk } from '@/lib/mpesa/daraja';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Safaricom posts every Paybill/Till payment here. The database function records it once
 * (the M-Pesa transaction id is unique) and puts it on the right child's account using the
 * account number the parent typed. Anything it cannot match waits in Admin > Fees > M-Pesa.
 */
export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get('s');
  if (!callbackSecretOk(secret)) return NextResponse.json({ ResultCode: 1, ResultDesc: 'Unauthorised' }, { status: 401 });

  try {
    const payload = await request.json();
    const { data, error } = await createServiceClient().rpc('mpesa_record_c2b', { p: payload });
    if (error) console.error('[mpesa c2b] could not record:', error.code, error.message);
    else console.log('[mpesa c2b]', JSON.stringify(data));
  } catch (err) {
    console.error('[mpesa c2b] error:', err instanceof Error ? err.message : err);
  }
  // Always acknowledge: Safaricom does not need to know about our bookkeeping.
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
