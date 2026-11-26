import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAdminContext } from '@/lib/admissions/admin-queries';
import { PrintButton } from '@/components/fees/print-button';
import { ReportCard } from '@/components/exams/report-card';
import type { ReportCardData } from '@/lib/exams/types';

export const dynamic = 'force-dynamic';

export default async function PrintReportsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ class?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const ctx = await getAdminContext();
  const ok = sp.class && /^[0-9a-f-]{36}$/i.test(sp.class);
  const { data } = ok ? await ctx.supabase.rpc('class_report_cards', { p_exam: id, p_class: sp.class }) : { data: [] };
  const cards = ((data ?? []) as (ReportCardData | null)[]).filter((c): c is ReportCardData => Boolean(c));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/exams/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Exam</Link>
        <PrintButton label={`Print ${cards.length} report cards`} />
      </div>
      {cards.length === 0 ? <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No pupils in this class.</p> : cards.map((c) => <ReportCard key={c.student.id} data={c} />)}
    </div>
  );
}
