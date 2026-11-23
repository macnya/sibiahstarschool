import Link from 'next/link';
import { ArrowUpRight, BookOpen, Building2, CalendarDays, HeartHandshake, Images, Trophy } from 'lucide-react';
import { FillImage } from '@/components/site/safe-image';

interface Tile { href: string; title: string; text: string; icon: typeof BookOpen }

/** A mosaic of the places visitors most often want to go — with real photos from the Gallery when there are some. */
export function ExploreMosaic({ images, cocurricularTitle }: { images: string[]; cocurricularTitle?: string }) {
  const tiles: Tile[] = [
    { href: '/curriculum', title: 'Curriculum', text: 'How our children learn', icon: BookOpen },
    { href: '/facilities', title: 'Facilities', text: 'Classrooms, play and transport', icon: Building2 },
    { href: '/curriculum#extracurricular', title: cocurricularTitle ?? 'Co-curricular', text: 'Music, sport and clubs', icon: Trophy },
    { href: '/events', title: 'Events', text: 'What is happening next', icon: CalendarDays },
    { href: '/gallery', title: 'Gallery', text: 'Moments from school life', icon: Images },
    { href: '/scholarships', title: 'Scholarships', text: 'Support for deserving learners', icon: HeartHandshake },
  ];
  return (
    <section className="section-pad bg-secondary/40" aria-labelledby="explore-title">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="eyebrow mb-3">Life at our schools</p>
          <h2 id="explore-title" className="display-title text-4xl text-primary md:text-5xl">Come and explore</h2>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
          {tiles.map((t, i) => {
            const image = images[i];
            return (
              <li key={t.href} className="reveal">
                <Link href={t.href} className="group relative block aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-primary to-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {image ? (
                    <FillImage src={image} alt="" sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <>
                      <div className="star-pattern absolute inset-0" aria-hidden="true" />
                      <t.icon className="absolute right-4 top-4 h-14 w-14 text-accent/30 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-primary-foreground md:p-6">
                    <div>
                      <p className="display-title text-xl md:text-2xl">{t.title}</p>
                      <p className="hidden text-sm text-primary-foreground/80 sm:block">{t.text}</p>
                    </div>
                    <ArrowUpRight className="h-6 w-6 shrink-0 text-accent transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
