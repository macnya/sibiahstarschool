import { saveAttendanceAction } from '@/app/attendance-actions';
import { Button } from '@/components/ui/button';
import { STATUS_LABEL, STATUSES, type AttendanceStatus } from '@/lib/attendance/shared';

export interface Pupil { id: string; name: string; admission: string }

/** Server component: a register where each pupil is Present unless changed. */
export function AttendanceForm({ classId, day, pupils, existing, returnTo }: {
  classId: string; day: string; pupils: Pupil[];
  existing: Map<string, { status: AttendanceStatus; note: string | null }>; returnTo: 'admin' | 'teacher';
}) {
  return (
    <form action={saveAttendanceAction} className="space-y-4">
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="return_to" value={returnTo} />
      <ul className="divide-y rounded-lg border bg-card">
        {pupils.map((p, i) => {
          const cur = existing.get(p.id);
          return (
            <li key={p.id} className="space-y-2 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium"><span className="mr-2 text-xs text-muted-foreground">{i + 1}</span>{p.name}</p>
                <span className="font-mono text-xs text-muted-foreground">{p.admission}</span>
              </div>
              <fieldset className="flex flex-wrap gap-2">
                <legend className="sr-only">Attendance for {p.name}</legend>
                {STATUSES.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input type="radio" name={`s_${p.id}`} value={s} defaultChecked={(cur?.status ?? 'present') === s} className="peer sr-only" />
                    <span className={`inline-block rounded-full border px-3 py-1.5 text-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                      s === 'present' ? 'peer-checked:border-green-600 peer-checked:bg-green-600 peer-checked:text-white'
                      : s === 'absent' ? 'peer-checked:border-red-600 peer-checked:bg-red-600 peer-checked:text-white'
                      : s === 'late' ? 'peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-checked:text-white'
                      : 'peer-checked:border-slate-600 peer-checked:bg-slate-600 peer-checked:text-white'}`}>{STATUS_LABEL[s]}</span>
                  </label>
                ))}
              </fieldset>
              <input name={`n_${p.id}`} defaultValue={cur?.note ?? ''} maxLength={200} placeholder="Note (optional)" aria-label={`Note for ${p.name}`} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
            </li>
          );
        })}
      </ul>
      <div className="sticky bottom-0 -mx-1 bg-background/95 p-2 backdrop-blur"><Button type="submit" size="lg" className="w-full sm:w-auto">Save attendance</Button></div>
    </form>
  );
}
