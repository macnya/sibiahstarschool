import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FillImage, isRealImage } from '@/components/site/safe-image';
import { HeroVideo } from '@/components/home/hero-video';

interface HeroProps { eyebrow: string; title: string; highlight: string; subtitle: string; imageUrl?: string }

export function Hero({ eyebrow, title, highlight, subtitle, imageUrl }: HeroProps) {
  const photo = isRealImage(imageUrl);
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground" aria-labelledby="hero-title">
      {photo && <FillImage src={imageUrl} alt="" priority sizes="100vw" className="object-cover opacity-50" />}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/75 to-primary" aria-hidden="true" />
      <div className="star-pattern absolute inset-0" aria-hidden="true" />
      <HeroVideo />

      <div className="container relative mx-auto flex min-h-[78vh] flex-col justify-center px-4 py-24 sm:px-6 lg:min-h-[88vh] lg:px-8">
        <p className="eyebrow mb-5">{eyebrow}</p>
        <h1 id="hero-title" className="display-title max-w-5xl text-5xl uppercase leading-[1.03] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          {title}
          <span className="block text-accent">{highlight} School</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary-foreground/85 md:text-xl">{subtitle}</p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Button asChild size="lg" className="bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg hover:bg-accent/90">
            <Link href="/admissions/apply">Apply online</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/60 bg-transparent px-8 text-base font-semibold text-white hover:bg-white hover:text-primary">
            <Link href="/schools">Explore our schools</Link>
          </Button>
        </div>
      </div>

      <a href="#welcome" aria-label="Scroll down to learn more" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-accent motion-safe:animate-bounce md:block">
        <ChevronDown className="h-8 w-8" />
      </a>
    </section>
  );
}
