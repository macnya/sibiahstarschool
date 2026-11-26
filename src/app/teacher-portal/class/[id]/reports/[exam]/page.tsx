import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PrintButton } from '@/components/fees/print-button';
import { ReportCard } from '@/components/exams/report-card';
import { requireTeacher } from '@/lib/portal/context';
import type { ReportCardData } from '@/lib/exams/types';

export const metadata: Metadata = { title: 'Report cards', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TeacherReportsPage({ params }: { params: Promise<{ id: string; exam: string }> }) {
  const { id, exam } = await params;
  const { supabase } = await requireTeacher();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(exam)) notFound();
  const { data } = await supabase.rpc('class_report_cards', { p_exam: exam, p_class: id });
  const cards = ((data ?? []) as (ReportCardData | null)[]).filter((c): c is ReportCardData => Boolean(c));
  if (cards.length === 0) notFound();
  return (
    <div className="container mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/teacher-portal/class/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Class list</Link>
        <PrintButton label={`Print ${cards.length} report cards`} />
      </div>
      {cards.map((c) => <ReportCard key={c.student.id} data={c} />)}
    </div>
  );
}
