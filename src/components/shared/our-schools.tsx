import Link from 'next/link';
import { GraduationCap, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveCampusesWithGrades, gradeRange } from '@/lib/campuses/queries';

/** "Our schools" band for the home page. Lists every active campus from the database. */
export async function OurSchools() {
  const campuses = await getActiveCampusesWithGrades();
  if (campuses.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-accent font-semibold text-sm tracking-wide mb-2">One family of schools</p>
          <h2 className="text-3xl md:text-4xl font-bold text-primary">Our Schools</h2>
          <p className="mt-3 text-foreground/70 max-w-2xl mx-auto">
            Pre-school to Grade 9, with the same values and standards at every campus. Apply to any of our schools online.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center">
          {campuses.map((c) => (
            <div key={c.id} className="bg-card rounded-lg border-t-4 border-accent p-6 shadow-sm flex flex-col">
              <GraduationCap className="h-9 w-9 text-accent mb-3" />
              <h3 className="text-xl font-bold text-primary">{c.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{gradeRange(c.grades)}</p>
              {(c.town || c.address) && (
                <p className="mt-3 flex items-start gap-2 text-sm text-foreground/70">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  {[c.address, c.town].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3 pt-2 mt-auto">
                <Button asChild variant="outline" size="sm"><Link href={`/schools/${c.slug}`}>Learn more</Link></Button>
                {c.admissions_open && (
                  <Button asChild size="sm"><Link href={`/admissions/apply?school=${c.slug}`}>Apply now</Link></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
