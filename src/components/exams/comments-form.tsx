import { saveCommentsAction } from '@/app/exams-actions';
import { Button } from '@/components/ui/button';
import type { Pupil } from '@/components/attendance/attendance-form';

export function CommentsForm({ examId, classId, pupils, comments, returnTo, isStaff, locked }: {
  examId: string; classId: string; pupils: Pupil[]; comments: Map<string, { teacher: string | null; head: string | null }>; returnTo: 'admin' | 'teacher'; isStaff: boolean; locked?: boolean;
}) {
  return (
    <form action={saveCommentsAction} className="space-y-4">
      <input type="hidden" name="exam" value={examId} /><input type="hidden" name="class_id" value={classId} /><input type="hidden" name="return_to" value={returnTo} />
      <ul className="space-y-3">
        {pupils.map((p) => {
          const c = comments.get(p.id);
          return (
            <li key={p.id} className="space-y-2 rounded-lg border bg-card p-3">
              <p className="font-medium">{p.name} <span className="font-mono text-xs text-muted-foreground">{p.admission}</span></p>
              <textarea name={`t_${p.id}`} defaultValue={c?.teacher ?? ''} maxLength={500} rows={2} disabled={locked} aria-label={`Class teacher comment for ${p.name}`} placeholder="Class teacher’s comment" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              {isStaff && <textarea name={`h_${p.id}`} defaultValue={c?.head ?? ''} maxLength={500} rows={2} aria-label={`Head teacher comment for ${p.name}`} placeholder="Head teacher’s comment" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />}
            </li>
          );
        })}
      </ul>
      {locked ? <p className="text-sm text-amber-800">This exam is published, so only the office can change comments.</p>
        : <div className="sticky bottom-0 bg-background/95 p-2 backdrop-blur"><Button type="submit" size="lg">Save comments</Button></div>}
    </form>
  );
}
