import { PageHeader } from '@/components/shared/page-header';
import AdmissionGuideForm from './admission-form';
import AdmissionQaForm from './admission-qa-form';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Metadata } from 'next';
import { Lightbulb, MessageCircleQuestion, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Admission Guide',
  description: 'Ask about our admissions policies or get personalized interview-prep questions for Sibiah Star School using our AI-powered guide.',
};

export default function AiAdmissionGuidePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Powered by AI, grounded in our real policies"
        title="AI Admission Guide"
        subtitle={
          <div className="flex flex-col items-center space-y-2">
            <Lightbulb className="h-10 w-10 text-accent"/>
            <p>
            Ask a question about our admissions process, or get a personalized list of
            questions to bring to your admission discussion.
            </p>
          </div>
        }
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-2xl">
          <Tabs defaultValue="ask" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="ask" className="gap-2">
                <MessageCircleQuestion className="h-4 w-4" />
                Ask a Question
              </TabsTrigger>
              <TabsTrigger value="prep" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Get Prep Questions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ask">
              <AdmissionQaForm />
            </TabsContent>

            <TabsContent value="prep">
              <AdmissionGuideForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
