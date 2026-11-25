import { StatementImport } from '@/components/fees/statement-import';
import { getCampusesAndGrades, requireAdmissionsStaff } from '@/lib/admissions/admin-queries';

export const dynamic = 'force-dynamic';

export default async function ImportStatementPage() {
  const ctx = await requireAdmissionsStaff();
  const { campuses } = await getCampusesAndGrades();
  const mine = (ctx.campusId ? campuses.filter((c) => c.id === ctx.campusId) : campuses.filter((c) => c.is_active)).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">Import a KCB, bank or M-Pesa statement</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Most parents pay through KCB Lipa Karo, which does not notify this system by itself. Download the collections report from KCB (or your bank / M-Pesa portal)
          as CSV, paste or choose it here, and every payment is matched to the right child by the account number the parent typed.
        </p>
      </div>
      {mine.length === 0 ? <p className="text-muted-foreground">Add a school first.</p> : <StatementImport campuses={mine} />}
    </div>
  );
}
