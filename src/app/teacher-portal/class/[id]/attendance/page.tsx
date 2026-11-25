import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { AttendanceForm } from '@/components/attendance/attendance-form';
import { cleanDay, isWeekend, todayKE } from '@/lib/attendance/shared';
import { loadRegister } from '@/lib/attendance/load';
import { classLabel } from '@/lib/classes/queries-shared';
import { requireTeacher } from '@/lib/portal/context';
import type { ClassRow, GradeLevelRow } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Attendance', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TeacherAttendancePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string; error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireTeacher();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: cls } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
  if (!cls) notFound();
  const c = cls as ClassRow;
  const { data: grade } = await supabase.from('grade_levels').select('*').eq('id', c.grade_id).maybeSingle();
  const day = cleanDay(sp.date);
  const { pupils, existing } = await loadRegister(supabase, id, day);
  const title = classLabel((grade as GradeLevelRow | null)?.name, c.stream);
  const weekend = isWeekend(day);

  return (
    <div>
      <PageHeader eyebrow="Attendance" title={title} subtitle={new Date(`${day}T12:00:00Z`).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })} className="py-10 md:py-14" />
      <section className="section-pad">
        <div className="container mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Link href={`/teacher-portal/class/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Class list</Link>
            <form className="flex items-end gap-2">
              <div><label htmlFor="date" className="mb-1 block text-xs text-muted-foreground">Date</label><input id="date" name="date" type="date" defaultValue={day} max={todayKE()} className="h-10 rounded-md border bg-background px-3 text-sm" /></div>
              <Button type="submit" variant="outline">Go</Button>
            </form>
          </div>
          {sp.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{sp.error}</p>}
          {sp.ok && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{sp.ok}</p>}
          {weekend ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">That is a weekend. Pick a school day.</p>
            : pupils.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No pupils in this class yet.</p>
            : <>
                <p className="text-sm text-muted-foreground">{existing.size > 0 ? `Already marked (${existing.size} of ${pupils.length}). You can change it.` : 'Everyone starts as Present. Change only those who are not.'}</p>
                <AttendanceForm classId={id} day={day} pupils={pupils} existing={existing} returnTo="teacher" />
              </>}
        </div>
      </section>
    </div>
  );
}
