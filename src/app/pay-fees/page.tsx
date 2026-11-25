import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { PayFeesClient } from '@/components/fees/pay-fees-client';

export const metadata: Metadata = {
  title: 'Pay School Fees',
  description: 'Check your child’s fee balance and pay by M-Pesa.',
};

export default async function PayFeesPage({ searchParams }: { searchParams: Promise<{ adm?: string }> }) {
  const sp = await searchParams;
  return (
    <div>
      <PageHeader eyebrow="Parents" title="Pay School Fees" subtitle="See your child’s balance and pay by M-Pesa in a minute." />
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <PayFeesClient initialAdmission={typeof sp.adm === 'string' ? sp.adm.slice(0, 30) : ''} />
        </div>
      </section>
    </div>
  );
}
