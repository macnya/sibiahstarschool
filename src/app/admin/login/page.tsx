'use client';

import { useActionState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { signIn, type AuthState } from '../auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, School } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

function LoginForm() {
  const next = useSearchParams().get('next') ?? '/admin';
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      {state.error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-16">
      <div className="mb-6 flex items-center gap-2">
        <School className="h-7 w-7 text-primary" />
        <span className="text-lg font-semibold text-primary">Sibiah Star School</span>
      </div>
      <Card className="w-full max-w-sm border-t-4 border-accent shadow-none">
        <CardHeader>
          <CardTitle className="text-primary">Staff sign in</CardTitle>
          <CardDescription>
            Manage events, blog posts, photos and enquiries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
