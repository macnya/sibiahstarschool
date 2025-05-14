import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, Users } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parent Portal',
  description: 'Access the Sibiah Star School Parent Portal.',
};

export default function ParentPortalPage() {
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
          <CardContent className="space-y-6">
             <div className="space-y-2">
              <label htmlFor="parentId" className="text-sm font-medium text-gray-700">Parent ID / Email</label>
              <Input id="parentId" type="text" placeholder="Your Parent ID or Email" />
            </div>
            <div className="space-y-2">
              <label htmlFor="passwordParent" className="text-sm font-medium text-gray-700">Password</label>
              <Input id="passwordParent" type="password" placeholder="Your Password" />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled>
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Login functionality is currently under development.
            </p>
             <div className="text-center">
              <Button variant="link" size="sm" className="text-accent" disabled>Forgot Password?</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
