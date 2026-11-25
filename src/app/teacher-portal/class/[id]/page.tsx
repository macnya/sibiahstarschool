import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { PrintButton } from '@/components/fees/print-button';
import { classLabel } from '@/lib/classes/queries-shared';
import { requireTeacher } from '@/lib/portal/context';
import type { ClassRow, GradeLevelRow, StudentRow } from '@/lib/supabase/types';

export const metadata: Metadata = { title: 'Class list', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function TeacherClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireTeacher();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Row Level Security returns the class only if this teacher is on it.
  const { data: cls } = await supabase.from('classes').select('*').eq('id', id).maybeSingle();
  if (!cls) notFound();
  const c = cls as ClassRow;
  const [{ data: grade }, { data: roster }] = await Promise.all([
    supabase.from('grade_levels').select('*').eq('id', c.grade_id).maybeSingle(),
    supabase.from('students').select('*').eq('class_id', id).order('first_name'),
  ]);
  const title = classLabel((grade as GradeLevelRow | null)?.name, c.stream);
  const pupils = (roster ?? []) as StudentRow[];

  return (
    <div>
      <div className="print:hidden"><PageHeader eyebrow="Teacher Portal" title={title} subtitle={`${c.year} · ${pupils.length} pupils`} className="py-10 md:py-14" /></div>
      <section className="section-pad">
        <div className="container mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <Link href="/teacher-portal/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />My classes</Link>
            <PrintButton />
          </div>
          <h2 className="hidden text-xl font-bold print:block">{title} · {c.year} class list</h2>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">#</th><th className="p-3">Adm. no.</th><th className="p-3">Pupil</th><th className="p-3">Parent / guardian</th><th className="p-3">Phone</th></tr></thead>
              <tbody>
                {pupils.map((s, i) => (
                  <tr key={s.id} className="border-t">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-mono text-xs">{s.admission_number}</td>
                    <td className="p-3 font-medium">{s.first_name} {s.middle_name} {s.last_name}</td>
                    <td className="p-3">{s.guardian_name}</td>
                    <td className="p-3"><a href={`tel:${s.guardian_phone}`} className="text-primary hover:underline">{s.guardian_phone}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground print:hidden">Parent phone numbers are for school business only.</p>
        </div>
      </section>
    </div>
  );
}
