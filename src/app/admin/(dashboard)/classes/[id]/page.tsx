import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  assignTeacherAction, deleteClassAction, placeStudentsAction, placeUnplacedAction,
  removeFromClassAction, removeTeacherFromClassAction, updateClassCapacityAction,
} from '@/app/admin/classes-actions';
import { requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { classLabel, getClassDetail } from '@/lib/classes/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';
const field = 'h-10 rounded-md border bg-background px-3 text-sm';

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await requireAdmissionsStaff();
  const d = await getClassDetail(id);
  if (!d) notFound();
  const { cls, roster, unplaced, assigned, teachers } = d;
  const title = classLabel(d.gradeName, cls.stream);
  const free = cls.capacity - roster.length;

  return (
    <div className="space-y-8">
      <Link href="/admin/classes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Classes</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">{title} <span className="text-muted-foreground">· {cls.year}</span></h1>
          <p className="text-sm text-muted-foreground">{d.campusName} · {roster.length} of {cls.capacity} places used</p>
        </div>
        <form action={updateClassCapacityAction} className="flex items-end gap-2">
          <input type="hidden" name="class_id" value={cls.id} />
          <div><label htmlFor="capacity" className="mb-1 block text-xs text-muted-foreground">Capacity</label><Input id="capacity" name="capacity" type="number" min={1} max={200} defaultValue={cls.capacity} className="w-24" /></div>
          <Button type="submit" variant="outline">Save</Button>
        </form>
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold text-primary">Teachers</h2>
        {assigned.length === 0 ? <p className="mb-3 text-sm text-amber-700">No teacher yet.</p> : (
          <ul className="mb-4 divide-y rounded-md border">
            {assigned.map((a) => (
              <li key={a.teacher_id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span><strong>{a.name}</strong>{a.is_class_teacher && <span className="ml-2 rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-primary">Class teacher</span>}{a.subject && <span className="ml-2 text-muted-foreground">{a.subject}</span>}</span>
                <form action={removeTeacherFromClassAction}><input type="hidden" name="class_id" value={cls.id} /><input type="hidden" name="teacher_id" value={a.teacher_id} /><Button type="submit" size="sm" variant="ghost" className="text-red-700">Remove</Button></form>
              </li>
            ))}
          </ul>
        )}
        {teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">This school has no teachers yet. <Link href="/admin/teachers" className="text-primary underline">Add a teacher</Link> first.</p>
        ) : (
          <form action={assignTeacherAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="class_id" value={cls.id} />
            <div><label htmlFor="teacher_id" className="mb-1 block text-xs text-muted-foreground">Teacher</label>
              <select id="teacher_id" name="teacher_id" required defaultValue="" className={field}><option value="" disabled>Choose…</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div>
            <div><label htmlFor="subject" className="mb-1 block text-xs text-muted-foreground">Subject (optional)</label><Input id="subject" name="subject" maxLength={60} placeholder="Mathematics" className="w-44" /></div>
            <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="is_head" /> Class teacher</label>
            <Button type="submit">Save teacher</Button>
          </form>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold text-primary">Pupils ({roster.length})</h2>
        {roster.length === 0 ? <p className="text-sm text-muted-foreground">No pupils in this class yet.</p> : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-2">#</th><th className="p-2">Adm. no.</th><th className="p-2">Name</th><th className="p-2">Parent</th><th className="p-2" /></tr></thead>
              <tbody>
                {roster.map((s, i) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-mono text-xs">{s.admission_number}</td>
                    <td className="p-2"><Link href={`/admin/students/${s.id}`} className="text-primary hover:underline">{s.first_name} {s.middle_name} {s.last_name}</Link></td>
                    <td className="p-2 text-muted-foreground">{s.guardian_name} · {s.guardian_phone}</td>
                    <td className="p-2 text-right"><form action={removeFromClassAction}><input type="hidden" name="student_id" value={s.id} /><input type="hidden" name="next" value={`/admin/classes/${cls.id}`} /><Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">Remove</Button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border bg-card p-5">
        <h2 className="mb-1 text-base font-semibold text-primary">Add pupils</h2>
        <p className="mb-3 text-sm text-muted-foreground">{unplaced.length} {d.gradeName} pupil{unplaced.length === 1 ? '' : 's'} at {d.campusName} not yet in a class. {free <= 0 ? 'This class is full.' : `${free} place${free === 1 ? '' : 's'} left.`}</p>
        {unplaced.length > 0 && free > 0 && (
          <>
            <form action={placeUnplacedAction} className="mb-4"><input type="hidden" name="class_id" value={cls.id} /><Button type="submit" variant="outline">Add the first {Math.min(free, unplaced.length)} (alphabetical)</Button></form>
            <form action={placeStudentsAction} className="space-y-3">
              <input type="hidden" name="class_id" value={cls.id} />
              <div className="grid max-h-72 gap-1 overflow-auto rounded-md border p-3 sm:grid-cols-2">
                {unplaced.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="student_id" value={s.id} /> {s.first_name} {s.last_name} <span className="font-mono text-xs text-muted-foreground">{s.admission_number}</span></label>
                ))}
              </div>
              <Button type="submit">Add ticked pupils</Button>
            </form>
          </>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Moving a pupil up a year? Open the pupil’s profile and choose their new class: their level changes with it.</p>
      </section>

      {roster.length === 0 && (
        <form action={deleteClassAction}><input type="hidden" name="class_id" value={cls.id} /><Button type="submit" variant="outline" className="text-red-700">Delete this empty class</Button></form>
      )}
    </div>
  );
}
