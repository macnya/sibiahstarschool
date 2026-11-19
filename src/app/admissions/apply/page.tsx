import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { ApplicationForm, type ApplyCampus } from '@/components/admissions/application-form';
import { getActiveCampusesWithGrades } from '@/lib/campuses/queries';

// Schools and classes are managed in the admin panel, so always read them fresh.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Apply Online',
  description: 'Apply for a place at our schools — Playgroup to Grade 9 — completely online.',
};

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ school?: string }> }) {
  const { school } = await searchParams;
  const campuses = await getActiveCampusesWithGrades();

  const options: ApplyCampus[] = campuses.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    admissionsOpen: c.admissions_open,
    grades: c.grades.map((g) => ({ id: g.id, name: g.name, stage: g.stage })),
  }));
  const requested = options.find((c) => c.slug === school && c.admissionsOpen);
  const anyOpen = options.some((c) => c.admissionsOpen);

  return (
    <div>
      <PageHeader
        eyebrow="Admissions"
        title="Apply Online"
        subtitle="Complete the application below. It takes about five minutes, and you can track it with your reference number."
      />
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {anyOpen ? (
            <ApplicationForm campuses={options} defaultCampusId={requested?.id} />
          ) : (
            <div className="mx-auto max-w-xl rounded-lg border border-dashed p-10 text-center">
              <h2 className="text-xl font-semibold text-primary">Online applications are closed right now</h2>
              <p className="mt-2 text-muted-foreground">
                Please contact the school office, or check back soon. We will open applications again shortly.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
