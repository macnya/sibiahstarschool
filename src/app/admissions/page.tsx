import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Edit, ListChecks, MessageSquareHeart } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/site-content/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admissions',
  description: 'Learn about the admission process at Sibiah Star School, requirements for different levels, and access our AI Admission Guide.',
};

export default async function AdmissionsPage() {
  const content = await getPageContent('admissions');

  return (
    <div>
      <PageHeader
        eyebrow={content.header.eyebrow}
        title={content.header.title}
        subtitle={content.header.subtitle}
      />

      <section className="py-10 bg-accent/10 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-xl font-bold text-primary">Ready to apply?</h2>
            <p className="text-sm text-foreground/70">All applications are made online. It takes about five minutes.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href="/admissions/apply">Apply online</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/admissions/status">Track my application</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">{content.processHeading}</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            {content.steps.map((step, i) => (
              <div key={step.title} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xl font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-1">{step.title}</h3>
                  <p className="text-foreground/80">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">{content.requirementsHeading}</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {content.requirements.map((req) => (
              <div key={req.level} className="bg-card border-t-4 border-accent rounded-md p-6">
                <h3 className="text-primary text-xl font-semibold flex items-center mb-4">
                  <ListChecks className="mr-2 h-6 w-6 text-accent flex-shrink-0" /> {req.level}
                </h3>
                <ul className="space-y-2">
                  {req.items.map((item, index) => (
                    <li key={index} className="flex items-start text-foreground/80">
                      <CheckCircle className="h-4 w-4 mr-2 mt-1 text-accent flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto p-8 bg-primary text-primary-foreground border-l-4 border-accent rounded-md">
            <MessageSquareHeart className="h-14 w-14 text-accent mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{content.aiGuide.heading}</h2>
            <p className="mb-6 text-lg text-primary-foreground/90">
              {content.aiGuide.text}
            </p>
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/admissions/ai-guide">
                <Edit className="mr-2 h-5 w-5" />
                {content.aiGuide.buttonLabel}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">{content.formsHeading}</h2>
          <p className="text-foreground/80 mb-8 max-w-xl mx-auto">
            {content.formsText}
          </p>

        <div>
           <Button size="lg" variant="outline" asChild>
             <a
                href={content.downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" /> {content.downloadButtonLabel}
              </a>
           </Button>
         </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {content.formsNote}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">{content.questionsHeading}</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
            {content.questionsText}
          </p>
          <Button size="lg" asChild>
            <Link href="/contact">Contact Admissions</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
