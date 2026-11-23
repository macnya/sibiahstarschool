import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StudentImport } from '@/components/admin/student-import';
import { getCampusesAndGrades, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';

export const dynamic = 'force-dynamic';

export default async function ImportStudentsPage() {
  const ctx = await requireAdmissionsStaff();
  const { campuses, grades } = await getCampusesAndGrades();
  const mine = ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active);

  const options = await Promise.all(
    mine.map(async (c) => {
      const { data } = await ctx.supabase.from('campus_grades').select('grade_id').eq('campus_id', c.id);
      const offered = new Set(((data ?? []) as { grade_id: string }[]).map((r) => r.grade_id));
      return { id: c.id, name: c.name, grades: grades.filter((g) => offered.has(g.id)).map((g) => ({ id: g.id, code: g.code, name: g.name })) };
    }),
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/students" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Students</Link>
      <div>
        <h1 className="text-2xl font-semibold text-primary">Import existing pupils</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Load the pupils already in your school from a spreadsheet — with their parents’ phone numbers and any fees owed — so parents can pay online and the fees module works for everyone.
        </p>
      </div>
      {options.length === 0 ? <p className="text-muted-foreground">Add a school first.</p> : <StudentImport campuses={options} />}
    </div>
  );
}
