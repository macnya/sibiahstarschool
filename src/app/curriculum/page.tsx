import { PageHeader } from '@/components/shared/page-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Users, Award, Music, Globe, Palette, Dumbbell, Brain } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/site-content/queries';
import type { CurriculumLevel } from '@/lib/site-content/defaults';

// Content on this page is admin-editable via /admin/content/curriculum
// and stored in Supabase, so it must be fetched fresh on every request
// rather than baked into a static build-time page.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Curriculum',
  description: 'Explore the comprehensive curriculum at Sibiah Star School, from Pre-school to Junior Secondary, including our enriching extracurricular activities.',
};

// Icon/id are structural (id is tied to page anchors like #preschool),
// so they stay fixed in code — the level's title/description/key areas
// and photo are admin-editable.
const LEVEL_VISUALS: Record<
  keyof CurriculumRow,
  { id: string; icon: React.ReactNode }
> = {
  preschool: { id: 'preschool', icon: <Users className="h-8 w-8 text-accent" /> },
  primary: { id: 'primary', icon: <BookOpen className="h-8 w-8 text-accent" /> },
  juniorSecondary: { id: 'junior-secondary', icon: <Award className="h-8 w-8 text-accent" /> },
};

type CurriculumRow = { preschool: CurriculumLevel; primary: CurriculumLevel; juniorSecondary: CurriculumLevel };

const EXTRACURRICULAR_ICONS = [
  <Music key="music" className="h-6 w-6 text-primary" />,
  <Globe key="scout" className="h-6 w-6 text-primary" />,
  <Palette key="art" className="h-6 w-6 text-primary" />,
  <Dumbbell key="sports" className="h-6 w-6 text-primary" />,
  <Brain key="debate" className="h-6 w-6 text-primary" />,
];

export default async function CurriculumPage() {
  const content = await getPageContent('curriculum');
  const levelEntries = Object.entries(content.levels) as [keyof CurriculumRow, CurriculumLevel][];

  return (
    <div>
      <PageHeader
        eyebrow={content.header.eyebrow}
        title={content.header.title}
        subtitle={content.header.subtitle}
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">{content.levelsHeading}</h2>
          <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto" defaultValue="preschool">
            {levelEntries.map(([key, level]) => {
              const visual = LEVEL_VISUALS[key];
              return (
                <AccordionItem value={visual.id} key={visual.id} className="mb-4 bg-card border-t-4 border-accent rounded-md overflow-hidden">
                  <AccordionTrigger className="p-6 text-xl font-semibold text-primary hover:bg-secondary/50 transition-colors data-[state=open]:bg-secondary/50">
                    <div className="flex items-center space-x-3">
                      {visual.icon}
                      <span>{level.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-card">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div>
                        <p className="text-foreground/80 mb-4 leading-relaxed">{level.description}</p>
                        <h4 className="font-semibold text-primary mb-2">Key Learning Areas:</h4>
                        <ul className="list-disc list-inside space-y-1 text-foreground/80 text-sm">
                          {level.keyAreas.map((area) => <li key={area}>{area}</li>)}
                        </ul>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <Image
                          src={level.imageUrl}
                          alt={level.title}
                          width={500}
                          height={300}
                          className="rounded-md object-cover"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </section>

      <section id="extracurricular" className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">{content.extracurricularHeading}</h2>
          <p className="text-center text-foreground/80 max-w-2xl mx-auto mb-10">
            {content.extracurricularIntro}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.extracurricular.map((activity, i) => (
              <div key={activity.name} className="bg-card border-t-4 border-accent rounded-md p-6 flex flex-col items-start">
                <div className="p-3 rounded-full bg-accent/15 mb-4">
                  {EXTRACURRICULAR_ICONS[i % EXTRACURRICULAR_ICONS.length]}
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">{activity.name}</h3>
                <p className="text-foreground/80 text-sm leading-relaxed">{activity.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">{content.approachHeading}</h2>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                {content.approachText}
            </p>
        </div>
      </section>
    </div>
  );
}
