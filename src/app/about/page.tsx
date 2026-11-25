import { PageHeader } from '@/components/shared/page-header';
import Image from 'next/image';
import { Target, Eye, Heart } from 'lucide-react';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/site-content/queries';

// Content on this page is admin-editable via /admin/content/about and
// stored in Supabase, so it must be fetched fresh on every request
// rather than baked into a static build-time page.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Sibiah Star School\'s history, mission, vision, values, and our dedicated team.',
};

export default async function AboutPage() {
  const content = await getPageContent('about');

  return (
    <div>
      <PageHeader
        eyebrow={content.header.eyebrow}
        title={content.header.title}
        subtitle={content.header.subtitle}
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">{content.story.heading}</h2>
              <p className="text-foreground/80 mb-4 leading-relaxed">
                {content.story.paragraph1}
              </p>
              <p className="text-foreground/80 leading-relaxed">
                {content.story.paragraph2}
              </p>
            </div>
            <div>
              <Image
                src={content.story.imageUrl}
                alt="School building or happy students"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <Target className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">{content.mission.heading}</h3>
              <p className="text-foreground/80 text-sm">
                {content.mission.text}
              </p>
            </div>
            <div className="p-6">
              <Eye className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">{content.vision.heading}</h3>
              <p className="text-foreground/80 text-sm">
                {content.vision.text}
              </p>
            </div>
            <div className="p-6">
              <Heart className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">{content.values.heading}</h3>
              <ul className="text-foreground/80 text-sm space-y-1">
                {content.values.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">{content.director.heading}</h2>
          <div className="max-w-3xl mx-auto bg-card border-t-4 border-accent rounded-md p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              <Image
                src={content.director.imageUrl}
                alt="Principal's Portrait"
                width={150}
                height={150}
                className="rounded-full object-cover flex-shrink-0"
              />
              <div>
                <h3 className="text-xl font-semibold text-primary">{content.director.name}</h3>
                <p className="text-accent font-medium">{content.director.title}</p>
              </div>
            </div>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              &ldquo;{content.director.quote1}&rdquo;
            </p>
            <p className="text-foreground/80 leading-relaxed">
              &ldquo;{content.director.quote2}&rdquo;
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-10">{content.team.heading}</h2>
          <p className="text-center text-foreground/80 max-w-2xl mx-auto mb-8">
            {content.team.intro}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {content.team.members.map((staff) => (
              <div key={staff.name} className="text-center bg-card border-t-4 border-accent rounded-md p-4">
                <Image
                  src={staff.imageUrl}
                  alt={staff.name}
                  width={120}
                  height={120}
                  className="rounded-full mx-auto mb-3 object-cover"
                />
                <h4 className="font-semibold text-primary">{staff.name}</h4>
                <p className="text-xs text-accent">{staff.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
