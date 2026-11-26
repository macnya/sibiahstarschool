import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { CommentsPanel } from '@/components/exams/comments-panel';
import { requireTeacher } from '@/lib/portal/context';

export const metadata: Metadata = { title: 'Report comments', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TeacherCommentsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ exam?: string; error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireTeacher();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: c } = await supabase.from('classes').select('id, campus_id').eq('id', id).maybeSingle();
  if (!c) notFound();
  const { data: exams } = await supabase.from('exams').select('id, name, term, year').eq('campus_id', (c as { campus_id: string }).campus_id).order('year', { ascending: false }).order('term', { ascending: false });
  const list = (exams ?? []) as { id: string; name: string; term: number; year: number }[];
  return (
    <div>
      <PageHeader eyebrow="Exams" title="Report comments" className="py-10 md:py-14" />
      <section className="section-pad">
        <div className="container mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
          <Link href={`/teacher-portal/class/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Class list</Link>
          {sp.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{sp.error}</p>}
          {sp.ok && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{sp.ok}</p>}
          <form className="flex flex-wrap items-end gap-2">
            <div><label htmlFor="exam" className="mb-1 block text-xs text-muted-foreground">Exam</label><select id="exam" name="exam" defaultValue={sp.exam ?? ''} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">Choose…</option>{list.map((e) => <option key={e.id} value={e.id}>{e.name} · Term {e.term} {e.year}</option>)}</select></div>
            <button className="h-10 rounded-md border px-4 text-sm" type="submit">Open</button>
          </form>
          {sp.exam && /^[0-9a-f-]{36}$/i.test(sp.exam) && <Link href={`/teacher-portal/class/${id}/reports/${sp.exam}`} className="inline-block text-sm text-primary underline">Preview and print this class’s report cards</Link>}
          {sp.exam && /^[0-9a-f-]{36}$/i.test(sp.exam) && <CommentsPanel supabase={supabase} classId={id} examId={sp.exam} returnTo="teacher" isStaff={false} />}
        </div>
      </section>
    </div>
  );
}
