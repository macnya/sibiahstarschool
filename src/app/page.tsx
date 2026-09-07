
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InfoCard } from '@/components/shared/info-card';
import { EducationTimeline } from '@/components/shared/education-timeline';

// Content on this page is admin-editable via /admin/content/home and
// stored in Supabase, so it must be fetched fresh on every request
// rather than baked into a static build-time page.
export const dynamic = 'force-dynamic';
import { Lightbulb, Bus, Award, ShieldCheck, Music, Globe, CalendarDays, Newspaper } from 'lucide-react';
import { getPageContent } from '@/lib/site-content/queries';

// Links/icons for the repeatable sections below are structural and stay
// fixed in code; admins edit the title/description text via
// /admin/content/home.
const LEVEL_LINKS = ['/curriculum#preschool', '/curriculum#primary', '/curriculum#junior-secondary'];
const HIGHLIGHT_ICONS = [
  <Lightbulb key="facilities" className="h-12 w-12 text-accent mb-4" />,
  <Bus key="transport" className="h-12 w-12 text-accent mb-4" />,
  <Award key="academics" className="h-12 w-12 text-accent mb-4" />,
  <ShieldCheck key="character" className="h-12 w-12 text-accent mb-4" />,
];
const COCURRICULAR_ICONS = [
  <Music key="music" className="h-8 w-8" />,
  <Globe key="scout" className="h-8 w-8" />,
];

export default async function HomePage() {
  const content = await getPageContent('home');

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-blue-700 text-primary-foreground py-20 md:py-32">
        <div className="absolute inset-0">
            <Image 
              src={content.heroImage.url} 
              alt="School campus background" 
              fill
              style={{ objectFit: "cover" }}
              className="opacity-20"
              priority // Good to add for LCP images
            />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-accent font-semibold text-sm tracking-wide mb-4">
            {content.heroEyebrow}
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            {content.hero.title} <span className="text-accent">{content.hero.highlight}</span> School
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl">
            {content.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/admissions">Apply Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* School Levels Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">{content.levelsHeading}</h2>
          <EducationTimeline stages={content.levels} links={LEVEL_LINKS} />
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">{content.highlightsHeading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.highlights.map((item, i) => (
              <div key={item.title} className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md">
                {HIGHLIGHT_ICONS[i] ?? HIGHLIGHT_ICONS[0]}
                <h3 className="text-xl font-semibold text-primary mb-2">{item.title}</h3>
                <p className="text-foreground/80 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Co-curricular Activities */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">{content.cocurricularHeading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.cocurricular.map((item, i) => (
              <InfoCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={COCURRICULAR_ICONS[i] ?? COCURRICULAR_ICONS[0]}
                linkHref="/curriculum#extracurricular"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action / Quick Links */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-6">{content.getInvolvedHeading}</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
            {content.getInvolvedText}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/events"><CalendarDays className="mr-2 h-5 w-5"/> Upcoming Events</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/blog"><Newspaper className="mr-2 h-5 w-5"/> School Blog</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
