import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAdminContext, getCampusesAndGrades } from '@/lib/admissions/admin-queries';
import { classLabel } from '@/lib/classes/queries-shared';
import type { ExamRow } from '@/lib/exams/types';
import type { ClassRow } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
interface Prog { area_id: string; name: string; entered: number; pupils: number }

export default async function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getAdminContext();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: ex } = await ctx.supabase.from('exams').select('*').eq('id', id).maybeSingle();
  if (!ex) notFound();
  const e = ex as ExamRow;
  const { grades } = await getCampusesAndGrades();
  const gname = new Map(grades.map((g) => [g.id, g.name]));
  const order = new Map(grades.map((g, i) => [g.id, i]));
  const { data: cls } = await ctx.supabase.from('classes').select('*').eq('campus_id', e.campus_id).eq('year', e.year);
  const classes = ((cls ?? []) as ClassRow[]).sort((a, b) => (order.get(a.grade_id) ?? 0) - (order.get(b.grade_id) ?? 0) || a.stream.localeCompare(b.stream));
  const progress = await Promise.all(classes.map(async (c) => ({ c, p: ((await ctx.supabase.rpc('marks_progress', { p_exam: id, p_class: c.id })).data ?? []) as Prog[] })));

  return (
    <div className="space-y-6">
      <Link href="/admin/exams" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />All exams</Link>
      <div>
        <h1 className="text-2xl font-semibold text-primary">{e.name}</h1>
        <p className="text-sm text-muted-foreground">Term {e.term}, {e.year} · {e.is_published ? 'Published to parents' : 'Draft'}. Classes shown are the {e.year} classes.</p>
      </div>
      {classes.length === 0 ? <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No classes for {e.year}. Create them under Classes.</p> : (
        <ul className="space-y-4">
          {progress.map(({ c, p }) => {
            const label = classLabel(gname.get(c.grade_id), c.stream);
            const total = p.reduce((a, x) => a + x.pupils, 0), done = p.reduce((a, x) => a + x.entered, 0);
            return (
              <li key={c.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="font-semibold">{label}</h2><p className="text-xs text-muted-foreground">{total ? `${Math.round((done / total) * 100)}% of marks entered` : 'No pupils or learning areas yet'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline"><Link href={`/admin/exams/${id}/marks?class=${c.id}`}>Marks</Link></Button>
                    <Button asChild size="sm" variant="outline"><Link href={`/admin/exams/${id}/comments?class=${c.id}`}>Comments</Link></Button>
                    <Button asChild size="sm"><Link href={`/admin/exams/${id}/print?class=${c.id}`}>Report cards</Link></Button>
                  </div>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  {p.map((a) => <li key={a.area_id}><Link href={`/admin/exams/${id}/marks?class=${c.id}&area=${a.area_id}`} className={`inline-block rounded-full px-2.5 py-1 ${a.pupils > 0 && a.entered >= a.pupils ? 'bg-green-100 text-green-800' : a.entered > 0 ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}`}>{a.name} {a.entered}/{a.pupils}</Link></li>)}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
