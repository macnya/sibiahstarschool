import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import { toggleAbsenceSmsAction } from '@/app/attendance-actions';
import { noticeAction, reminderAction, sendQueuedAction, toggleReceiptsAction } from '@/app/admin/sms-actions';
import { getAdminContext, getCampusesAndGrades } from '@/lib/admissions/admin-queries';
import { smsConfigured } from '@/lib/sms/send';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm';
const area = 'w-full rounded-md border bg-background px-3 py-2 text-sm';

interface Row { id: string; to_phone: string; body: string; kind: string; status: string; error: string | null; created_at: string; campus_id: string }

export default async function SmsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAdminContext();
  const { campuses } = await getCampusesAndGrades();
  const mine = (ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active));
  const { data: classes } = await ctx.supabase.from('classes').select('id, campus_id, stream, year, grade_id').order('year', { ascending: false });
  const { data: grades } = await ctx.supabase.from('grade_levels').select('id, name');
  const gname = new Map(((grades ?? []) as { id: string; name: string }[]).map((g) => [g.id, g.name]));
  const { data: out } = await ctx.supabase.from('sms_outbox').select('id,to_phone,body,kind,status,error,created_at,campus_id').order('created_at', { ascending: false }).limit(40);
  const rows = (out ?? []) as Row[];
  const count = async (status: string) => (await ctx.supabase.from('sms_outbox').select('id', { count: 'exact', head: true }).eq('status', status)).count ?? 0;
  const [queued, failed] = await Promise.all([count('queued'), count('failed')]);
  const connected = smsConfigured();
  const multi = mine.length > 1;
  const campusPick = multi ? (
    <div><label className="mb-1 block text-xs text-muted-foreground">School</label>
      <select name="campus" required className={field}>{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
  ) : <input type="hidden" name="campus" value={mine[0]?.id ?? ''} />;

  return (
    <div className="space-y-8">
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <section className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary"><MessageSquare className="h-5 w-5" aria-hidden="true" />SMS</h2>
            <p className="text-sm text-muted-foreground">{connected ? 'Connected to Africa’s Talking.' : 'Not connected yet: messages wait in the queue until the SMS keys are added on the server.'} {queued} waiting · {failed} failed</p>
          </div>
          <form action={sendQueuedAction} className="flex gap-2">
            {campusPick}
            <Button type="submit" variant="outline" size="sm"><Send className="mr-1.5 h-4 w-4" />Send queued now</Button>
            {failed > 0 && <Button type="submit" name="retry" value="yes" variant="outline" size="sm"><RefreshCw className="mr-1.5 h-4 w-4" />Retry failed</Button>}
          </form>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold">Automatic receipts</h3>
        <p className="mb-3 text-sm text-muted-foreground">When on, the parent gets an SMS with the amount, receipt number and balance every time a payment is recorded or arrives by M-Pesa. Imported statements and old payments never send.</p>
        <ul className="space-y-2">
          {mine.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>{c.name}: <strong>{c.sms_receipts_enabled ? 'On' : 'Off'}</strong></span>
              <form action={toggleReceiptsAction}><input type="hidden" name="campus" value={c.id} /><input type="hidden" name="enabled" value={c.sms_receipts_enabled ? 'false' : 'true'} /><Button type="submit" size="sm" variant="outline">Turn {c.sms_receipts_enabled ? 'off' : 'on'}</Button></form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold">Absence alerts</h3>
        <p className="mb-3 text-sm text-muted-foreground">When on, the parent gets an SMS the first time their child is marked absent for today. Back-dated changes never send.</p>
        <ul className="space-y-2">
          {mine.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <span>{c.name}: <strong>{c.sms_absence_enabled ? 'On' : 'Off'}</strong></span>
              <form action={toggleAbsenceSmsAction}><input type="hidden" name="campus" value={c.id} /><input type="hidden" name="enabled" value={c.sms_absence_enabled ? 'false' : 'true'} /><Button type="submit" size="sm" variant="outline">Turn {c.sms_absence_enabled ? 'off' : 'on'}</Button></form>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold">Fee reminder</h3>
          <p className="mb-3 text-sm text-muted-foreground">To every family who owes at least the amount you set. One reminder per child per day. Use {'{child}'}, {'{balance}'}, {'{admission}'}, {'{school}'}.</p>
          <form action={reminderAction} className="space-y-3">
            {campusPick}
            <div><label htmlFor="min" className="mb-1 block text-xs text-muted-foreground">Owing at least (KES)</label><Input id="min" name="min" type="number" min={0} defaultValue={1000} className="w-40" /></div>
            <div><label htmlFor="template" className="mb-1 block text-xs text-muted-foreground">Message</label>
              <textarea id="template" name="template" required rows={4} maxLength={300} className={area} defaultValue="{school}: {child} ({admission}) has a fee balance of {balance}. Please pay by Paybill or at the office. Thank you." /></div>
            <div className="flex gap-2">
              <Button type="submit" name="step" value="preview" variant="outline">Preview</Button>
              <Button type="submit" name="step" value="send">Send</Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold">Notice to parents</h3>
          <p className="mb-3 text-sm text-muted-foreground">One message per phone number, so a parent with two children gets it once.</p>
          <form action={noticeAction} className="space-y-3">
            {campusPick}
            <div><label htmlFor="class" className="mb-1 block text-xs text-muted-foreground">Who</label>
              <select id="class" name="class" className={field}><option value="">Whole school</option>
                {((classes ?? []) as { id: string; campus_id: string; stream: string; year: number; grade_id: string }[]).filter((c) => mine.some((m) => m.id === c.campus_id)).map((c) => <option key={c.id} value={c.id}>{gname.get(c.grade_id)}{c.stream ? ` ${c.stream}` : ''} ({c.year})</option>)}
              </select></div>
            <div><label htmlFor="body" className="mb-1 block text-xs text-muted-foreground">Message (max 480 characters)</label>
              <textarea id="body" name="body" required rows={4} maxLength={480} className={area} placeholder="e.g. School closes on Friday 28 Nov at 12 noon. Term 1 opens Monday 5 Jan." /></div>
            <div className="flex gap-2">
              <Button type="submit" name="step" value="preview" variant="outline">Preview</Button>
              <Button type="submit" name="step" value="send">Send</Button>
            </div>
          </form>
        </section>
      </div>

      <section>
        <h3 className="mb-2 font-semibold">Latest messages</h3>
        {rows.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing sent yet.</p> : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">When</th><th className="p-3">To</th><th className="p-3">Type</th><th className="p-3">Message</th><th className="p-3">Status</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Nairobi' })}</td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs">{r.to_phone}</td>
                  <td className="p-3 capitalize">{r.kind}</td>
                  <td className="min-w-64 p-3">{r.body}</td>
                  <td className="p-3"><span className={r.status === 'sent' ? 'text-green-700' : r.status === 'failed' ? 'text-red-700' : 'text-amber-700'}>{r.status}</span>{r.error && <span className="block text-xs text-muted-foreground">{r.error}</span>}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
