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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitScholarshipRequest } from '@/app/scholarship-actions';

const schema = z.object({
  parentName: z.string().min(2, { message: 'Please enter your full name.' }),
  phone: z.string().min(7, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  studentName: z.string().min(2, { message: "Please enter your child's full name." }),
  studentLevel: z.string().min(1, { message: 'Please select a level.' }),
  reason: z.string()
    .min(20, { message: 'Please provide at least 20 characters.' })
    .max(1000, { message: 'Please keep this under 1000 characters.' }),
});

type FormValues = z.infer<typeof schema>;

export function ScholarshipRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      parentName: '',
      phone: '',
      email: '',
      studentName: '',
      studentLevel: '',
      reason: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    const result = await submitScholarshipRequest(values);
    setIsLoading(false);

    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: 'Application not sent',
        description: result.error ?? 'Something went wrong. Please try again.',
      });
      return;
    }

    toast({
      title: 'Application received',
      description: "Thank you. We'll review it and be in touch soon.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-8 rounded-lg shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="parentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="e.g., 0712 345 678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="studentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Child's Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="studentLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Pre-school">Pre-school</SelectItem>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Junior Secondary">Junior Secondary</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Why are you applying?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us about your family's situation and why a scholarship would help..."
                  className="resize-none min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This helps us understand your family's circumstances. Max 1000 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-primary hover:bg-primary/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Submit Application
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
