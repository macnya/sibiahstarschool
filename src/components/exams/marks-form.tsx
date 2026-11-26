import { saveMarksAction } from '@/app/exams-actions';
import { Button } from '@/components/ui/button';
import type { Pupil } from '@/components/attendance/attendance-form';

export function MarksForm({ examId, classId, areaId, pupils, scores, returnTo, locked }: {
  examId: string; classId: string; areaId: string; pupils: Pupil[]; scores: Map<string, number>; returnTo: 'admin' | 'teacher'; locked?: boolean;
}) {
  return (
    <form action={saveMarksAction} className="space-y-4">
      <input type="hidden" name="exam" value={examId} /><input type="hidden" name="class_id" value={classId} /><input type="hidden" name="area" value={areaId} /><input type="hidden" name="return_to" value={returnTo} />
      <ul className="divide-y rounded-lg border bg-card">
        {pupils.map((p, i) => (
          <li key={p.id} className="flex items-center justify-between gap-3 p-3">
            <label htmlFor={`m_${p.id}`} className="min-w-0 flex-1"><span className="mr-2 text-xs text-muted-foreground">{i + 1}</span><span className="font-medium">{p.name}</span><span className="ml-2 font-mono text-xs text-muted-foreground">{p.admission}</span></label>
            <input id={`m_${p.id}`} name={`m_${p.id}`} type="number" inputMode="decimal" min={0} max={100} step="0.5" defaultValue={scores.get(p.id)} disabled={locked} placeholder="—" className="h-10 w-24 rounded-md border bg-background px-3 text-right text-sm tabular-nums" />
          </li>
        ))}
      </ul>
      {locked ? <p className="text-sm text-amber-800">This exam is published, so only the office can change marks.</p>
        : <div className="sticky bottom-0 bg-background/95 p-2 backdrop-blur"><Button type="submit" size="lg" className="w-full sm:w-auto">Save marks</Button><span className="ml-3 text-xs text-muted-foreground">Out of 100. Leave blank if absent.</span></div>}
    </form>
  );
}
