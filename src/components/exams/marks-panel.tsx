import type { SupabaseClient } from '@supabase/supabase-js';
import { MarksForm } from '@/components/exams/marks-form';
import { Button } from '@/components/ui/button';
import { loadRegister } from '@/lib/attendance/load';
import type { AreaRow, ExamRow } from '@/lib/exams/types';
import type { ClassRow, GradeLevelRow } from '@/lib/supabase/types';

const sel = 'h-10 w-full rounded-md border bg-background px-3 text-sm';

/** Exam + learning-area pickers, then the marks sheet for one class. Shared by teachers and the office. */
export async function MarksPanel({ supabase, classId, examId, areaId, returnTo, isStaff, fixedExam }: {
  supabase: SupabaseClient; classId: string; examId?: string; areaId?: string; returnTo: 'admin' | 'teacher'; isStaff: boolean; fixedExam?: boolean;
}) {
  const { data: cls } = await supabase.from('classes').select('*').eq('id', classId).maybeSingle();
  if (!cls) return <p className="text-sm text-muted-foreground">Class not found.</p>;
  const c = cls as ClassRow;
  const [{ data: grade }, { data: exams }] = await Promise.all([
    supabase.from('grade_levels').select('*').eq('id', c.grade_id).maybeSingle(),
    supabase.from('exams').select('*').eq('campus_id', c.campus_id).order('year', { ascending: false }).order('term', { ascending: false }),
  ]);
  const stage = (grade as GradeLevelRow | null)?.stage;
  const { data: areaData } = await supabase.from('learning_areas').select('*').eq('campus_id', c.campus_id).eq('stage', stage ?? '').order('sort_order').order('name');
  const areas = (areaData ?? []) as AreaRow[];
  const examList = (exams ?? []) as ExamRow[];
  const exam = examList.find((e) => e.id === examId);
  const area = areas.find((a) => a.id === areaId);

  let sheet: React.ReactNode = <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{examList.length === 0 ? 'No exam has been set up yet. The office creates it first.' : areas.length === 0 ? 'No learning areas for this class yet. The office adds them under Exams.' : 'Choose an exam and a learning area.'}</p>;
  if (exam && area) {
    const { pupils } = await loadRegister(supabase, classId, new Date().toISOString().slice(0, 10));
    const { data: ms } = await supabase.from('marks').select('student_id, score').eq('exam_id', exam.id).eq('area_id', area.id);
    const scores = new Map(((ms ?? []) as { student_id: string; score: number }[]).map((m) => [m.student_id, Number(m.score)]));
    sheet = pupils.length === 0 ? <p className="text-sm text-muted-foreground">No pupils in this class.</p>
      : <MarksForm examId={exam.id} classId={classId} areaId={area.id} pupils={pupils} scores={scores} returnTo={returnTo} locked={exam.is_published && !isStaff} />;
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {returnTo === 'admin' && <input type="hidden" name="class" value={classId} />}
        <div><label htmlFor="exam" className="mb-1 block text-xs text-muted-foreground">Exam</label>
          <select id="exam" name="exam" defaultValue={examId ?? ''} className={sel}><option value="">Choose…</option>{examList.filter((e) => !fixedExam || e.id === examId).map((e) => <option key={e.id} value={e.id}>{e.name} · Term {e.term} {e.year}{e.is_published ? ' (published)' : ''}</option>)}</select></div>
        <div><label htmlFor="area" className="mb-1 block text-xs text-muted-foreground">Learning area</label>
          <select id="area" name="area" defaultValue={areaId ?? ''} className={sel}><option value="">Choose…</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <Button type="submit" variant="outline">Open</Button>
      </form>
      {sheet}
    </div>
  );
}
