import Link from 'next/link';
import { Search } from 'lucide-react';
import { getCampusesAndGrades, getStudents, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { formatDate } from '@/lib/admissions/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; campus?: string; grade?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireAdmissionsStaff();
  const { campuses, grades } = await getCampusesAndGrades();
  const students = await getStudents({ campusId: sp.campus || undefined, gradeId: sp.grade || undefined, q: sp.q });
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const gradeName = new Map(grades.map((g) => [g.id, g.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Students</h1>
        <p className="text-sm text-muted-foreground">Children enrolled through admissions. {students.length} shown.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs text-muted-foreground">Search</label>
          <Input id="q" name="q" defaultValue={sp.q} placeholder="Name, admission number, parent or phone" />
        </div>
        {!ctx.campusId && campuses.length > 1 && (
          <div>
            <label htmlFor="campus" className="mb-1 block text-xs text-muted-foreground">School</label>
            <select id="campus" name="campus" defaultValue={sp.campus ?? ''} className="h-10 rounded-md border bg-background px-3 text-sm">
              <option value="">All schools</option>
              {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="grade" className="mb-1 block text-xs text-muted-foreground">Class</label>
          <select id="grade" name="grade" defaultValue={sp.grade ?? ''} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="">All classes</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <Button type="submit"><Search className="mr-1.5 h-4 w-4" />Filter</Button>
        {(sp.q || sp.campus || sp.grade) && <Button asChild variant="ghost"><Link href="/admin/students">Clear</Link></Button>}
      </form>

      {students.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No students yet. Enrol an offered application and the child appears here.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Adm. no.</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>School · class</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.admission_number}</TableCell>
                  <TableCell className="font-medium">
                    {s.first_name} {s.middle_name} {s.last_name}
                    {s.status !== 'active' && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs capitalize">{s.status}</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {campusName.get(s.campus_id) ?? '—'}
                    <p className="text-xs text-muted-foreground">{gradeName.get(s.grade_id)}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.guardian_name}
                    <p className="text-xs text-muted-foreground">{s.guardian_phone}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(s.enrolled_on)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
