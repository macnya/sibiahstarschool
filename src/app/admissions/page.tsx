import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, Edit, ListChecks, MessageSquareHeart } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admissions',
  description: 'Learn about the admission process at Sibiah Star School, requirements for different levels, and access our AI Admission Guide.',
};

const admissionSteps = [
  { id: 1, title: 'Inquiry & Information', description: 'Contact us or visit our website to learn more about our programs and admission criteria. Attend an open house if available.' },
  { id: 2, title: 'Application Submission', description: 'Complete and submit the online application form along with required documents and application fee.' },
  { id: 3, title: 'Assessment/Interview', description: 'Prospective students may be required to undergo an age-appropriate assessment or interview.' },
  { id: 4, title: 'Offer of Admission', description: 'Successful candidates will receive an offer of admission. Parents accept the offer and complete enrollment formalities.' },
  { id: 5, title: 'Welcome to Sibiah Star!', description: 'Once enrollment is complete, your child becomes a part of the Sibiah Star family!' },
];

const requirements = [
  { level: 'Pre-school (Playgroup, PP1, PP2)', items: ['Birth Certificate copy', 'Passport-size photos (2)', 'Completed Application Form', 'Immunization Records'] },
  { level: 'Primary (Grade 1 - 6)', items: ['Birth Certificate copy', 'Previous School Report Cards (if applicable)', 'Transfer Certificate (if applicable)', 'Passport-size photos (2)'] },
  { level: 'Junior Secondary (Grade 7 - 9)', items: ['Birth Certificate copy', 'Previous School Report Cards', 'Transfer Certificate', 'Passport-size photos (2)', 'Recommendation Letter (optional)'] },
];

export default function AdmissionsPage() {
  return (
    <div>
      <PageHeader
        title="Admissions at Sibiah Star"
        subtitle="Join our vibrant learning community. We are excited to guide you through our admission process."
      />

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">Our Admission Process</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            {admissionSteps.map((step) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xl font-bold">
                  {step.id}
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-12">Admission Requirements</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
            {requirements.map((req) => (
              <Card key={req.level} className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-primary text-xl flex items-center">
                    <ListChecks className="mr-2 h-6 w-6 text-accent" /> {req.level}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {req.items.map((item, index) => (
                      <li key={index} className="flex items-center text-foreground/80">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-primary to-blue-700 text-primary-foreground shadow-xl">
             <MessageSquareHeart className="h-16 w-16 text-accent mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">AI Admission Guide</h2>
            <p className="mb-6 text-lg">
              Preparing for admissions? Our AI-powered tool helps you tailor questions for your child's specific needs based on their age and learning considerations.
            </p>
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/admissions/ai-guide">
                <Edit className="mr-2 h-5 w-5" />
                Launch AI Guide
              </Link>
            </Button>
          </Card>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Application Forms</h2>
          <p className="text-foreground/80 mb-8 max-w-xl mx-auto">
            Download the necessary application forms here. Please ensure all sections are completed accurately.
          </p>
        
        <div>
           <Button size="lg" variant="outline" asChild>
             <a
                href="https://drive.google.com/file/d/1JSusZZDhgqaj2uG7VZ8-lqxD7wx_5_dE/view?usp=sharing" target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-5 w-5" /> Download Admission Form (All Levels)
              </a>
           </Button>
         </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Note: Online application portal coming soon!
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">Have Questions?</h2>
          <p className="text-lg text-foreground/80 mb-8 max-w-xl mx-auto">
            Our admissions team is here to help. Feel free to reach out with any queries.
          </p>
          <Button size="lg" asChild>
            <Link href="/contact">Contact Admissions</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
