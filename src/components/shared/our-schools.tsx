import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveCampusesWithGrades, gradeRange } from '@/lib/campuses/queries';

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** "Our schools" band for the home page. Lists every active campus from the database. */
export async function OurSchools() {
  const campuses = await getActiveCampusesWithGrades();
  if (campuses.length === 0) return null;

  return (
    <section className="section-pad bg-secondary/40" aria-labelledby="schools-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="eyebrow mb-3">One family of schools</p>
          <h2 id="schools-title" className="display-title text-4xl text-primary md:text-5xl">Find your school</h2>
          <p className="mt-4 text-lg text-foreground/70">Pre-school to Grade 9, with the same values and standards at every campus. Apply to any of our schools online.</p>
        </div>
        <div className="grid justify-center gap-8 md:grid-cols-2 lg:grid-cols-3">
          {campuses.map((c) => (
            <article key={c.id} className="reveal group flex flex-col overflow-hidden rounded-lg bg-card shadow-lg transition-shadow hover:shadow-2xl">
              <div className="star-pattern relative flex h-40 items-end bg-gradient-to-br from-primary to-blue-800 p-5 text-primary-foreground">
                <span className="display-title absolute right-5 top-3 text-6xl text-accent/80" aria-hidden="true">{initials(c.name)}</span>
                <p className="eyebrow">{gradeRange(c.grades)}</p>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="display-title text-2xl text-primary">{c.name}</h3>
                {c.tagline && <p className="mt-1 text-muted-foreground">{c.tagline}</p>}
                {(c.town || c.address) && (
                  <p className="mt-4 flex items-start gap-2 text-sm text-foreground/70"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />{[c.address, c.town].filter(Boolean).join(', ')}</p>
                )}
                <div className="mt-auto flex flex-wrap gap-3 pt-6">
                  <Button asChild variant="outline" size="sm"><Link href={`/schools/${c.slug}`}>Learn more</Link></Button>
                  {c.admissions_open && <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link href={`/admissions/apply?school=${c.slug}`}>Apply now</Link></Button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
