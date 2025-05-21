
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Mail, Lock, UserCheck } from 'lucide-react';
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
import { useAuth } from '@/contexts/auth-provider';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SvgGoogleIcon } from '@/components/shared/icons';
import { useEffect } from 'react';

const registerFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function TeacherRegisterPage() {
  const { registerWithEmailAndPassword, signInWithGoogle, loading: authLoading, initialLoading, user } = useAuth();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
  });
  
  useEffect(() => {
    if (!initialLoading && user) {
      router.push('/teacher-portal/dashboard'); 
    }
  }, [user, initialLoading, router]);

  async function onSubmit(values: RegisterFormValues) {
    const success = await registerWithEmailAndPassword(values.email, values.password);
    if (success) {
      router.push('/teacher-portal/dashboard');
    }
  }

  async function handleGoogleSignIn() {
    const success = await signInWithGoogle();
    if (success) {
      router.push('/teacher-portal/dashboard');
    }
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
        title="Teacher Registration"
        subtitle="Create your teacher account to access the portal."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Card className="max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            <UserCheck className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-bold text-primary">Create Teacher Account</CardTitle>
            <CardDescription>Fill in the details below to register.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="emailRegisterTeacher">Email</FormLabel>
                      <FormControl>
                        <Input id="emailRegisterTeacher" type="email" placeholder="your.email@school.com" {...field} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
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
                      <FormLabel htmlFor="passwordRegisterTeacher">Password</FormLabel>
                      <FormControl>
                        <Input id="passwordRegisterTeacher" type="password" placeholder="Create a Password" {...field} icon={<Lock className="h-4 w-4 text-muted-foreground" />} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="confirmPasswordRegisterTeacher">Confirm Password</FormLabel>
                      <FormControl>
                        <Input id="confirmPasswordRegisterTeacher" type="password" placeholder="Confirm Your Password" {...field} icon={<Lock className="h-4 w-4 text-muted-foreground" />} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={authLoading}>
                  {authLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <UserPlus className="mr-2 h-4 w-4" /> )}
                  Register
                </Button>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground"> Or register with </span>
              </div>
            </div>

            <Button variant="outline" className="w-full mb-4" onClick={handleGoogleSignIn} disabled={authLoading}>
               {authLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <SvgGoogleIcon className="mr-2 h-5 w-5" /> )}
              Sign up with Google
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button asChild variant="link" size="sm" className="px-0 text-accent hover:underline">
                <Link href="/teacher-portal">Login Here</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
