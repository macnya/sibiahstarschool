
'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, Users, LogOut, UserPlus, Mail } from 'lucide-react'; // Added UserPlus
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
import { SvgGoogleIcon } from '@/components/shared/icons'; // Assuming you'll create this

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ParentPortalPage() {
  const { toast } = useToast();
  const { user, login, logout, signInWithGoogle, loading: authLoading, initialLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onLogin(values: FormValues) {
    const success = await login(values.email, values.password);
    if (success) {
      form.reset();
    }
  }
  
  async function handleGoogleSignIn() {
    await signInWithGoogle();
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
              {/* Placeholder for portal content */}
              <div className="my-6 p-4 border rounded-md bg-secondary/20">
                <p className="text-muted-foreground">Parent-specific content will appear here.</p>
              </div>
              <Button onClick={logout} disabled={authLoading} className="w-full bg-destructive hover:bg-destructive/90">
                {authLoading ? ( <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ) : ( <LogOut className="mr-2 h-4 w-4" /> )}
                Logout
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="emailParent">Email</FormLabel>
                      <FormControl>
                        <Input id="emailParent" type="email" placeholder="your.email@example.com" {...field} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
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
                <Link href="/parent-portal/register">Register Here</Link>
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
