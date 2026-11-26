import Link from 'next/link';
import { createExamAction, deleteExamAction, publishExamAction, addAreaAction, deleteAreaAction, seedAreasAction } from '@/app/exams-actions';
import { getAdminContext, getCampusesAndGrades, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { STAGE_LABEL, type AreaRow, type ExamRow } from '@/lib/exams/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm';

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  await requireAdmissionsStaff();
  const ctx = await getAdminContext();
  const { campuses } = await getCampusesAndGrades();
  const mine = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active);
  const name = new Map(campuses.map((c) => [c.id, c.name]));
  const [{ data: ex }, { data: ar }] = await Promise.all([
    ctx.supabase.from('exams').select('*').order('year', { ascending: false }).order('term', { ascending: false }),
    ctx.supabase.from('learning_areas').select('*').order('sort_order').order('name'),
  ]);
  const exams = (ex ?? []) as ExamRow[];
  const areas = (ar ?? []) as AreaRow[];
  const year = new Date().getFullYear();
  const campusPick = mine.length > 1
    ? <div><label className="mb-1 block text-xs text-muted-foreground">School</label><select name="campus" className={field}>{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Exams and report cards</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Create an exam, teachers enter marks per learning area, the class teacher writes comments, then you publish so parents can see the report card.</p>
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <section className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-semibold">New exam</h2>
        <form action={createExamAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          {campusPick}
          <div><label htmlFor="name" className="mb-1 block text-xs text-muted-foreground">Name</label><Input id="name" name="name" required minLength={2} maxLength={80} placeholder="End of Term 3" /></div>
          <div><label htmlFor="year" className="mb-1 block text-xs text-muted-foreground">Year</label><Input id="year" name="year" type="number" required defaultValue={year} /></div>
          <div><label htmlFor="term" className="mb-1 block text-xs text-muted-foreground">Term</label><select id="term" name="term" className={field} defaultValue="3"><option>1</option><option>2</option><option>3</option></select></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="show_position" />Show class position</label>
          <Button type="submit" className="lg:col-start-5">Create exam</Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Exams</h2>
        {exams.length === 0 ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No exams yet.</p> : (
          <ul className="space-y-3">
            {exams.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
                <div>
                  <Link href={`/admin/exams/${e.id}`} className="font-medium text-primary hover:underline">{e.name}</Link>
                  <p className="text-xs text-muted-foreground">{name.get(e.campus_id)} · Term {e.term}, {e.year} · {e.is_published ? <span className="text-green-700">Published to parents</span> : 'Draft (parents cannot see it)'}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline"><Link href={`/admin/exams/${e.id}`}>Open</Link></Button>
                  <form action={publishExamAction}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="publish" value={e.is_published ? 'false' : 'true'} /><Button size="sm" type="submit" variant={e.is_published ? 'outline' : 'default'}>{e.is_published ? 'Unpublish' : 'Publish'}</Button></form>
                  {!e.is_published && <form action={deleteExamAction}><input type="hidden" name="id" value={e.id} /><Button size="sm" type="submit" variant="outline" className="text-red-700">Delete</Button></form>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Learning areas</h2><p className="text-sm text-muted-foreground">The subjects on the report card, per stage. Standard CBC areas are already added; edit to match your school.</p></div>
          <form action={seedAreasAction} className="flex items-end gap-2">{campusPick}<Button type="submit" variant="outline" size="sm">Add any missing standard areas</Button></form>
        </div>
        {mine.map((c) => (
          <div key={c.id} className="mb-5">
            {mine.length > 1 && <h3 className="mb-2 text-sm font-semibold">{c.name}</h3>}
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(STAGE_LABEL).map(([stage, label]) => (
                <div key={stage} className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {areas.filter((a) => a.campus_id === c.id && a.stage === stage).map((a) => (
                      <li key={a.id}><form action={deleteAreaAction} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"><input type="hidden" name="id" value={a.id} />{a.name}<button type="submit" aria-label={`Remove ${a.name}`} className="text-muted-foreground hover:text-red-700">×</button></form></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <form action={addAreaAction} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="campus" value={c.id} />
              <div><label className="mb-1 block text-xs text-muted-foreground">Stage</label><select name="stage" className="h-10 rounded-md border bg-background px-3 text-sm">{Object.entries(STAGE_LABEL).map(([s, l]) => <option key={s} value={s}>{l}</option>)}</select></div>
              <div><label className="mb-1 block text-xs text-muted-foreground">New learning area</label><Input name="name" required minLength={2} maxLength={80} className="w-56" /></div>
              <Button type="submit" size="sm" variant="outline">Add</Button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
