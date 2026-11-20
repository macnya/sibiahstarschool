'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADJUSTMENT_LABEL, parseKES } from '@/lib/fees/money';

/**
 * Fee management. Every call runs as the signed-in user: the database (Row Level Security
 * and the SECURITY DEFINER functions) decides who may do what. A campus admin cannot touch
 * another school's money even by crafting a request. Errors redirect back with ?error=.
 */

function back(path: string, error?: string, ok?: string): never {
  const params = new URLSearchParams();
  if (error) params.set('error', error);
  if (ok) params.set('ok', ok);
  const qs = params.toString();
  redirect(qs ? `${path}${path.includes('?') ? '&' : '?'}${qs}` : path);
}

function text(formData: FormData, key: string, max = 300) {
  const v = formData.get(key);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function int(formData: FormData, key: string) {
  const n = Number(text(formData, key, 12));
  return Number.isInteger(n) ? n : NaN;
}

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  return supabase;
}

/** The database raises plain-English messages (SQLSTATE P0001); anything else is generic. */
function friendly(error: { code?: string; message: string }, fallback: string) {
  return error.code === 'P0001' ? error.message : fallback;
}

// -------------------------------------------------------------------- setup

export async function saveTerm(formData: FormData) {
  const path = '/admin/fees/setup';
  const supabase = await authed();
  const year = int(formData, 'year');
  const number = int(formData, 'number');
  if (!(year >= 2000 && year <= 2100) || ![1, 2, 3].includes(number)) back(path, 'Choose a valid year and term.');
  const date = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(text(formData, k, 10)) ? text(formData, k, 10) : null);

  const dates = { start_date: date('start_date'), end_date: date('end_date'), due_date: date('due_date') };
  // Update an existing term in place (keeping its "current" flag), otherwise create it.
  const { data: existing } = await supabase.from('terms').select('id').eq('year', year).eq('number', number).maybeSingle();
  const { error } = existing
    ? await supabase.from('terms').update(dates).eq('id', (existing as { id: string }).id)
    : await supabase.from('terms').insert({ year, number, name: `Term ${number}`, ...dates, is_current: false });
  if (error) back(path, error.code === '42501' ? 'Only group administrators can change terms.' : 'Could not save the term.');
  back(path, undefined, `Term ${number} ${year} saved.`);
}

export async function setCurrentTerm(formData: FormData) {
  const path = '/admin/fees/setup';
  const supabase = await authed();
  const id = text(formData, 'id', 60);
  const cleared = await supabase.from('terms').update({ is_current: false }).eq('is_current', true).select('id');
  if (cleared.error) back(path, 'Only group administrators can change the current term.');
  const { data, error } = await supabase.from('terms').update({ is_current: true }).eq('id', id).select('id');
  if (error || !data || data.length === 0) back(path, 'Could not set the current term.');
  revalidatePath('/admin/fees');
  back(path, undefined, 'Current term updated. Newly enrolled children are invoiced for it automatically.');
}

export async function createFeeItem(formData: FormData) {
  const path = '/admin/fees/setup';
  const supabase = await authed();
  const name = text(formData, 'name', 80);
  if (name.length < 2) back(path, 'Enter a name for the fee.');
  const kind = text(formData, 'kind', 20) || 'other';
  const { error } = await supabase.from('fee_items').insert({
    name, kind: kind as never, is_optional: formData.get('is_optional') === 'on', is_active: true, sort_order: 50,
  });
  if (error) back(path, error.code === '23505' ? 'A fee with that name already exists.' : 'Only group administrators can add fee types.');
  back(path, undefined, `${name} added.`);
}

export async function toggleFeeItem(formData: FormData) {
  const path = '/admin/fees/setup';
  const supabase = await authed();
  const id = text(formData, 'id', 60);
  const { error } = await supabase.from('fee_items').update({ is_active: formData.get('active') === '1' }).eq('id', id);
  if (error) back(path, 'Only group administrators can change fee types.');
  back(path);
}

