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
import { Textarea } from '@/components/ui/textarea';
import { answerAdmissionQuestion, type AdmissionQaOutput } from '@/ai/flows/admission-policy-qa';
import { useState } from 'react';
import { Loader2, MessageCircleQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  question: z.string().min(5, 'Please ask a full question.').max(500, 'Keep it under 500 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdmissionQaForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AdmissionQaOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { question: '' },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const answer = await answerAdmissionQuestion({ question: values.question });
      setResult(answer);
    } catch (error) {
      console.error('Error answering admission question:', error);
      toast({
        title: 'Error',
        description: 'Could not get an answer right now. Please try again, or use the Contact page.',
        variant: 'destructive',
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
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold text-primary">Ask about admissions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., What documents do I need to enroll my child in Grade 1? Do you offer a payment plan for fees?"
                    className="resize-none text-base min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Answered from our published admissions policy — for anything specific to your
                  situation, our office is always happy to help directly.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <MessageCircleQuestion className="mr-2 h-5 w-5" />
                Get an Answer
              </>
            )}
          </Button>
        </form>
      </Form>

      {result && (
        <Card className="mt-12 shadow-lg border-accent">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center">
              <MessageCircleQuestion className="mr-2 h-6 w-6 text-accent" />
              Answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-foreground/90 whitespace-pre-wrap">
              {result.answer}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
