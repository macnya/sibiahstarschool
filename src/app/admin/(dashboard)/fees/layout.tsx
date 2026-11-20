import { FeesTabs } from '@/components/fees/fees-tabs';
import { requireAdmissionsStaff } from '@/lib/admissions/admin-queries';

export default async function FeesLayout({ children }: { children: React.ReactNode }) {
  await requireAdmissionsStaff();
  return (
    <div>
      <div className="mb-4 print:hidden">
        <h1 className="text-2xl font-semibold text-primary">Fees</h1>
        <p className="text-sm text-muted-foreground">Invoices, payments, balances and M-Pesa for every child.</p>
      </div>
      <div className="print:hidden"><FeesTabs /></div>
      {children}
    </div>
  );
}