export async function saveFeeStructure(formData: FormData) {
  const campus = text(formData, 'campus_id', 60);
  const year = int(formData, 'year');
  const term = int(formData, 'term');
  const path = `/admin/fees/setup?campus=${campus}&year=${year}&term=${term}`;
  const supabase = await authed();
  if (!campus || !(year >= 2000 && year <= 2100) || ![1, 2, 3].includes(term)) back(path, 'Choose a school, year and term.');
  const terms = formData.get('apply_all_terms') === 'on' ? [1, 2, 3] : [term];

  const upserts: { campus_id: string; year: number; grade_id: string; term_number: number; fee_item_id: string; amount_cents: number }[] = [];
  const removals: { grade_id: string; fee_item_id: string }[] = [];
  for (const [key, value] of formData.entries()) {
    const m = /^amt_([0-9a-f-]{36})_([0-9a-f-]{36})$/.exec(key);
    if (!m || typeof value !== 'string') continue;
    const cents = value.trim() === '' ? 0 : parseKES(value);
    if (cents === null) back(path, `“${value}” is not a valid amount.`);
    if (cents === 0) removals.push({ grade_id: m[1], fee_item_id: m[2] });
    else for (const t of terms) upserts.push({ campus_id: campus, year, grade_id: m[1], term_number: t, fee_item_id: m[2], amount_cents: cents });
  }

  if (upserts.length) {
    const { error } = await supabase.from('fee_structures').upsert(upserts, { onConflict: 'campus_id,year,grade_id,term_number,fee_item_id' });
    if (error) back(path, 'Could not save the fees. You may not have permission for this school.');
  }
  for (const r of removals) {
    await supabase.from('fee_structures').delete().eq('campus_id', campus).eq('year', year).eq('grade_id', r.grade_id).eq('fee_item_id', r.fee_item_id).in('term_number', terms);
  }
  back(path, undefined, `Fees saved${terms.length === 3 ? ' for all three terms' : ` for Term ${term}`}.`);
}

// ------------------------------------------------------------------ invoicing

export async function generateInvoicesAction(formData: FormData) {
  const path = '/admin/fees/invoices';
  const supabase = await authed();
  const campus = text(formData, 'campus_id', 60);
  const year = int(formData, 'year');
  const term = int(formData, 'term');
  const grade = text(formData, 'grade_id', 60) || null;
  if (!campus || !(year >= 2000) || ![1, 2, 3].includes(term)) back(path, 'Choose a school, year and term.');

  const { data, error } = await supabase.rpc('generate_invoices', { p_campus: campus, p_year: year, p_term: term, p_grade: grade });
  if (error) back(path, friendly(error, 'Could not create the invoices.'));
  const r = data as { created: number; skipped: number };
  revalidatePath('/admin/fees');
  back(path, undefined, `${r.created} invoice${r.created === 1 ? '' : 's'} created. ${r.skipped} child${r.skipped === 1 ? ' was' : 'ren were'} skipped (already invoiced, or no fees set for their class — check Setup).`);
}

export async function cancelInvoiceAction(formData: FormData) {
  const id = text(formData, 'id', 60);
  const path = `/admin/fees/invoices/${id}`;
  const supabase = await authed();
  const { error } = await supabase.rpc('cancel_invoice', { p_invoice: id, p_reason: text(formData, 'reason', 300) });
  if (error) back(path, friendly(error, 'Could not cancel the invoice.'));
  revalidatePath('/admin/fees');
  back(path, undefined, 'Invoice cancelled. The child’s balance has been updated.');
}

// ------------------------------------------------------------------- payments

