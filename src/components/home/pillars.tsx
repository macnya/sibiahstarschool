import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FillImage } from '@/components/site/safe-image';

interface Level { title: string; description: string }

const STATEMENTS = ['Where curiosity begins', 'Where confidence takes root', 'Where futures take shape'];
const LINKS = ['/curriculum#preschool', '/curriculum#primary', '/curriculum#junior-secondary'];
const TONES = ['from-primary to-blue-800', 'from-blue-900 to-primary', 'from-primary to-indigo-900'];

/**
 * The child's journey — one big panel per stage. Photos come from the Gallery in the admin panel;
 * without them each panel stays handsome on its own.
 */
export function Pillars({ heading, levels, images }: { heading: string; levels: Level[]; images: string[] }) {
  return (
    <section aria-labelledby="journey-title">
      <div className="container mx-auto px-4 pb-12 pt-20 text-center sm:px-6 lg:px-8">
        <p className="eyebrow mb-3">The journey</p>
        <h2 id="journey-title" className="display-title text-4xl text-primary md:text-5xl">{heading}</h2>
      </div>
      {levels.map((level, i) => {
        const image = images[i];
        const flip = i % 2 === 1;
        return (
          <article key={level.title} className={`relative isolate overflow-hidden bg-gradient-to-br ${TONES[i % TONES.length]} text-primary-foreground`}>
            {image && <FillImage src={image} alt="" sizes="100vw" className="object-cover opacity-25" />}
            <div className="star-pattern absolute inset-0" aria-hidden="true" />
            <div className="container relative mx-auto grid min-h-[62vh] items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
              <div className={`reveal ${flip ? 'lg:order-2' : ''}`}>
                <p className="display-title text-7xl leading-none text-accent/90 md:text-8xl" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>
                <p className="eyebrow mt-4">{level.title}</p>
                <h3 className="display-title mt-3 text-4xl leading-tight md:text-5xl">{STATEMENTS[i % STATEMENTS.length]}</h3>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-primary-foreground/85">{level.description}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Button asChild size="lg" className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"><Link href={LINKS[i % LINKS.length]}>Explore this stage</Link></Button>
                  <Button asChild size="lg" variant="outline" className="border-white/60 bg-transparent text-white hover:bg-white hover:text-primary"><Link href="/admissions/apply">Apply</Link></Button>
                </div>
              </div>
              <div className={`reveal hidden lg:flex ${flip ? 'lg:order-1' : ''} items-center justify-center`} aria-hidden="true">
                {image ? (
                  <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-lg border-4 border-accent shadow-2xl"><FillImage src={image} alt="" sizes="40vw" className="object-cover" /></div>
                ) : (
                  <div className="relative flex h-80 w-80 items-center justify-center rounded-full border-2 border-accent/40">
                    <div className="flex h-56 w-56 items-center justify-center rounded-full border-2 border-accent/60"><Star className="h-24 w-24 fill-accent text-accent" /></div>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
