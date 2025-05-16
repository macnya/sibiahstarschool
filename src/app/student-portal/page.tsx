
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, UserCircle, LogOut } from 'lucide-react';
// import type { Metadata } from 'next'; // Metadata should be defined in server components or layout for client components
import { useForm, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import{\n
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
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';\nimport { auth } from '@/lib/firebase';\n
// export const metadata: Metadata = {
//   title: 'Student Portal',
//   description: 'Access the Sibiah Star School Student Portal.',
// };

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function StudentPortalPage() {
  const { toast } = useToast(); // Initialize useToast here
  const { user, login, logout, loading: authLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const { isSubmitting } = useFormState({ control: form.control });

  async function onSubmit(values: FormValues) {
    try {\n      await login(values.email, values.password);\n      form.reset();\n    } catch (error: any) {\n      toast({\n        title: 'Login Failed',\n        description: error.message,\n        variant: 'destructive',\n      });\n    }\n  }\n\n  async function handleGoogleSignIn() {\n    const provider = new GoogleAuthProvider();\n    try {\n      await signInWithPopup(auth, provider);\n      toast({\n        title: 'Login Successful',\n        description: 'You have successfully logged in with Google.',\n      });\n    } catch (error: any) {\n      toast({\n        title: 'Google Sign-In Failed',\n        description: error.message,\n        variant: 'destructive',\n      });\n    }\n
  }

  if (user) {
    return (
      <div>
        <PageHeader
          title="Student Portal"
          subtitle={`Welcome, ${user.displayName || user.email}!`}
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <Card className="max-w-md mx-auto shadow-xl">
            <CardHeader className="text-center">
              <UserCircle className="h-16 w-16 mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Welcome!</CardTitle>
              <CardDescription>You are now logged in to the Student Portal.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">Access your grades, announcements, and resources.</p>
              <Button onClick={logout} disabled={authLoading} className="w-full bg-destructive hover:bg-destructive/90">
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Student Portal"
        subtitle="Welcome, students! Access your grades, announcements, and resources here."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <Card className="max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            <UserCircle className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-bold text-primary">Student Login</CardTitle>
            <CardDescription>Enter your credentials to access the portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input id="email" type="email" placeholder="your.email@example.com" {...field} />
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
                      <FormLabel htmlFor="passwordStudent">Password</FormLabel>
                      <FormControl>
                        <Input id="passwordStudent" type="password" placeholder="Your Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting || authLoading}>
                    {isSubmitting || authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Login
                    </>
                  )}
                </Button>
                <div className="text-center">

                  {/* Google Sign-In Button (Placeholder) */}
                  <Button variant="outline" className="w-full mb-4">
                    Sign in with Google
                  </Button>

                  {/* Forgot Password (Placeholder) */}
                  <Button variant="link" size="sm" className="text-accent" onClick={() => toast({ title: "Feature Coming Soon", description: "Password recovery is not yet implemented."})}>
                    Forgot Password?
                  </Button>
                </div>
              </form>
            </Form>
            <div className="mt-6 text-center">
               <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/student-portal/register" className="text-primary hover:underline">Sign Up</Link>
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
