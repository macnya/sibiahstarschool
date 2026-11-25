import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { cleanDay, isWeekend, todayKE } from '@/lib/attendance/shared';
import { loadRegister } from '@/lib/attendance/load';
import { classLabel } from '@/lib/classes/queries-shared';
import { Button } from '@/components/ui/button';
import type { ClassRow, GradeLevelRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AdminClassAttendancePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string; error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getAdminContext();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: cls } = await ctx.supabase.from('classes').select('*').eq('id', id).maybeSingle();
  if (!cls) notFound();
  const c = cls as ClassRow;
  const { data: grade } = await ctx.supabase.from('grade_levels').select('*').eq('id', c.grade_id).maybeSingle();
  const day = cleanDay(sp.date);
  const { pupils, existing } = await loadRegister(ctx.supabase, id, day);

  return (
    <div className="max-w-3xl space-y-5">
      <Link href={`/admin/attendance?date=${day}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />All classes</Link>
      <h1 className="text-2xl font-semibold text-primary">{classLabel((grade as GradeLevelRow | null)?.name, c.stream)} · attendance</h1>
      <form className="flex items-end gap-2">
        <div><label htmlFor="date" className="mb-1 block text-xs text-muted-foreground">Date</label><input id="date" name="date" type="date" defaultValue={day} max={todayKE()} className="h-10 rounded-md border bg-background px-3 text-sm" /></div>
        <Button type="submit" variant="outline">Go</Button>
      </form>
      {sp.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{sp.error}</p>}
      {sp.ok && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{sp.ok}</p>}
      {isWeekend(day) ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">That is a weekend.</p>
        : pupils.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No pupils in this class.</p>
        : <AttendanceForm classId={id} day={day} pupils={pupils} existing={existing} returnTo="admin" />}
    </div>
  );
}
