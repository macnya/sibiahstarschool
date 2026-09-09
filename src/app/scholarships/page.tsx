import { PageHeader } from '@/components/shared/page-header';
import { ScholarshipRequestForm } from '@/components/shared/scholarship-request-form';
import { SponsorRequestForm } from '@/components/shared/sponsor-request-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GraduationCap, HeartHandshake } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scholarships & Sponsorships',
  description: 'Apply for a scholarship for your child, or become a sponsor and help a student access quality education at Sibiah Star School.',
};

export default function ScholarshipsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Invest in a child's future"
        title="Scholarships & Sponsorships"
        subtitle="We believe every child deserves a quality education. If your family needs support, or you'd like to fund a student's journey with us, this is the place to start."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Tabs defaultValue="apply" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="apply" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Apply for a Scholarship
              </TabsTrigger>
              <TabsTrigger value="sponsor" className="gap-2">
                <HeartHandshake className="h-4 w-4" />
                Sponsor a Student
              </TabsTrigger>
            </TabsList>

            <TabsContent value="apply" className="space-y-6">
              <p className="text-foreground/80">
                If you'd like your child to be considered for a scholarship, fill out the form below.
                Our team reviews every application and will reach out to discuss next steps.
              </p>
              <ScholarshipRequestForm />
            </TabsContent>

            <TabsContent value="sponsor" className="space-y-6">
              <p className="text-foreground/80">
                As a sponsor, you fund some or all of a student's school fees and follow their
                progress. We'll match you with a student and keep you updated on their journey.
              </p>
              <SponsorRequestForm />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
