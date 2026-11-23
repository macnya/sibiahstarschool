import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FillImage, isRealImage } from '@/components/site/safe-image';

/** The first two sentences of a longer paragraph. */
function lead(text: string) {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.slice(0, 2).join(' ');
}

interface Props { story: string; mission: string; imageUrl?: string }

export function Welcome({ story, mission, imageUrl }: Props) {
  const photo = isRealImage(imageUrl);
  return (
    <section id="welcome" className="section-pad scroll-mt-24" aria-labelledby="welcome-title">
      <div className="container mx-auto grid items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="reveal relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -bottom-4 -right-4 h-full w-full rounded-lg border-4 border-accent" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-primary star-pattern">
            {photo && <FillImage src={imageUrl} alt="Pupils and teachers of Sibiah Star School" sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />}
          </div>
        </div>
        <div className="reveal">
          <p className="eyebrow mb-3">Welcome</p>
          <h2 id="welcome-title" className="display-title text-4xl leading-tight text-primary md:text-5xl">Where every child is known, nurtured and challenged.</h2>
          <p className="mt-6 text-lg leading-relaxed text-foreground/80">{lead(story)}</p>
          <blockquote className="mt-6 border-l-4 border-accent pl-5 text-base italic leading-relaxed text-foreground/70">{mission}</blockquote>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg"><Link href="/about">Our story</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/schools">Find your school</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
