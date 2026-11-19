import Link from 'next/link';
import { Search } from 'lucide-react';
import { getApplications, getCampusesAndGrades, getStatusCounts, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { ALL_STATUSES, STATUS_LABEL, STATUS_TONE, formatDate } from '@/lib/admissions/constants';
import type { ApplicationStatus } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const dynamic = 'force-dynamic';

type Search = { campus?: string; status?: string; grade?: string; q?: string; year?: string };

export default async function AdmissionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const ctx = await requireAdmissionsStaff();
  const { campuses, grades } = await getCampusesAndGrades();

  const status = ALL_STATUSES.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  const year = Number(sp.year) || undefined;
  const [applications, counts] = await Promise.all([
    getApplications({ campusId: sp.campus || undefined, status, gradeId: sp.grade || undefined, year, q: sp.q }),
    getStatusCounts({ campusId: sp.campus || undefined }),
  ]);

  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const gradeName = new Map(grades.map((g) => [g.id, g.name]));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const keep = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/admin/admissions?${qs}` : '/admin/admissions';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Admissions</h1>
        <p className="text-sm text-muted-foreground">
          Applications made on the website{ctx.campusId ? ' for your school' : ' for every school in the group'}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={keep({ status: undefined })} className={`rounded-full border px-3 py-1 text-sm ${!status ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
          All <span className="opacity-70">({total})</span>
        </Link>
        {ALL_STATUSES.filter((s) => counts[s]).map((s) => (
          <Link key={s} href={keep({ status: s })} className={`rounded-full px-3 py-1 text-sm ${status === s ? 'ring-2 ring-primary' : ''} ${STATUS_TONE[s]}`}>
            {STATUS_LABEL[s]} ({counts[s]})
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1 block text-xs text-muted-foreground">Search</label>
          <Input id="q" name="q" defaultValue={sp.q} placeholder="Child, parent, phone or reference" />
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
        {status && <input type="hidden" name="status" value={status} />}
        <Button type="submit"><Search className="mr-1.5 h-4 w-4" />Filter</Button>
        {(sp.q || sp.campus || sp.grade || status) && (
          <Button asChild variant="ghost"><Link href="/admin/admissions">Clear</Link></Button>
        )}
      </form>

      {applications.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No applications match. New online applications will appear here.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>School · class</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/admin/admissions/${a.id}`} className="font-medium text-primary hover:underline">
                      {a.student_first_name} {a.student_last_name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{a.reference}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {campusName.get(a.campus_id) ?? '—'}
                    <p className="text-xs text-muted-foreground">{gradeName.get(a.grade_id)} · {a.intake_year} T{a.intake_term}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.guardian_name}
                    <p className="text-xs text-muted-foreground">{a.guardian_phone}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(a.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {applications.length === 300 && <p className="text-xs text-muted-foreground">Showing the 300 most recent. Use the filters to narrow down.</p>}
    </div>
  );
}
