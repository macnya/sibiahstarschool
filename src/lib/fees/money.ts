/** All money is stored as integer cents (KES x 100). */

const kes = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatKES(cents: number | null | undefined): string {
  return kes.format((cents ?? 0) / 100);
}

/** "12,500" / "12500.50" / "KES 12,500" -> cents, or null when it is not a valid amount. */
export function parseKES(input: string | null | undefined): number | null {
  if (!input) return null;
  const cleaned = input.replace(/kes|ksh|\s|,/gi, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(parseFloat(cleaned) * 100);
  return Number.isFinite(cents) ? cents : null;
}

export const METHOD_LABEL: Record<string, string> = {
  mpesa: 'M-Pesa',
  cash: 'Cash',
  cheque: 'Cheque',
  bank: 'Bank',
  other: 'Other',
};

export const ADJUSTMENT_LABEL: Record<string, string> = {
  bursary: 'Bursary',
  discount: 'Discount',
  waiver: 'Fee waiver',
  scholarship: 'Scholarship',
  penalty: 'Penalty / late fee',
  opening_balance: 'Opening balance (brought forward)',
  refund: 'Refund paid out',
  correction: 'Correction',
};

/** Types where a positive amount REDUCES what the family owes. */
export const REDUCING_ADJUSTMENTS = ['bursary', 'discount', 'waiver', 'scholarship'];
