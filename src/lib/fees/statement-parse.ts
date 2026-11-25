import { cleanPhone, parseCsv, parseDate, parseMoney } from '@/lib/students/import-parse';

/**
 * Reads a payments report downloaded from KCB (Lipa Karo / school portal), a bank, or the M-Pesa
 * Paybill report, and turns each money-in line into something the database can match to a child.
 * Pure functions: runs in the browser for an instant preview.
 */

export interface StatementRow {
  trans_id: string;
  amount_cents: number;
  date: string;
  reference: string;
  payer_name?: string;
  phone?: string;
}

export interface StatementLine {
  line: number;
  data?: StatementRow;
  errors: string[];
  warnings: string[];
  label: string;
}

export interface StatementFile {
  lines: StatementLine[];
  missingColumns: string[];
  usedHeaders: string[];
  skippedMoneyOut: number;
  generatedIds: boolean;
  total: number;
  ready: number;
  problems: number;
}

type Col = 'id' | 'date' | 'credit' | 'debit' | 'reference' | 'details' | 'name' | 'phone';

const NAMES: Record<Col, string[]> = {
  id: ['transaction id', 'transaction ref', 'transaction reference', 'trans id', 'transid', 'receipt', 'receipt no', 'receipt number', 'txn id', 'txn ref', 'transaction no', 'transaction number', 'mpesa receipt', 'confirmation code', 'code', 'ref no', 'reference no', 'reference number', 'payment id', 'payment reference'],
  date: ['date', 'transaction date', 'trans date', 'value date', 'completion time', 'completed time', 'posting date', 'date time', 'datetime', 'time', 'payment date'],
  credit: ['credit', 'paid in', 'credit amount', 'amount paid', 'deposit', 'deposits', 'received', 'money in', 'amount', 'amount kes', 'paid in kes'],
  debit: ['debit', 'withdrawn', 'withdrawal', 'paid out', 'money out', 'debit amount'],
  reference: ['a/c no', 'ac no', 'a/c', 'account', 'account no', 'account number', 'account ref', 'account reference', 'bill ref', 'bill reference', 'bill ref number', 'reference', 'customer reference', 'payer reference', 'student reference', 'admission number', 'admission no'],
  details: ['details', 'narration', 'narrative', 'description', 'particulars', 'transaction details', 'remarks'],
  name: ['name', 'payer', 'payer name', 'customer name', 'paid by', 'sender', 'sender name', 'depositor', 'student name', 'party'],
  phone: ['phone', 'msisdn', 'mobile', 'phone number', 'sender phone'],
};

const norm = (s: string) => s.toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();

function detect(headers: string[]) {
  const found: Partial<Record<Col, number>> = {};
  headers.forEach((h, i) => {
    const n = norm(h);
    for (const col of Object.keys(NAMES) as Col[]) {
      if (found[col] === undefined && NAMES[col].some((x) => norm(x) === n)) { found[col] = i; break; }
    }
  });
  return found;
}

/** Statements often start with account details: find the real heading row. */
function findHeader(table: string[][]): number {
  for (let i = 0; i < Math.min(table.length, 20); i += 1) {
    const f = detect(table[i]);
    if (f.date !== undefined && f.credit !== undefined) return i;
  }
  return -1;
}

function hash(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase();
}

/** "Pay Bill from 254722xxx - JOHN Acc. 24810" -> "24810". Used when there is no separate account column. */
export function referenceFromDetails(details: string): string {
  const m = /acc(?:ount)?\.?\s*(?:no\.?|number)?\s*[:\-]?\s*([A-Za-z0-9#/_\-]+)/i.exec(details);
  return m ? m[1] : details;
}

function dateOnly(text: string): string {
  const t = text.trim();
  return (parseDate(t.split(/[ T]/)[0]) as string | null) ?? '';
}

export function mapStatement(table: string[][]): StatementFile {
  const empty: StatementFile = { lines: [], missingColumns: [], usedHeaders: [], skippedMoneyOut: 0, generatedIds: false, total: 0, ready: 0, problems: 0 };
  if (table.length < 2) return empty;
  const h = findHeader(table);
  if (h < 0) {
    const f = detect(table[0]);
    const missing: string[] = [];
    if (f.date === undefined) missing.push('Date');
    if (f.credit === undefined) missing.push('Amount (or Credit / Paid In)');
    return { ...empty, missingColumns: missing.length ? missing : ['A heading row with Date and Amount columns'] };
  }

  const headers = table[h];
  const col = detect(headers);
  const missingColumns: string[] = [];
  if (col.reference === undefined && col.details === undefined) missingColumns.push('Account / Reference (or Details / Narration)');
  const generatedIds = col.id === undefined;
  const get = (row: string[], c: Col) => (col[c] === undefined ? '' : (row[col[c]!] ?? '').trim());

  let skippedMoneyOut = 0;
  const lines: StatementLine[] = [];
  table.slice(h + 1).forEach((row, idx) => {
    if (row.every((c) => !c.trim())) return;
    const lineNo = h + idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    const creditText = get(row, 'credit');
    const debitText = get(row, 'debit');
    const credit = creditText ? parseMoney(creditText) : undefined;
    const debit = debitText ? parseMoney(debitText) : undefined;
    // Money going OUT of the account is not a fee payment.
    if ((credit === undefined || Number.isNaN(credit)) && debit !== undefined && !Number.isNaN(debit) && debit !== 0) { skippedMoneyOut += 1; return; }
    if (/^(summary|total|balance|opening|closing)/i.test(get(row, 'date')) || /^(total|summary)/i.test(row[0] ?? '')) return;
    if (credit === undefined) errors.push('Amount is missing');
    else if (Number.isNaN(credit)) errors.push(`Amount “${creditText}” is not a number`);
    else if (credit < 0) { skippedMoneyOut += 1; return; }

    const dateText = get(row, 'date');
    const date = dateText ? dateOnly(dateText) : '';
    if (!dateText) errors.push('Date is missing');
    else if (!date) errors.push(`Date “${dateText}” was not understood`);

    const details = get(row, 'details');
    let reference = get(row, 'reference');
    if (!reference && details) reference = referenceFromDetails(details);
    if (!reference) warnings.push('No account/reference — will wait for the office to assign');

    let transId = get(row, 'id');
    if (!transId && date && credit && !Number.isNaN(credit)) transId = `STMT-${date}-${credit}-${hash(`${reference}|${details}|${get(row, 'name')}`)}`;
    if (!transId) errors.push('Transaction reference is missing');

    const name = get(row, 'name');
    const label = [name || reference || transId, credit && !Number.isNaN(credit) ? (credit / 100).toLocaleString('en-KE') : ''].filter(Boolean).join(' · ');
    const data: StatementRow | undefined = errors.length ? undefined : {
      trans_id: transId, amount_cents: credit as number, date, reference,
      payer_name: name || undefined, phone: get(row, 'phone') ? cleanPhone(get(row, 'phone')) : undefined,
    };
    lines.push({ line: lineNo, data, errors, warnings, label });
  });

  const ready = lines.filter((l) => l.data).length;
  return {
    lines, missingColumns, usedHeaders: headers.filter((_, i) => Object.values(col).includes(i)), skippedMoneyOut, generatedIds,
    total: lines.length, ready, problems: lines.length - ready,
  };
}

export function parseStatement(text: string) {
  return mapStatement(parseCsv(text));
}
