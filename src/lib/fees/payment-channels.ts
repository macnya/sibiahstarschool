/**
 * Works out, for one school and one child, exactly what a parent should type when paying.
 * A Paybill asks for an ACCOUNT NUMBER; a Till (Buy Goods) does not. KCB Lipa Karo uses the school's
 * KCB number and a KCB Paybill whose account is usually "<school number>#<admission number>".
 * Pure functions, so the parent page, the invoice and the tests all agree.
 */

export interface PaymentSettings {
  paybill_number?: string | null;
  paybill_account_format?: string | null;
  till_number?: string | null;
  kcb_till_number?: string | null;
  kcb_paybill_number?: string | null;
  kcb_account_format?: string | null;
  payment_instructions?: string | null;
}

export interface PaymentChannel {
  id: 'mpesa-paybill' | 'mpesa-till' | 'kcb' | 'other';
  title: string;
  /** Step-by-step lines to show. `value` parts are shown in bold. */
  steps: { label: string; value?: string }[];
  /** True when the parent must type an account number. */
  needsAccount: boolean;
  note?: string;
}

/** Replaces {admission} and {till} (any case). Unknown placeholders are removed. */
export function formatAccount(
  template: string | null | undefined,
  values: { admission: string; till?: string | null },
  fallback = '{admission}',
): string {
  const t = template && template.trim() ? template.trim() : fallback;
  return t
    .replace(/\{\s*admission\s*\}/gi, values.admission)
    .replace(/\{\s*till\s*\}/gi, values.till ?? '')
    .replace(/\{[^}]*\}/g, '')
    .trim();
}

const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : '');

export function channelsFor(settings: PaymentSettings, admission: string, schoolName: string): PaymentChannel[] {
  const out: PaymentChannel[] = [];
  const paybill = clean(settings.paybill_number);
  const till = clean(settings.till_number);
  const kcbTill = clean(settings.kcb_till_number);
  const kcbPaybill = clean(settings.kcb_paybill_number);

  if (paybill) {
    out.push({
      id: 'mpesa-paybill',
      title: 'M-Pesa Paybill',
      needsAccount: true,
      steps: [
        { label: 'Lipa na M-Pesa → Pay Bill' },
        { label: 'Business no.', value: paybill },
        { label: 'Account no.', value: formatAccount(settings.paybill_account_format, { admission }) },
      ],
    });
  }

  if (till) {
    out.push({
      id: 'mpesa-till',
      title: 'M-Pesa Till (Buy Goods)',
      needsAccount: false,
      steps: [
        { label: 'Lipa na M-Pesa → Buy Goods and Services' },
        { label: 'Till no.', value: till },
      ],
      note: `A Till has no account number. After paying, tell ${schoolName} the child’s admission number (${admission}) and the M-Pesa code so the office can match it.`,
    });
  }

  if (kcbPaybill || kcbTill) {
    const account = formatAccount(settings.kcb_account_format, { admission, till: kcbTill }, kcbTill ? '{till}#{admission}' : '{admission}');
    out.push({
      id: 'kcb',
      title: 'KCB Lipa Karo',
      needsAccount: true,
      steps: kcbPaybill
        ? [
            { label: 'M-Pesa → Pay Bill (or KCB app / KCB M-Pesa)' },
            { label: 'Business no.', value: kcbPaybill },
            { label: 'Account no.', value: account },
          ]
        : [
            { label: 'Pay with KCB Lipa Karo' },
            { label: 'School number', value: kcbTill },
            { label: 'Account no.', value: account },
          ],
    });
  }

  const other = clean(settings.payment_instructions);
  if (other) {
    out.push({ id: 'other', title: 'Other ways to pay', needsAccount: false, steps: [], note: other });
  }
  return out;
}
