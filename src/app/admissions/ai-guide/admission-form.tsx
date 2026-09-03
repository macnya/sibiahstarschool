'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateAdmissionQuestions, type AdmissionQuestionsOutput } from '@/ai/flows/admission-question-generator';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  childAge: z.coerce.number().min(2, "Child's age must be at least 2.").max(18, "Child's age must be at most 18."),
  learningConsiderations: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdmissionGuideForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<AdmissionQuestionsOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childAge: undefined,
      learningConsiderations: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setGeneratedQuestions(null);
    try {
      const result = await generateAdmissionQuestions({
        childAge: values.childAge,
        learningConsiderations: values.learningConsiderations || '',
      });
      setGeneratedQuestions(result);
      toast({
        title: "Questions Generated!",
        description: "Your personalized admission questions are ready below.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error generating admission questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="childAge"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold text-primary">Child's Age (Years)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 5" {...field} className="text-base" />
                </FormControl>
                <FormDescription>
                  Enter the age of your child in years.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="learningConsiderations"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold text-primary">Specific Learning Considerations (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., dyslexia, gifted program interest, shy personality"
                    className="resize-none text-base min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Mention any specific needs, strengths, or areas of interest for your child.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Questions
              </>
            )}
          </Button>
        </form>
      </Form>

      {generatedQuestions && (
        <Card className="mt-12 shadow-lg border-accent">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-accent" />
              Your Personalized Admission Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-foreground/90 whitespace-pre-wrap">
              {generatedQuestions.anticipatedQuestions}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
