import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { MarksPanel } from '@/components/exams/marks-panel';
import { requireTeacher } from '@/lib/portal/context';

export const metadata: Metadata = { title: 'Enter marks', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TeacherMarksPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ exam?: string; area?: string; error?: string; ok?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireTeacher();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: c } = await supabase.from('classes').select('id').eq('id', id).maybeSingle();
  if (!c) notFound();
  return (
    <div>
      <PageHeader eyebrow="Exams" title="Enter marks" className="py-10 md:py-14" />
      <section className="section-pad">
        <div className="container mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
          <Link href={`/teacher-portal/class/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Class list</Link>
          {sp.error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{sp.error}</p>}
          {sp.ok && <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{sp.ok}</p>}
          <MarksPanel supabase={supabase} classId={id} examId={sp.exam} areaId={sp.area} returnTo="teacher" isStaff={false} />
        </div>
      </section>
    </div>
  );
}
