import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { dispatchPending } from '@/lib/sms/send';

export const dynamic = 'force-dynamic';

/** Called every few minutes by a cPanel cron job to send queued SMS and retry failures. */
async function handle(request: Request) {
  const secret = process.env.SMS_CRON_SECRET?.trim();
  const provided = new URL(request.url).searchParams.get('s') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret ?? '');
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await dispatchPending(100);
  return NextResponse.json({ ok: true, ...r });
}
export const GET = handle;
export const POST = handle;
