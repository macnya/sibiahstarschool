import Link from 'next/link';
import { addRouteAction, createStaffAction, deleteRouteAction, removeStaffAccessAction, resetStaffPasswordAction } from '@/app/admin/staff-actions';
import { getCampusesAndGrades, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm';
const DEPT_LABEL: Record<string, string> = { transport: 'Transport', kitchen: 'Kitchen', general: 'General staff' };

interface Member { user_id: string; campus_id: string; department: string; job_title: string | null }

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireAdmissionsStaff();
  const { campuses } = await getCampusesAndGrades();
  const mine = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active);
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const [{ data: m }, { data: routes }, { data: admins }] = await Promise.all([
    ctx.supabase.from('staff_members').select('*').order('department'),
    ctx.supabase.from('transport_routes').select('*').order('name'),
    ctx.supabase.from('profiles').select('id, full_name, campus_id, role').in('role', ['admin', 'editor']).order('full_name'),
  ]);
  const members = (m ?? []) as Member[];
  const ids = members.map((x) => x.user_id);
  const { data: profs } = ids.length ? await ctx.supabase.from('profiles').select('id, full_name').in('id', ids) : { data: [] };
  const nameOf = new Map(((profs ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? 'Unnamed']));
  const routeList = (routes ?? []) as { id: string; campus_id: string; name: string }[];
  const campusPick = ctx.campusId ? null : (
    <div className="space-y-2"><Label htmlFor="campus_id">School</Label><select id="campus_id" name="campus_id" required className={field}>{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Staff accounts</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Everyone signs in at <strong>Staff Login</strong> (in the website menu). You create their account and choose their role; they land on the page for that role. Teachers are given their classes under <Link href="/admin/teachers" className="text-primary underline">Teachers</Link>.</p>
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <form action={createStaffAction} className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
        <h2 className="text-base font-semibold text-primary sm:col-span-2">Add a staff member</h2>
        <div className="space-y-2"><Label htmlFor="kind">Role</Label>
          <select id="kind" name="kind" required defaultValue="" className={field}>
            <option value="" disabled>Choose…</option>
            <option value="teacher">Teacher (classes, attendance, marks)</option>
            <option value="transport">Transport (route lists)</option>
            <option value="kitchen">Kitchen (daily headcount)</option>
            <option value="general">Other staff (sign-in only for now)</option>
            {ctx.isGroupAdmin && <option value="administration">Administration / office (full office console)</option>}
          </select></div>
        {campusPick}
        <div className="space-y-2"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" required minLength={3} maxLength={120} autoComplete="off" /></div>
        <div className="space-y-2"><Label htmlFor="job_title">Job title (optional)</Label><Input id="job_title" name="job_title" maxLength={80} placeholder="e.g. Driver, Cook" autoComplete="off" /></div>
        <div className="space-y-2"><Label htmlFor="email">Email (their login)</Label><Input id="email" name="email" type="email" required autoComplete="off" /></div>
        <div className="space-y-2"><Label htmlFor="password">First password (10+ characters)</Label><Input id="password" name="password" type="text" required minLength={10} autoComplete="off" /></div>
        <div className="sm:col-span-2"><Button type="submit">Create account</Button></div>
      </form>

      <section>
        <h2 className="mb-3 font-semibold">Department staff</h2>
        {members.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No transport, kitchen or other staff yet.</p> : (
          <ul className="space-y-3">
            {members.map((x) => (
              <li key={x.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
                <div><p className="font-semibold text-primary">{nameOf.get(x.user_id)}</p><p className="text-xs text-muted-foreground">{DEPT_LABEL[x.department] ?? x.department}{x.job_title ? ` · ${x.job_title}` : ''} · {campusName.get(x.campus_id)}</p></div>
                <div className="flex flex-wrap items-end gap-2">
                  <form action={resetStaffPasswordAction} className="flex items-end gap-2"><input type="hidden" name="user_id" value={x.user_id} />
                    <div><label htmlFor={`pw-${x.user_id}`} className="mb-1 block text-xs text-muted-foreground">New password</label><Input id={`pw-${x.user_id}`} name="password" type="text" minLength={10} className="w-44" required autoComplete="off" /></div>
                    <Button type="submit" size="sm" variant="outline">Change</Button></form>
                  <form action={removeStaffAccessAction}><input type="hidden" name="user_id" value={x.user_id} /><Button type="submit" size="sm" variant="ghost" className="text-red-700">Remove access</Button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Office administrators</h2>
        <ul className="mt-2 space-y-1 text-sm">{((admins ?? []) as { id: string; full_name: string | null; campus_id: string | null; role: string }[]).map((a) => <li key={a.id}>{a.full_name ?? 'Unnamed'} <span className="text-muted-foreground">· {a.campus_id ? campusName.get(a.campus_id) : 'All schools'} · {a.role}</span></li>)}</ul>
        <p className="mt-2 text-xs text-muted-foreground">To remove an administrator or change their role, use the Supabase dashboard (Table editor › profiles). It is deliberately not done here.</p>
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Transport routes</h2>
        <p className="mb-3 text-sm text-muted-foreground">Create the routes here, then put each pupil on a route from their profile (Students › click the name). Transport staff then see the list for each route.</p>
        <ul className="mb-3 flex flex-wrap gap-2">
          {routeList.map((r) => (
            <li key={r.id}><form action={deleteRouteAction} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"><input type="hidden" name="id" value={r.id} />{r.name} <span className="text-xs text-muted-foreground">({campusName.get(r.campus_id)})</span><button type="submit" aria-label={`Remove ${r.name}`} className="text-muted-foreground hover:text-red-700">×</button></form></li>
          ))}
          {routeList.length === 0 && <li className="text-sm text-muted-foreground">No routes yet.</li>}
        </ul>
        <form action={addRouteAction} className="flex flex-wrap items-end gap-2">
          {ctx.campusId ? null : <div><label className="mb-1 block text-xs text-muted-foreground">School</label><select name="campus_id" className="h-10 rounded-md border bg-background px-3 text-sm">{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
          <div><label htmlFor="route-name" className="mb-1 block text-xs text-muted-foreground">New route</label><Input id="route-name" name="name" required minLength={2} maxLength={80} placeholder="e.g. Kinyago – Rongai" className="w-64" /></div>
          <Button type="submit" size="sm" variant="outline">Add route</Button>
        </form>
      </section>
    </div>
  );
}
