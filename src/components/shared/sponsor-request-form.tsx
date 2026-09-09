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
import { useState } from 'react';
import { Loader2, HeartHandshake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitSponsorRequest } from '@/app/scholarship-actions';

const schema = z.object({
  sponsorName: z.string().min(2, { message: 'Please enter your full name.' }),
  organization: z.string().optional(),
  phone: z.string().min(7, { message: 'Please enter a valid phone number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z.string().max(1000, { message: 'Please keep this under 1000 characters.' }).optional(),
});

type FormValues = z.infer<typeof schema>;

export function SponsorRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sponsorName: '',
      organization: '',
      phone: '',
      email: '',
      message: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    const result = await submitSponsorRequest(values);
    setIsLoading(false);

    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: 'Request not sent',
        description: result.error ?? 'Something went wrong. Please try again.',
      });
      return;
    }

    toast({
      title: 'Thank you for your interest',
      description: "We'll be in touch to discuss how you can help.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-8 rounded-lg shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sponsorName"
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
            name="organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Doe Foundation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tell us about your interest (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How many students would you like to sponsor? Any preferences on level or duration?"
                  className="resize-none min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Max 1000 characters.</FormDescription>
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
              <HeartHandshake className="mr-2 h-5 w-5" />
              Become a Sponsor
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
