import type { Metadata } from 'next';
import { LogOut } from 'lucide-react';
import { portalSignOut } from '@/app/portal-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { requireStaff } from '@/lib/portal/staff';
import { todayKE } from '@/lib/attendance/shared';

export const metadata: Metadata = { title: 'Staff area', robots: { index: false } };
export const dynamic = 'force-dynamic';

interface Head { class_label: string; pupils: number; present: number; late: number; absent: number; excused: number; unmarked: number }
interface Route { route_id: string; name: string; pupils: number }
interface Man { admission: string; pupil: string; class_label: string | null; guardian_name: string | null; guardian_phone: string | null; today_status: string | null }

const DEPT: Record<string, string> = { transport: 'Transport', kitchen: 'Kitchen', general: 'Staff' };

export default async function StaffDashboardPage() {
  const { supabase, info } = await requireStaff();
  const day = new Date(`${todayKE()}T12:00:00Z`).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  let body: React.ReactNode = <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Your account is active. The office will add the tools for your role here.</p>;

  if (info.department === 'kitchen') {
    const { data } = await supabase.rpc('kitchen_headcount', { p_campus: info.campus_id });
    const rows = (data ?? []) as Head[];
    const sum = (k: keyof Head) => rows.reduce((a, r) => a + Number(r[k]), 0);
    const expected = sum('present') + sum('late');
    const unmarked = sum('unmarked');
    body = (
      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Pupils at school today</p>
          <p className="display-title text-6xl text-primary">{expected}</p>
          {unmarked > 0 && <p className="mt-2 text-sm text-amber-700">{unmarked} pupils are not marked yet. Teachers are still taking attendance, so this number may rise.</p>}
        </div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Class</th><th className="p-3">Pupils</th><th className="p-3">Present</th><th className="p-3">Late</th><th className="p-3">Absent</th><th className="p-3">Not marked</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.class_label} className="border-t"><td className="p-3 font-medium">{r.class_label}</td><td className="p-3">{r.pupils}</td><td className="p-3">{r.present}</td><td className="p-3">{r.late}</td><td className="p-3">{r.absent}</td><td className="p-3 text-amber-700">{r.unmarked}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  } else if (info.department === 'transport') {
    const { data } = await supabase.rpc('transport_overview', { p_campus: info.campus_id });
    const routes = (data ?? []) as Route[];
    const manifests = await Promise.all(routes.map(async (r) => ({ r, m: ((await supabase.rpc('transport_manifest', { p_route: r.route_id })).data ?? []) as Man[] })));
    body = routes.length === 0 ? <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No routes yet. The office creates routes and puts pupils on them.</p> : (
      <div className="space-y-6">
        {manifests.map(({ r, m }) => (
          <section key={r.route_id} className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-lg font-semibold text-primary">{r.name} <span className="text-sm font-normal text-muted-foreground">· {m.length} pupils</span></h2>
            {m.length === 0 ? <p className="text-sm text-muted-foreground">No pupils on this route.</p> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="p-2">Pupil</th><th className="p-2">Class</th><th className="p-2">Parent</th><th className="p-2">Phone</th><th className="p-2">Today</th></tr></thead>
                <tbody>{m.map((p) => <tr key={p.admission} className="border-t"><td className="p-2 font-medium">{p.pupil}</td><td className="p-2">{p.class_label}</td><td className="p-2">{p.guardian_name}</td><td className="p-2"><a className="text-primary hover:underline" href={`tel:${p.guardian_phone}`}>{p.guardian_phone}</a></td><td className={`p-2 capitalize ${p.today_status === 'absent' ? 'font-semibold text-red-700' : ''}`}>{p.today_status ?? 'not marked'}</td></tr>)}</tbody>
              </table></div>
            )}
          </section>
        ))}
        <p className="text-xs text-muted-foreground print:hidden">Parent phone numbers are for school transport business only.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={`${DEPT[info.department]} · ${info.campus_name}`} title={`Hello, ${(info.name ?? 'team').split(' ')[0]}`} subtitle={`${day}${info.title ? ` · ${info.title}` : ''}`} className="py-10 md:py-14" />
      <section className="section-pad">
        <div className="container mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end"><form action={portalSignOut}><input type="hidden" name="to" value="staff" /><Button type="submit" variant="outline" size="sm"><LogOut className="mr-1.5 h-4 w-4" />Sign out</Button></form></div>
          {body}
        </div>
      </section>
    </div>
  );
}
