import { getCampusesAndGrades, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { getBalances } from '@/lib/fees/admin-queries';

export const dynamic = 'force-dynamic';

function cell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  // Stop spreadsheet formula injection from parent-supplied text.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Everyone who owes fees, as a CSV that opens in Excel. Respects the same filters as the page. */
export async function GET(request: Request) {
  await requireAdmissionsStaff();
  const sp = new URL(request.url).searchParams;
  const { campuses, grades } = await getCampusesAndGrades();
  const rows = await getBalances({ campusId: sp.get('campus') || undefined, gradeId: sp.get('grade') || undefined, q: sp.get('q') || undefined, onlyOwing: true });
  const min = sp.get('min') ? Math.round(Number(sp.get('min')) * 100) : 1;
  const campusName = new Map(campuses.map((c) => [c.id, c.name]));
  const gradeName = new Map(grades.map((g) => [g.id, g.name]));
  const kes = (cents: number) => (cents / 100).toFixed(2);

  const header = ['Admission no.', 'Student', 'School', 'Class', 'Parent', 'Phone', 'Invoiced (KES)', 'Paid (KES)', 'Balance (KES)'];
  const lines = rows
    .filter((b) => b.balance >= (Number.isFinite(min) ? min : 1))
    .map((b) => [b.admission_number, `${b.first_name} ${b.last_name}`, campusName.get(b.campus_id), gradeName.get(b.grade_id), b.guardian_name, b.guardian_phone, kes(b.invoiced + b.adjustments), kes(b.paid), kes(b.balance)].map(cell).join(','));

  return new Response('\ufeff' + [header.map(cell).join(','), ...lines].join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fee-balances-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
