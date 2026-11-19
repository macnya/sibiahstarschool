import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { StatusLookup } from '@/components/admissions/status-lookup';

export const metadata: Metadata = {
  title: 'Track Your Application',
  description: 'Check the progress of your child’s admission application.',
};

export default function ApplicationStatusPage() {
  return (
    <div>
      <PageHeader eyebrow="Admissions" title="Track Your Application" subtitle="Enter your reference number and the phone number you applied with." />
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <StatusLookup />
        </div>
      </section>
    </div>
  );
}
