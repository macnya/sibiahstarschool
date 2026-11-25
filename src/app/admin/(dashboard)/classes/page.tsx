import Link from 'next/link';
import { createClassAction } from '@/app/admin/classes-actions';
import { getCampusesAndGrades, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { getClassSummaries } from '@/lib/classes/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';
const field = 'h-10 w-full rounded-md border bg-background px-3 text-sm';

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ year?: string; campus?: string; error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireAdmissionsStaff();
  const thisYear = new Date().getFullYear();
  const year = Number(sp.year) || thisYear;
  const { campuses, grades } = await getCampusesAndGrades();
  const mine = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active);
  const { classes } = await getClassSummaries({ year, campusId: sp.campus || undefined });
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const years = [thisYear + 1, thisYear, thisYear - 1, thisYear - 2];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Classes</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Create each year’s classes (for example “Grade 4 Blue”), put pupils in them and give each class its teachers. Teachers then see only their own classes.</p>
      </div>
      {sp.error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{sp.error}</div>}
      {sp.ok && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{sp.ok}</div>}

      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div><label htmlFor="year" className="mb-1 block text-xs text-muted-foreground">Year</label>
          <select id="year" name="year" defaultValue={String(year)} className={field}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></div>
        {!ctx.campusId && mine.length > 1 && (
          <div><label htmlFor="campus" className="mb-1 block text-xs text-muted-foreground">School</label>
            <select id="campus" name="campus" defaultValue={sp.campus ?? ''} className={field}><option value="">All schools</option>{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        )}
        <Button type="submit">Show</Button>
      </form>

      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No classes for {year} yet. Create the first one below.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">Class</th><th className="p-3">School</th><th className="p-3">Class teacher</th><th className="p-3 text-right">Pupils</th></tr></thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3 font-medium"><Link href={`/admin/classes/${c.id}`} className="text-primary hover:underline">{c.label}</Link></td>
                  <td className="p-3 text-muted-foreground">{campusName.get(c.campus_id)}</td>
                  <td className="p-3">{c.headTeacher ?? <span className="text-amber-700">Not assigned</span>}</td>
                  <td className="p-3 text-right">{c.pupils} / {c.capacity}{c.pupils >= c.capacity && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">full</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form action={createClassAction} className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5">
        <h2 className="text-base font-semibold text-primary sm:col-span-2 lg:col-span-5">Create a class</h2>
        <div className="space-y-2"><Label htmlFor="campus_id">School</Label>
          <select id="campus_id" name="campus_id" required className={field} defaultValue={mine[0]?.id}>{mine.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="grade_id">Class level</Label>
          <select id="grade_id" name="grade_id" required className={field} defaultValue="">
            <option value="" disabled>Choose…</option>{grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="stream">Stream <span className="text-muted-foreground">(optional)</span></Label><Input id="stream" name="stream" maxLength={30} placeholder="Blue, A, East…" /></div>
        <div className="space-y-2"><Label htmlFor="cyear">Year</Label><Input id="cyear" name="year" type="number" min={2000} max={2100} defaultValue={year} required /></div>
        <div className="space-y-2"><Label htmlFor="capacity">Capacity</Label><Input id="capacity" name="capacity" type="number" min={1} max={200} defaultValue={40} required /></div>
        <div className="sm:col-span-2 lg:col-span-5"><Button type="submit">Create class</Button></div>
      </form>
    </div>
  );
}
