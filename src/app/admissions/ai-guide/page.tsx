import { PageHeader } from '@/components/shared/page-header';
import AdmissionGuideForm from './admission-form';
import type { Metadata } from 'next';
import { Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Admission Guide',
  description: 'Get personalized admission questions for Sibiah Star School using our AI-powered guide.',
};

export default function AiAdmissionGuidePage() {
  return (
    <div>
      <PageHeader
        title="AI Admission Question Guide"
        subtitle={
          <div className="flex flex-col items-center space-y-2">
            <Lightbulb className="h-10 w-10 text-accent"/>
            <p>
            Let our AI assistant help you prepare for your admission discussion.
            Enter your child's age and any learning considerations to generate a list of tailored questions you might want to ask.
            </p>
          </div>
        }
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-2xl mx-auto bg-card p-6 sm:p-8 rounded-xl shadow-2xl">
          <AdmissionGuideForm />
        </div>
      </div>
    </div>
  );
}
