'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { dispatchPending, smsConfigured } from '@/lib/sms/send';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PATH = '/admin/fees/sms';

function back(error?: string, ok?: string): never {
  const p = new URLSearchParams();
  if (error) p.set('error', error);
  if (ok) p.set('ok', ok);
  redirect(`${PATH}?${p.toString()}`);
}
const str = (f: FormData, k: string, max: number) => { const v = f.get(k); return typeof v === 'string' ? v.trim().slice(0, max) : ''; };
const msg = (m: string | undefined) => m ?? 'Something went wrong.';

async function ctx() {
  const c = await getAdminContext();
  if (!c.isAdmin) redirect('/admin');
  return c;
}
function campusOf(c: Awaited<ReturnType<typeof ctx>>, f: FormData) {
  const id = c.campusId ?? str(f, 'campus', 40);
  if (!UUID.test(id)) back('Choose a school first.');
  return id;
}

export async function toggleReceiptsAction(formData: FormData) {
  const c = await ctx();
  const campus = campusOf(c, formData);
  const enabled = str(formData, 'enabled', 5) === 'true';
  const { error } = await c.supabase.rpc('set_sms_receipts', { p_campus: campus, p_enabled: enabled });
  if (error) back(msg(error.message));
  revalidatePath(PATH);
  back(undefined, enabled ? 'Automatic receipt SMS is on.' : 'Automatic receipt SMS is off.');
}

/** step=preview shows who would get it; step=send queues it and starts sending. */
export async function reminderAction(formData: FormData) {
  const c = await ctx();
  const campus = campusOf(c, formData);
  const template = str(formData, 'template', 300);
  const min = Math.max(0, Math.round(Number(str(formData, 'min', 12) || 0) * 100));
  const commit = str(formData, 'step', 10) === 'send';
  const { data, error } = await c.supabase.rpc('queue_fee_reminders', { p_campus: campus, p_min_cents: Number.isFinite(min) ? min : 0, p_template: template, p_commit: commit });
  if (error) back(msg(error.message));
  const r = data as { count: number; sample: string | null };
  if (!commit) {
    const p = new URLSearchParams({ ok: `${r.count} families would get this reminder.${r.sample ? ` Example: “${r.sample}”` : ''} Press “Send” to send it.` });
    redirect(`${PATH}?${p.toString()}`);
  }
  const d = await dispatchPending(100);
  revalidatePath(PATH);
  back(undefined, `${r.count} reminders queued${d.configured ? `, ${d.sent} sent now` : '. SMS is not connected yet, so they are waiting'}.`);
}

export async function noticeAction(formData: FormData) {
  const c = await ctx();
  const campus = campusOf(c, formData);
  const klass = str(formData, 'class', 40);
  const body = str(formData, 'body', 480);
  const commit = str(formData, 'step', 10) === 'send';
  const { data, error } = await c.supabase.rpc('queue_notice', { p_campus: campus, p_class: UUID.test(klass) ? klass : null, p_body: body, p_commit: commit });
  if (error) back(msg(error.message));
  const r = data as { count: number };
  if (!commit) back(undefined, `This would go to ${r.count} phone numbers. Press “Send” to send it.`);
  const d = await dispatchPending(100);
  revalidatePath(PATH);
  back(undefined, `${r.count} messages queued${d.configured ? `, ${d.sent} sent now` : '. SMS is not connected yet, so they are waiting'}.`);
}

export async function sendQueuedAction(formData: FormData) {
  const c = await ctx();
  if (str(formData, 'retry', 5) === 'yes') {
    const { error } = await c.supabase.rpc('sms_requeue_failed', { p_campus: campusOf(c, formData) });
    if (error) back(msg(error.message));
  }
  if (!smsConfigured()) back('SMS is not connected yet. Add the Africa’s Talking keys on the server (see the SMS guide).');
  const d = await dispatchPending(100);
  revalidatePath(PATH);
  back(d.error, `Sent ${d.sent}${d.failed ? `, ${d.failed} failed (see the list below)` : ''}.`);
}
