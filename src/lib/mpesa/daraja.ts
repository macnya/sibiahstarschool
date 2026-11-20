import 'server-only';
import { timingSafeEqual } from 'node:crypto';

/**
 * M-Pesa (Safaricom Daraja) helpers.
 *
 * Two ways money arrives:
 *  1. Paybill / Till payments (C2B): the parent pays from their phone using the child's
 *     admission number as the account number. Safaricom tells us, and we match it.
 *  2. Phone prompt (STK push): from the "Pay fees" page, the parent enters their PIN.
 *
 * NOTE: callback URLs must not contain the words "mpesa", "safaricom", "exec", "cmd" or "sql" — Daraja rejects them,
 * which is why the routes live under /api/payments/.
 *
 * Credentials come from environment variables. A campus with its own Paybill can override
 * them with MPESA_<CODE>_SHORTCODE / _PASSKEY / _CONSUMER_KEY / _CONSUMER_SECRET (e.g. MPESA_SSJ_SHORTCODE).
 */

export interface MpesaConfig {
  env: 'sandbox' | 'production';
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
}

function pick(code: string | undefined, name: string) {
  const own = code ? process.env[`MPESA_${code.toUpperCase()}_${name}`] : undefined;
  return (own || process.env[`MPESA_${name}`] || '').trim();
}

export function getMpesaConfig(campusCode?: string): MpesaConfig | null {
  const cfg = {
    env: (process.env.MPESA_ENV === 'sandbox' ? 'sandbox' : 'production') as 'sandbox' | 'production',
    consumerKey: pick(campusCode, 'CONSUMER_KEY'),
    consumerSecret: pick(campusCode, 'CONSUMER_SECRET'),
    shortcode: pick(campusCode, 'SHORTCODE'),
    passkey: pick(campusCode, 'PASSKEY'),
  };
  return cfg.consumerKey && cfg.consumerSecret && cfg.shortcode && cfg.passkey ? cfg : null;
}

const base = (env: string) => (env === 'sandbox' ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke');

/** 07xx / 01xx / +254... -> 2547XXXXXXXX, or null when it is not a Kenyan mobile number. */
export function normalizeKenyanPhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('254')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^(7|1)\d{8}$/.test(digits) ? `254${digits}` : null;
}

/** Constant-time check of the secret that is part of every callback URL we give Safaricom. */
export function callbackSecretOk(provided: string | null): boolean {
  const secret = process.env.MPESA_CALLBACK_SECRET?.trim();
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function callbackUrl(origin: string, path: string) {
  return `${origin}${path}?s=${encodeURIComponent(process.env.MPESA_CALLBACK_SECRET?.trim() ?? '')}`;
}

async function accessToken(cfg: MpesaConfig) {
  const auth = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString('base64');
  const res = await fetch(`${base(cfg.env)}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('M-Pesa authentication failed');
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('M-Pesa did not return an access token');
  return data.access_token;
}

function timestamp() {
  const n = new Date();
  const p = (v: number) => String(v).padStart(2, '0');
  return `${n.getUTCFullYear()}${p(n.getUTCMonth() + 1)}${p(n.getUTCDate())}${p(n.getUTCHours())}${p(n.getUTCMinutes())}${p(n.getUTCSeconds())}`;
}

/** Sends the PIN prompt to the parent's phone. Returns Safaricom's request ids. */
export async function stkPush(
  cfg: MpesaConfig,
  input: { phone: string; amountKes: number; accountReference: string; description: string; callbackUrl: string },
) {
  const stamp = timestamp();
  const password = Buffer.from(`${cfg.shortcode}${cfg.passkey}${stamp}`).toString('base64');
  const token = await accessToken(cfg);
  const res = await fetch(`${base(cfg.env)}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: stamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: input.amountKes,
      PartyA: input.phone,
      PartyB: cfg.shortcode,
      PhoneNumber: input.phone,
      CallBackURL: input.callbackUrl,
      AccountReference: input.accountReference.slice(0, 12),
      TransactionDesc: input.description.slice(0, 13),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ResponseCode?: string; CheckoutRequestID?: string; MerchantRequestID?: string; errorMessage?: string; ResponseDescription?: string;
  };
  if (!res.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
    throw new Error(data.errorMessage || data.ResponseDescription || 'M-Pesa could not send the payment prompt');
  }
  return { checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID ?? null };
}

export interface StkCallbackBody {
  Body?: {
    stkCallback?: {
      CheckoutRequestID?: string;
      ResultCode?: number;
      ResultDesc?: string;
      CallbackMetadata?: { Item?: { Name: string; Value?: string | number }[] };
    };
  };
}

export function parseStkCallback(payload: StkCallbackBody) {
  const cb = payload.Body?.stkCallback;
  if (!cb?.CheckoutRequestID) return null;
  const items = cb.CallbackMetadata?.Item ?? [];
  const get = (name: string) => items.find((i) => i.Name === name)?.Value;
  const receipt = get('MpesaReceiptNumber');
  const amount = get('Amount');
  return {
    checkoutRequestId: cb.CheckoutRequestID,
    success: cb.ResultCode === 0,
    description: cb.ResultDesc ?? '',
    receipt: receipt ? String(receipt).toUpperCase() : null,
    amountCents: amount !== undefined ? Math.round(Number(amount) * 100) : null,
  };
}
