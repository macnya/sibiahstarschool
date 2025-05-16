
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, Users, LogOut, Mail, Google } from 'lucide-react';
// import type { Metadata } from 'next'; // Metadata should be defined in server components or layout for client components
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
// export const metadata: Metadata = {
//   title: 'Parent Portal',
//   description: 'Access the Sibiah Star School Parent Portal.',
// };

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ParentPortalPage() {
  const { toast } = useToast();
  const { user, login, logout, signInWithGoogle, loading: authLoading, registerWithEmailAndPassword } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Differentiate between login and signup based on form submission context (not implemented here, requires separate forms or state)
  // For simplicity, this onSubmit will handle LOGIN. Registration will be a separate page linked below.
  async function onLogin(values: FormValues) {
    try {
      await login(values.email, values.password);
    } catch (error: any) {
       toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }

    form.reset(); 
  }

  if (user) {
 return (
      <div>
        <PageHeader
          title="Parent Portal"
          subtitle={`Welcome, ${user.displayName || user.email}!`}
        />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <Card className="max-w-md mx-auto shadow-xl">
            <CardHeader className="text-center">
              <Users className="h-16 w-16 mx-auto text-primary mb-4" />
              <CardTitle className="text-2xl font-bold text-primary">Welcome!</CardTitle>
              <CardDescription>You are now logged in to the Parent Portal.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">View your child's information, announcements, and more.</p>
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
        title="Parent Portal"
        subtitle="Stay connected! Access your child's progress, school announcements, and more."
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <Card className="max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            <Users className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-bold text-primary">Parent Login</CardTitle>
            <CardDescription>Enter your credentials to access the portal.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
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
                      <FormLabel htmlFor="passwordParent">Password</FormLabel>
                      <FormControl>
                        <Input id="passwordParent" type="password" placeholder="Your Password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={authLoading}>
                  {authLoading ? (
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
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social and Registration Options */}
            <div className="space-y-4">
               <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={authLoading}>
                 <Google className="mr-2 h-4 w-4" /> Google
 </Button>
               <div className="text-center text-sm text-muted-foreground">
                 Don&apos;t have an account?{' '}
                 <Button asChild variant="link" size="sm" className="px-0">
                   Register Here
                 </Button>
               </div>

                  <Button variant="link" size="sm" className="text-accent" onClick={() => toast({ title: "Feature Coming Soon", description: "Password recovery is not yet implemented."})}>
                    Forgot Password?
                  </Button>
                </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
