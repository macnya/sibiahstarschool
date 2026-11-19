import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/admissions/constants';
import { getCampusBySlug } from '@/lib/campuses/queries';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campus = await getCampusBySlug(slug);
  return campus ? { title: campus.name, description: campus.tagline ?? `About ${campus.name}` } : { title: 'School not found' };
}

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campus = await getCampusBySlug(slug);
  if (!campus) notFound();

  return (
    <div>
      <PageHeader eyebrow="Our schools" title={campus.name} subtitle={campus.tagline ?? undefined} />
      <section className="py-12 md:py-16">
        <div className="container mx-auto grid gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-10 lg:col-span-2">
            {campus.description && (
              <div>
                <h2 className="mb-3 text-2xl font-bold text-primary">About {campus.name}</h2>
                <p className="whitespace-pre-line text-muted-foreground">{campus.description}</p>
              </div>
            )}
            <div>
              <h2 className="mb-4 text-2xl font-bold text-primary">Classes offered</h2>
              <div className="space-y-5">
                {STAGE_ORDER.map((stage) => {
                  const grades = campus.grades.filter((g) => g.stage === stage);
                  if (grades.length === 0) return null;
                  return (
                    <div key={stage}>
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">{STAGE_LABEL[stage]}</p>
                      <div className="flex flex-wrap gap-2">
                        {grades.map((g) => <Badge key={g.id} variant="secondary" className="px-3 py-1 text-sm">{g.name}</Badge>)}
                      </div>
                    </div>
                  );
                })}
                {campus.grades.length === 0 && <p className="text-muted-foreground">Classes will be announced soon.</p>}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-primary">Admissions</h3>
              {campus.admissions_open ? (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">Applications are open. Apply online in about five minutes.</p>
                  <Button asChild className="w-full"><Link href={`/admissions/apply?school=${campus.slug}`}>Apply now</Link></Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Online applications are closed for this school at the moment.</p>
              )}
              <Button asChild variant="link" className="mt-2 px-0"><Link href="/admissions/status">Track an application</Link></Button>
            </div>

            <div className="space-y-3 rounded-lg border bg-card p-6 text-sm">
              <h3 className="text-lg font-semibold text-primary">Contact</h3>
              {(campus.address || campus.town) && (
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{[campus.address, campus.town].filter(Boolean).join(', ')}</p>
              )}
              {campus.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-accent" />{campus.phone}</p>}
              {campus.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-accent" />{campus.email}</p>}
              {campus.map_url && (
                <a href={campus.map_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary underline">
                  <ExternalLink className="h-4 w-4" />View on map
                </a>
              )}
              {!campus.address && !campus.town && !campus.phone && !campus.email && (
                <p className="text-muted-foreground">Contact details coming soon.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
