import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PrintButton } from '@/components/fees/print-button';
import { ReportCard } from '@/components/exams/report-card';
import { requireParent } from '@/lib/portal/context';
import type { ReportCardData } from '@/lib/exams/types';

export const metadata: Metadata = { title: 'Report card', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ParentReportPage({ params }: { params: Promise<{ id: string; exam: string }> }) {
  const { id, exam } = await params;
  const { supabase } = await requireParent();
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[0-9a-f-]{36}$/i.test(exam)) notFound();
  const { data } = await supabase.rpc('report_card', { p_exam: exam, p_student: id });
  const card = data as ReportCardData | null;
  if (!card) notFound();
  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/parent-portal/child/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        <PrintButton label="Print report card" />
      </div>
      <ReportCard data={card} />
    </div>
  );
}
