import type { SupabaseClient } from '@supabase/supabase-js';
import { CommentsForm } from '@/components/exams/comments-form';
import { loadRegister } from '@/lib/attendance/load';

export async function CommentsPanel({ supabase, classId, examId, returnTo, isStaff }: { supabase: SupabaseClient; classId: string; examId: string; returnTo: 'admin' | 'teacher'; isStaff: boolean }) {
  const [{ pupils }, { data: cm }, { data: ex }] = await Promise.all([
    loadRegister(supabase, classId, new Date().toISOString().slice(0, 10)),
    supabase.from('report_comments').select('student_id, teacher_comment, head_comment').eq('exam_id', examId),
    supabase.from('exams').select('is_published, name').eq('id', examId).maybeSingle(),
  ]);
  if (!ex) return <p className="text-sm text-muted-foreground">Exam not found.</p>;
  const comments = new Map(((cm ?? []) as { student_id: string; teacher_comment: string | null; head_comment: string | null }[]).map((c) => [c.student_id, { teacher: c.teacher_comment, head: c.head_comment }]));
  const e = ex as { is_published: boolean; name: string };
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{e.name}. {isStaff ? 'You can write both comments.' : 'Only the class teacher can save comments.'}</p>
      {pupils.length === 0 ? <p className="text-sm text-muted-foreground">No pupils in this class.</p>
        : <CommentsForm examId={examId} classId={classId} pupils={pupils} comments={comments} returnTo={returnTo} isStaff={isStaff} locked={e.is_published && !isStaff} />}
    </div>
  );
}
