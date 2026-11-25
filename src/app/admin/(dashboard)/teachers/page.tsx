import Link from 'next/link';
import { createTeacherAction, removeTeacherAccessAction, resetTeacherPasswordAction } from '@/app/admin/classes-actions';
import { getCampusesAndGrades, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { getTeachers } from '@/lib/classes/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm';

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireAdmissionsStaff();
  const { campuses } = await getCampusesAndGrades();
  const mine = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active);
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const teachers = await getTeachers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Teachers</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Each teacher gets a login at <code>/teacher-portal</code> and sees only the classes you give them. Then put them on a class under <Link href="/admin/classes" className="text-primary underline">Classes</Link>.</p>
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      {teachers.length === 0 ? <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No teachers yet.</p> : (
        <ul className="space-y-3">
          {teachers.map((t) => (
            <li key={t.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">{t.full_name}</p>
                  <p className="text-xs text-muted-foreground">{t.campus_id ? campusName.get(t.campus_id) : ''}</p>
                  <p className="mt-1 text-sm">
                    {t.classes.length === 0 ? <span className="text-amber-700">Not on any class yet</span> : t.classes.map((c, i) => (
                      <span key={c.classId}>{i > 0 && ' · '}<Link href={`/admin/classes/${c.classId}`} className="text-primary hover:underline">{c.label}</Link>{c.head && ' (class teacher)'}{c.subject && ` – ${c.subject}`}</span>
                    ))}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <form action={resetTeacherPasswordAction} className="flex items-end gap-2">
                    <input type="hidden" name="teacher_id" value={t.id} />
                    <div><label htmlFor={`pw-${t.id}`} className="mb-1 block text-xs text-muted-foreground">New password</label><Input id={`pw-${t.id}`} name="password" type="password" minLength={10} autoComplete="new-password" className="w-44" required /></div>
                    <Button type="submit" size="sm" variant="outline">Change</Button>
                  </form>
                  <form action={removeTeacherAccessAction}><input type="hidden" name="teacher_id" value={t.id} /><Button type="submit" size="sm" variant="ghost" className="text-red-700">Remove access</Button></form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={createTeacherAction} className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
        <h2 className="text-base font-semibold text-primary sm:col-span-2">Add a teacher</h2>
        <div className="space-y-2"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" required minLength={3} maxLength={120} autoComplete="off" /></div>
        <div className="space-y-2"><Label htmlFor="email">Email (their login)</Label><Input id="email" name="email" type="email" required autoComplete="off" /></div>
        <div className="space-y-2"><Label htmlFor="password">First password</Label><Input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" /><p className="text-xs text-muted-foreground">At least 10 characters. Give it to the teacher in person.</p></div>
        <div className="space-y-2"><Label htmlFor="campus_id">School</Label>
          <select id="campus_id" name="campus_id" required className={field} defaultValue={mine[0]?.id}>{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="sm:col-span-2"><Button type="submit">Create teacher login</Button></div>
      </form>
    </div>
  );
}
