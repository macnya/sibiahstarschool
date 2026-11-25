import Link from 'next/link';
import { getAdminContext, getCampusesAndGrades } from '@/lib/admissions/admin-queries';
import { cleanDay, isWeekend, todayKE } from '@/lib/attendance/shared';
import { classLabel } from '@/lib/classes/queries-shared';
import { Button } from '@/components/ui/button';
import type { ClassRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface Ov { class_id: string; pupils: number; marked: number; present: number; absent: number; late: number; excused: number }

export default async function AttendanceOverviewPage({ searchParams }: { searchParams: Promise<{ date?: string; campus?: string }> }) {
  const sp = await searchParams;
  const ctx = await getAdminContext();
  const { campuses, grades } = await getCampusesAndGrades();
  const mine = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active);
  const campus = mine.find((c) => c.id === sp.campus) ?? mine[0];
  const day = cleanDay(sp.date);
  const gname = new Map(grades.map((g) => [g.id, g.name]));
  let rows: { cls: ClassRow; ov: Ov | undefined }[] = [];
  if (campus) {
    const [{ data: cls }, { data: ov }] = await Promise.all([
      ctx.supabase.from('classes').select('*').eq('campus_id', campus.id).eq('year', Number(day.slice(0, 4))),
      ctx.supabase.rpc('attendance_overview', { p_campus: campus.id, p_day: day }),
    ]);
    const m = new Map(((ov ?? []) as Ov[]).map((o) => [o.class_id, o]));
    const order = new Map(grades.map((g, i) => [g.id, i]));
    rows = ((cls ?? []) as ClassRow[]).sort((a, b) => (order.get(a.grade_id) ?? 0) - (order.get(b.grade_id) ?? 0) || a.stream.localeCompare(b.stream)).map((c) => ({ cls: c, ov: m.get(c.id) }));
  }
  const unmarked = rows.filter((r) => r.ov && r.ov.pupils > 0 && r.ov.marked === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Attendance</h1>
        <p className="text-sm text-muted-foreground">Which classes have been marked today, and who is away. Open a class to mark it or correct it.</p>
      </div>
      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        {mine.length > 1 && <div><label htmlFor="campus" className="mb-1 block text-xs text-muted-foreground">School</label><select id="campus" name="campus" defaultValue={campus?.id} className="h-10 rounded-md border bg-background px-3 text-sm">{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
        <div><label htmlFor="date" className="mb-1 block text-xs text-muted-foreground">Date</label><input id="date" name="date" type="date" defaultValue={day} max={todayKE()} className="h-10 rounded-md border bg-background px-3 text-sm" /></div>
        <Button type="submit">Show</Button>
      </form>
      {isWeekend(day) && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">That date is a weekend.</p>}
      {!isWeekend(day) && unmarked > 0 && <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{unmarked} {unmarked === 1 ? 'class has' : 'classes have'} not been marked yet.</p>}
      {rows.length === 0 ? <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No classes for {day.slice(0, 4)} yet. Create them under Classes.</p> : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Class</th><th className="p-3">Pupils</th><th className="p-3">Present</th><th className="p-3">Late</th><th className="p-3">Absent</th><th className="p-3">Excused</th><th className="p-3">Status</th></tr></thead>
            <tbody>{rows.map(({ cls, ov }) => (
              <tr key={cls.id} className="border-t">
                <td className="p-3 font-medium"><Link href={`/admin/attendance/${cls.id}?date=${day}`} className="text-primary hover:underline">{classLabel(gname.get(cls.grade_id), cls.stream)}</Link></td>
                <td className="p-3">{ov?.pupils ?? 0}</td><td className="p-3">{ov?.present ?? 0}</td><td className="p-3">{ov?.late ?? 0}</td>
                <td className={`p-3 ${ov && ov.absent > 0 ? 'font-semibold text-red-700' : ''}`}>{ov?.absent ?? 0}</td><td className="p-3">{ov?.excused ?? 0}</td>
                <td className="p-3">{!ov || ov.pupils === 0 ? <span className="text-muted-foreground">No pupils</span> : ov.marked === 0 ? <span className="text-amber-700">Not marked</span> : ov.marked < ov.pupils ? <span className="text-amber-700">Partly ({ov.marked}/{ov.pupils})</span> : <span className="text-green-700">Done</span>}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
