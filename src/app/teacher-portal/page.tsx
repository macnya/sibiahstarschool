
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, UserCheck, Mail } from 'lucide-react'; // UserCheck for teachers
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-provider';
import Link from 'next/link';
import { SvgGoogleIcon } from '@/components/shared/icons';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function TeacherPortalPage() {
  const { toast } = useToast();
  const { user, login, signInWithGoogle, loading: authLoading, initialLoading } = useAuth();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!initialLoading && user) {
      // For now, any logged-in user goes to teacher dashboard.
      // In a real app, check for a 'teacher' role here.
      router.push('/teacher-portal/dashboard');
    }
  }, [user, initialLoading, router]);

  async function onLogin(values: FormValues) {
    const success = await login(values.email, values.password);
    if (success) {
      form.reset();
      // router.push('/teacher-portal/dashboard'); // AuthProvider useEffect will handle
    }
  }
  
  async function handleGoogleSignIn() {
    await signInWithGoogle();
    // AuthProvider useEffect will handle redirect if successful
  }

  if (initialLoading || (!initialLoading && user)) {
     return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Teacher Portal"
        subtitle="Access tools and resources for managing your classes and students."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <Card className="max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            <UserCheck className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-bold text-primary">Teacher Login</CardTitle>
            <CardDescription>Enter your credentials to access the portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onLogin)} className="space-y-6">
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="emailTeacher">Email</FormLabel>
                      <FormControl>
                        <Input id="emailTeacher" type="email" placeholder="your.email@school.com" {...field} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                   control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="passwordTeacher">Password</FormLabel>
                      <FormControl>
                        <Input id="passwordTeacher" type="password" placeholder="Your Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={authLoading}>
                    {authLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <LogIn className="mr-2 h-4 w-4" /> )}
                  Login
                </Button>
              </form>
            </Form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground"> Or continue with </span>
              </div>
            </div>

            <Button variant="outline" className="w-full mb-4" onClick={handleGoogleSignIn} disabled={authLoading}>
              {authLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <SvgGoogleIcon className="mr-2 h-5 w-5" /> )}
              Sign in with Google
            </Button>

            <div className="text-center text-sm text-muted-foreground">
               Don&apos;t have an account?{' '}
               <Button asChild variant="link" size="sm" className="px-0 text-accent hover:underline">
                 <Link href="/teacher-portal/register">Register Here</Link>
               </Button>
            </div>
            <div className="text-center mt-2">
              <Button variant="link" size="sm" className="text-xs text-muted-foreground hover:text-accent" onClick={() => toast({ title: "Feature Coming Soon", description: "Password recovery is not yet implemented."})}>
                Forgot Password?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
