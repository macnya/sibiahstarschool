import { requireAdmissionsStaff } from '@/lib/admissions/admin-queries';
import { TEMPLATE_CSV } from '@/lib/students/import-parse';

export const dynamic = 'force-dynamic';

/** A ready-to-fill example the school office can open in Excel. */
export async function GET() {
  await requireAdmissionsStaff();
  return new Response('\ufeff' + TEMPLATE_CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pupil-import-template.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