export async function recordPaymentAction(formData: FormData) {
  const student = text(formData, 'student_id', 60);
  const path = `/admin/fees/students/${student}`;
  const supabase = await authed();
  const cents = parseKES(text(formData, 'amount', 20));
  if (cents === null || cents <= 0) back(path, 'Enter the amount received, e.g. 15000.');
  const received = text(formData, 'received_on', 10);

  const { data, error } = await supabase.rpc('record_payment', {
    p_student: student,
    p_amount_cents: cents,
    p_method: text(formData, 'method', 10),
    p_reference: text(formData, 'reference', 60) || null,
    p_payer_name: text(formData, 'payer_name', 120) || null,
    p_payer_phone: text(formData, 'payer_phone', 40) || null,
    p_received_on: /^\d{4}-\d{2}-\d{2}$/.test(received) ? received : null,
    p_notes: text(formData, 'notes', 500) || null,
  });
  if (error) back(path, friendly(error, 'Could not record the payment.'));
  revalidatePath('/admin/fees');
  redirect(`/admin/fees/receipts/${data}`);
}

export async function reversePaymentAction(formData: FormData) {
  const id = text(formData, 'id', 60);
  const path = `/admin/fees/receipts/${id}`;
  const supabase = await authed();
  const { error } = await supabase.rpc('reverse_payment', { p_payment: id, p_reason: text(formData, 'reason', 300) });
  if (error) back(path, friendly(error, 'Could not reverse the payment.'));
  revalidatePath('/admin/fees');
  back(path, undefined, 'Payment reversed. The balance has been restored.');
}

export async function postAdjustmentAction(formData: FormData) {
  const student = text(formData, 'student_id', 60);
  const path = `/admin/fees/students/${student}`;
  const supabase = await authed();
  const kind = text(formData, 'kind', 20);
  if (!(kind in ADJUSTMENT_LABEL)) back(path, 'Choose the type of adjustment.');
  let cents = parseKES(text(formData, 'amount', 20));
  if (cents === null || cents === 0) back(path, 'Enter the amount, e.g. 5000.');
  // Opening balances and corrections can go either way: "-" before the amount reduces what is owed.
  if (['opening_balance', 'correction'].includes(kind) && text(formData, 'amount', 20).trim().startsWith('-')) cents = -cents!;

  const { error } = await supabase.rpc('post_fee_adjustment', {
    p_student: student, p_kind: kind, p_amount_cents: cents!, p_description: text(formData, 'description', 300),
  });
  if (error) back(path, friendly(error, 'Could not save the adjustment.'));
  revalidatePath('/admin/fees');
  back(path, undefined, `${ADJUSTMENT_LABEL[kind]} recorded.`);
}

export async function toggleSubscriptionAction(formData: FormData) {
  const student = text(formData, 'student_id', 60);
  const path = `/admin/fees/students/${student}`;
  const supabase = await authed();
  const item = text(formData, 'fee_item_id', 60);
  const on = formData.get('on') === '1';
  const { error } = on
    ? await supabase.from('student_fee_subscriptions').upsert({ student_id: student, fee_item_id: item })
    : await supabase.from('student_fee_subscriptions').delete().eq('student_id', student).eq('fee_item_id', item);
  if (error) back(path, 'Could not update the child’s optional fees.');
  back(path, undefined, on ? 'Added. It will be included on the next invoice.' : 'Removed from future invoices.');
}

// --------------------------------------------------------------------- M-Pesa

export async function assignMpesaAction(formData: FormData) {
  const path = '/admin/fees/mpesa';
  const supabase = await authed();
  const adm = text(formData, 'admission_number', 40).toUpperCase();
  const { data: student } = await supabase.from('students').select('id').eq('admission_number', adm).maybeSingle();
  if (!student) back(path, `No student with admission number “${adm}” at your school(s).`);
  const { error } = await supabase.rpc('mpesa_assign_transaction', { p_transaction: text(formData, 'transaction_id', 60), p_student: (student as { id: string }).id });
  if (error) back(path, friendly(error, 'Could not assign the payment.'));
  revalidatePath('/admin/fees');
  back(path, undefined, `Payment placed on ${adm}’s account.`);
}

export async function ignoreMpesaAction(formData: FormData) {
  const path = '/admin/fees/mpesa';
  const supabase = await authed();
  const { error } = await supabase.rpc('mpesa_ignore_transaction', { p_transaction: text(formData, 'transaction_id', 60) });
  if (error) back(path, friendly(error, 'Could not update the transaction.'));
  back(path, undefined, 'Marked as ignored.');
}
