import 'server-only';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import type {
  CampusRow, FeeAdjustmentRow, FeeItemRow, FeeStructureRow, GradeLevelRow, InvoiceLineRow, InvoiceRow,
  MpesaTransactionRow, PaymentRow, StudentBalanceRow, StudentRow, TermRow,
} from '@/lib/supabase/types';

/** Strip characters that have meaning inside a PostgREST filter string. */
function safeSearch(q: string) {
  return q.replace(/[,()%*\\:"']/g, ' ').trim().slice(0, 60);
}

export async function getTerms() {
  const { supabase } = await getAdminContext();
  const { data } = await supabase.from('terms').select('*').order('year', { ascending: false }).order('number');
  return (data ?? []) as TermRow[];
}

export async function getFeeItems() {
  const { supabase } = await getAdminContext();
  const { data } = await supabase.from('fee_items').select('*').order('sort_order').order('name');
  return (data ?? []) as FeeItemRow[];
}

export async function getFeeStructure(campusId: string, year: number) {
  const { supabase } = await getAdminContext();
  const { data } = await supabase.from('fee_structures').select('*').eq('campus_id', campusId).eq('year', year);
  return (data ?? []) as FeeStructureRow[];
}

export interface BalanceFilters { campusId?: string; gradeId?: string; q?: string; onlyOwing?: boolean }

export async function getBalances(filters: BalanceFilters = {}) {
  const { supabase, campusId: scoped } = await getAdminContext();
  let query = supabase.from('student_balances').select('*').eq('status', 'active').order('balance', { ascending: false }).limit(1500);
  const campusId = scoped ?? filters.campusId;
  if (campusId) query = query.eq('campus_id', campusId);
  if (filters.gradeId) query = query.eq('grade_id', filters.gradeId);
  if (filters.onlyOwing) query = query.gt('balance', 0);
  const q = filters.q ? safeSearch(filters.q) : '';
  if (q) {
    query = query.or(['first_name', 'last_name', 'admission_number', 'guardian_name', 'guardian_phone'].map((c) => `${c}.ilike.%${q}%`).join(','));
  }
  const { data } = await query;
  return (data ?? []) as StudentBalanceRow[];
}

export async function getRecentPayments(limit = 40) {
  const { supabase, campusId: scoped } = await getAdminContext();
  let query = supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(limit);
  if (scoped) query = query.eq('campus_id', scoped);
  const { data } = await query;
  const payments = (data ?? []) as PaymentRow[];
  const ids = [...new Set(payments.map((p) => p.student_id))];
  const { data: students } = ids.length
    ? await supabase.from('students').select('id, first_name, last_name, admission_number').in('id', ids)
    : { data: [] };
  const byId = new Map(((students ?? []) as Pick<StudentRow, 'id' | 'first_name' | 'last_name' | 'admission_number'>[]).map((s) => [s.id, s]));
  return payments.map((p) => ({ ...p, student: byId.get(p.student_id) ?? null }));
}

export interface LedgerLine {
  date: string;
  sortKey: string;
  kind: 'invoice' | 'payment' | 'adjustment' | 'reversed';
  description: string;
  amountCents: number;      // effect on what is owed (+ owes more, - owes less)
  balanceCents: number;
  link?: string;
}

export async function getStudentFinance(studentId: string) {
  const { supabase } = await getAdminContext();
  const { data: student } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
  if (!student) return null;
  const s = student as StudentRow;

  const [campus, grade, balance, invoices, payments, adjustments, subs, items] = await Promise.all([
    supabase.from('campuses').select('*').eq('id', s.campus_id).maybeSingle(),
    supabase.from('grade_levels').select('*').eq('id', s.grade_id).maybeSingle(),
    supabase.from('student_balances').select('*').eq('student_id', s.id).maybeSingle(),
    supabase.from('invoices').select('*').eq('student_id', s.id).order('created_at'),
    supabase.from('payments').select('*').eq('student_id', s.id).order('created_at'),
    supabase.from('fee_adjustments').select('*').eq('student_id', s.id).order('created_at'),
    supabase.from('student_fee_subscriptions').select('fee_item_id').eq('student_id', s.id),
    supabase.from('fee_items').select('*').order('sort_order'),
  ]);

  const inv = (invoices.data ?? []) as InvoiceRow[];
  const pay = (payments.data ?? []) as PaymentRow[];
  const adj = (adjustments.data ?? []) as FeeAdjustmentRow[];

  const raw: Omit<LedgerLine, 'balanceCents'>[] = [
    ...inv.filter((i) => i.status === 'open').map((i) => ({
      date: i.created_at, sortKey: `${i.created_at}-1`, kind: 'invoice' as const,
      description: `Invoice ${i.number} — Term ${i.term_number} ${i.year}`, amountCents: i.total_cents, link: `/admin/fees/invoices/${i.id}`,
    })),
    ...adj.map((a) => ({ date: a.created_at, sortKey: `${a.created_at}-2`, kind: 'adjustment' as const, description: a.description, amountCents: a.amount_cents })),
    ...pay.filter((p) => p.status === 'confirmed').map((p) => ({
      date: p.created_at, sortKey: `${p.created_at}-3`, kind: 'payment' as const,
      description: `Payment ${p.receipt_number} (${p.method}${p.reference ? ` ${p.reference}` : ''})`, amountCents: -p.amount_cents, link: `/admin/fees/receipts/${p.id}`,
    })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  let running = 0;
  const ledger: LedgerLine[] = raw.map((l) => ({ ...l, balanceCents: (running += l.amountCents) }));

  return {
    student: s,
    campus: campus.data as CampusRow | null,
    grade: grade.data as GradeLevelRow | null,
    balance: balance.data as StudentBalanceRow | null,
    invoices: inv,
    payments: pay,
    adjustments: adj,
    ledger,
    subscribed: new Set(((subs.data ?? []) as { fee_item_id: string }[]).map((r) => r.fee_item_id)),
    optionalItems: ((items.data ?? []) as FeeItemRow[]).filter((i) => i.is_optional && i.is_active),
  };
}

export async function getInvoices(filters: { campusId?: string; year?: number; term?: number; q?: string } = {}) {
  const { supabase, campusId: scoped } = await getAdminContext();
  let query = supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(300);
  const campusId = scoped ?? filters.campusId;
  if (campusId) query = query.eq('campus_id', campusId);
  if (filters.year) query = query.eq('year', filters.year);
  if (filters.term) query = query.eq('term_number', filters.term);
  if (filters.q) query = query.ilike('number', `%${safeSearch(filters.q)}%`);
  const { data } = await query;
  const invoices = (data ?? []) as InvoiceRow[];
  const ids = [...new Set(invoices.map((i) => i.student_id))];
  const { data: students } = ids.length ? await supabase.from('students').select('id, first_name, last_name, admission_number').in('id', ids) : { data: [] };
  const byId = new Map(((students ?? []) as Pick<StudentRow, 'id' | 'first_name' | 'last_name' | 'admission_number'>[]).map((s) => [s.id, s]));
  return invoices.map((i) => ({ ...i, student: byId.get(i.student_id) ?? null }));
}

export async function getInvoice(id: string) {
  const { supabase } = await getAdminContext();
  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
  if (!invoice) return null;
  const inv = invoice as InvoiceRow;
  const [lines, student, campus] = await Promise.all([
    supabase.from('invoice_lines').select('*').eq('invoice_id', id).order('amount_cents', { ascending: false }),
    supabase.from('students').select('*').eq('id', inv.student_id).maybeSingle(),
    supabase.from('campuses').select('*').eq('id', inv.campus_id).maybeSingle(),
  ]);
  return { invoice: inv, lines: (lines.data ?? []) as InvoiceLineRow[], student: student.data as StudentRow | null, campus: campus.data as CampusRow | null };
}

export async function getReceipt(id: string) {
  const { supabase } = await getAdminContext();
  const { data: payment } = await supabase.from('payments').select('*').eq('id', id).maybeSingle();
  if (!payment) return null;
  const p = payment as PaymentRow;
  const [student, campus, balance] = await Promise.all([
    supabase.from('students').select('*').eq('id', p.student_id).maybeSingle(),
    supabase.from('campuses').select('*').eq('id', p.campus_id).maybeSingle(),
    supabase.from('student_balances').select('*').eq('student_id', p.student_id).maybeSingle(),
  ]);
  let grade: GradeLevelRow | null = null;
  const st = student.data as StudentRow | null;
  if (st) {
    const { data } = await supabase.from('grade_levels').select('*').eq('id', st.grade_id).maybeSingle();
    grade = data as GradeLevelRow | null;
  }
  return { payment: p, student: st, campus: campus.data as CampusRow | null, grade, balance: balance.data as StudentBalanceRow | null };
}

export async function getMpesaTransactions() {
  const { supabase } = await getAdminContext();
  const { data } = await supabase.from('mpesa_transactions').select('*').order('created_at', { ascending: false }).limit(150);
  return (data ?? []) as MpesaTransactionRow[];
}

/** Money-in summary for a term (or the year so far when the term has no dates). */
export async function getCollectionSummary(year: number, termNumber: number | null) {
  const { supabase, campusId: scoped } = await getAdminContext();
  const [campuses, grades, balances] = await Promise.all([
    supabase.from('campuses').select('id, name').order('sort_order'),
    supabase.from('grade_levels').select('id, name, sort_order').order('sort_order'),
    getBalances({}),
  ]);

  let invQuery = supabase.from('invoices').select('campus_id, total_cents').eq('status', 'open').eq('year', year);
  if (termNumber) invQuery = invQuery.eq('term_number', termNumber);
  if (scoped) invQuery = invQuery.eq('campus_id', scoped);
  const { data: invoices } = await invQuery;

  const today = new Date().toISOString().slice(0, 10);
  let payQuery = supabase.from('payments').select('campus_id, amount_cents, received_on').eq('status', 'confirmed').gte('received_on', `${year}-01-01`).lte('received_on', `${year}-12-31`);
  if (scoped) payQuery = payQuery.eq('campus_id', scoped);
  const { data: payments } = await payQuery;

  const sum = (rows: { total_cents?: number; amount_cents?: number }[] | null) => (rows ?? []).reduce((a, r) => a + (r.total_cents ?? r.amount_cents ?? 0), 0);
  const invRows = (invoices ?? []) as { campus_id: string; total_cents: number }[];
  const payRows = (payments ?? []) as { campus_id: string; amount_cents: number; received_on: string }[];

  const owing = balances.filter((b) => b.balance > 0);
  const campusName = new Map(((campuses.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]));
  const gradeInfo = new Map(((grades.data ?? []) as { id: string; name: string; sort_order: number }[]).map((g) => [g.id, g]));

  const byCampus = [...campusName.entries()]
    .filter(([id]) => !scoped || id === scoped)
    .map(([id, name]) => ({
      name,
      invoiced: sum(invRows.filter((r) => r.campus_id === id)),
      collected: sum(payRows.filter((r) => r.campus_id === id)),
      outstanding: balances.filter((b) => b.campus_id === id && b.balance > 0).reduce((a, b) => a + b.balance, 0),
      owingCount: balances.filter((b) => b.campus_id === id && b.balance > 0).length,
    }));

  const gradeMap = new Map<string, { name: string; order: number; outstanding: number; count: number }>();
  for (const b of owing) {
    const g = gradeInfo.get(b.grade_id);
    const row = gradeMap.get(b.grade_id) ?? { name: g?.name ?? '—', order: g?.sort_order ?? 99, outstanding: 0, count: 0 };
    row.outstanding += b.balance;
    row.count += 1;
    gradeMap.set(b.grade_id, row);
  }

  return {
    invoiced: sum(invRows),
    collectedYear: sum(payRows),
    collectedToday: sum(payRows.filter((p) => p.received_on === today)),
    outstanding: owing.reduce((a, b) => a + b.balance, 0),
    owingCount: owing.length,
    studentCount: balances.length,
    credit: balances.filter((b) => b.balance < 0).reduce((a, b) => a - b.balance, 0),
    byCampus,
    byGrade: [...gradeMap.values()].sort((a, b) => a.order - b.order),
    topArrears: owing.slice(0, 8),
  };
}
