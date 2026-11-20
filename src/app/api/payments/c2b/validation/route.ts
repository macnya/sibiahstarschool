import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Safaricom asks "may I accept this payment?" before taking it (only if external validation
 * is switched on for the Paybill). We accept everything: a payment with a wrong account
 * number is kept as "unmatched" for the school office to assign, so no parent's money bounces.
 */
export async function POST() {
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
