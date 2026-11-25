import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Sends queued SMS through Africa's Talking. Messages are queued by the database
 * (receipts, reminders, notices); this only delivers them and records the result.
 * Needs: AT_USERNAME, AT_API_KEY (and optionally AT_SENDER_ID). AT_USERNAME=sandbox uses the test servers.
 */

export interface DispatchResult { configured: boolean; sent: number; failed: number; left?: number; error?: string }

export function smsConfigured() {
  return Boolean(process.env.AT_USERNAME?.trim() && process.env.AT_API_KEY?.trim());
}

interface AtResponse {
  SMSMessageData?: { Message?: string; Recipients?: { statusCode: number; status: string; number: string; messageId?: string }[] };
}

async function sendOne(to: string, message: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const username = process.env.AT_USERNAME!.trim();
  const host = username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';
  const form = new URLSearchParams({ username, to, message });
  const sender = process.env.AT_SENDER_ID?.trim();
  if (sender) form.set('from', sender);
  try {
    const res = await fetch(`https://${host}/version1/messaging`, {
      method: 'POST',
      headers: { apiKey: process.env.AT_API_KEY!.trim(), Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, error: `Provider replied ${res.status}` };
    const data = (await res.json()) as AtResponse;
    const r = data.SMSMessageData?.Recipients?.[0];
    if (r && [100, 101, 102].includes(r.statusCode)) return { ok: true, id: r.messageId };
    return { ok: false, error: r?.status ?? data.SMSMessageData?.Message ?? 'No recipient result' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/** Deliver up to `limit` queued messages. Safe to call often and from several places at once. */
export async function dispatchPending(limit = 40): Promise<DispatchResult> {
  if (!smsConfigured()) return { configured: false, sent: 0, failed: 0 };
  let db;
  try { db = createServiceClient(); } catch { return { configured: true, sent: 0, failed: 0, error: 'Service key missing' }; }
  const { data, error } = await db.rpc('sms_claim_batch', { p_limit: limit });
  if (error) return { configured: true, sent: 0, failed: 0, error: error.message };
  const rows = (data ?? []) as { id: string; to_phone: string; body: string }[];
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += 5) {
    await Promise.all(rows.slice(i, i + 5).map(async (m) => {
      const r = await sendOne(m.to_phone, m.body);
      await db.rpc('sms_mark', { p_id: m.id, p_ok: r.ok, p_provider_id: r.id ?? null, p_error: r.error ?? null });
      if (r.ok) sent++; else failed++;
    }));
  }
  return { configured: true, sent, failed };
}

/** Best effort: never lets an SMS problem break the caller. */
export async function dispatchQuietly() {
  try { await dispatchPending(20); } catch (e) { console.error('[sms] dispatch failed:', e instanceof Error ? e.message : e); }
}
