import Link from 'next/link';
import type { Metadata } from 'next';
import { MapPin, Phone, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getActiveCampusesWithGrades, gradeRange } from '@/lib/campuses/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Schools',
  description: 'Our schools and campuses — from pre-school to Grade 9 — and how to apply to each.',
};

export default async function SchoolsPage() {
  const campuses = await getActiveCampusesWithGrades();

  return (
    <div>
      <PageHeader eyebrow="Our family of schools" title="Our Schools" subtitle="Each school shares the same values, leadership and standards." />
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {campuses.length === 0 ? (
            <p className="text-center text-muted-foreground">Our school list is being updated. Please check back soon.</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {campuses.map((c) => (
                <Card key={c.id} className="flex flex-col overflow-hidden">
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
                    <GraduationCap className="h-14 w-14 opacity-80" />
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-4 p-6">
                    <div>
                      <h2 className="text-2xl font-bold text-primary">{c.name}</h2>
                      {c.tagline && <p className="text-muted-foreground">{c.tagline}</p>}
                    </div>
                    <p className="text-sm"><strong>Classes:</strong> {gradeRange(c.grades)}</p>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      {(c.town || c.address) && (
                        <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{[c.address, c.town].filter(Boolean).join(', ')}</p>
                      )}
                      {c.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />{c.phone}</p>}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-3 pt-2">
                      <Button asChild variant="outline"><Link href={`/schools/${c.slug}`}>About this school</Link></Button>
                      {c.admissions_open ? (
                        <Button asChild><Link href={`/admissions/apply?school=${c.slug}`}>Apply now</Link></Button>
                      ) : (
                        <span className="self-center text-sm text-muted-foreground">Applications closed</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
