import type { Metadata } from 'next';
import Link from 'next/link';
import { LogOut, Users } from 'lucide-react';
import { portalSignOut } from '@/app/portal-actions';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { classLabel } from '@/lib/classes/queries-shared';
import { requireTeacher } from '@/lib/portal/context';
import type { ClassRow, ClassTeacherRow, GradeLevelRow } from '@/lib/supabase/types';

export const metadata: Metadata = { title: 'My classes', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const { supabase, profile, user } = await requireTeacher();
  const { data: mine } = await supabase.from('class_teachers').select('*').eq('teacher_id', user.id);
  const links = (mine ?? []) as ClassTeacherRow[];
  const ids = links.map((l) => l.class_id);
  const [{ data: cls }, { data: grades }, { data: pupils }] = await Promise.all([
    ids.length ? supabase.from('classes').select('*').in('id', ids) : Promise.resolve({ data: [] }),
    supabase.from('grade_levels').select('*').order('sort_order'),
    ids.length ? supabase.from('students').select('class_id').in('class_id', ids).limit(5000) : Promise.resolve({ data: [] }),
  ]);
  const gradeList = (grades ?? []) as GradeLevelRow[];
  const gradeName = new Map(gradeList.map((g) => [g.id, g.name]));
  const counts = new Map<string, number>();
  for (const r of (pupils ?? []) as { class_id: string }[]) counts.set(r.class_id, (counts.get(r.class_id) ?? 0) + 1);
  const classes = ((cls ?? []) as ClassRow[]).sort((a, b) => b.year - a.year || gradeList.findIndex((g) => g.id === a.grade_id) - gradeList.findIndex((g) => g.id === b.grade_id));

  return (
    <div>
      <PageHeader eyebrow="Teacher Portal" title={`Hello, ${(profile.full_name ?? 'teacher').split(' ')[0]}`} subtitle="Your classes this year." className="py-10 md:py-14" />
      <section className="section-pad">
        <div className="container mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end"><form action={portalSignOut}><input type="hidden" name="to" value="teacher" /><Button type="submit" variant="outline" size="sm"><LogOut className="mr-1.5 h-4 w-4" />Sign out</Button></form></div>
          {classes.length === 0 ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">You have not been given a class yet. The school office will add you.</p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {classes.map((c) => {
                const link = links.find((l) => l.class_id === c.id);
                return (
                  <Link key={c.id} href={`/teacher-portal/class/${c.id}`} className="group rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.year}</p>
                    <h2 className="display-title text-2xl text-primary group-hover:underline">{classLabel(gradeName.get(c.grade_id), c.stream)}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-accent" aria-hidden="true" />{counts.get(c.id) ?? 0} pupils</p>
                    <p className="mt-1 text-sm text-muted-foreground">{link?.is_class_teacher ? 'Class teacher' : 'Subject teacher'}{link?.subject ? ` · ${link.subject}` : ''}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
