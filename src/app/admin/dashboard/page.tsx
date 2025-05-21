
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-provider';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Users, Settings, Loader2, ShieldAlert } from 'lucide-react'; // Added ShieldAlert
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, isAdmin, logout, loading: authLoading, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (!isAdmin) {
        // If logged in but not an admin, redirect away from dashboard
        console.warn("Access to admin dashboard denied. User is not an admin.");
        router.push('/'); // Or a specific '/access-denied' page
      }
    }
  }, [user, isAdmin, initialLoading, router]);

  if (initialLoading || !user || !isAdmin) {
    // Show loader until auth state is confirmed and admin status is verified
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading dashboard or verifying admin status...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle={
          <div className="flex items-center justify-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-accent" />
            <span>Welcome, Admin {user.displayName || user.email}!</span>
          </div>
        }
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Placeholder</div>
              <p className="text-xs text-muted-foreground">
                User management features coming soon.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/admin/users">Go to Users</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Site Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Placeholder</div>
              <p className="text-xs text-muted-foreground">
                Configuration options coming soon.
              </p>
            </CardContent>
          </Card>

          {/* Add more admin cards/widgets here */}
        </div>

        <div className="mt-12 text-center">
          <Button onClick={logout} disabled={authLoading} variant="destructive">
            {authLoading ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<LogOut className="mr-2 h-4 w-4" />)}
            Logout from Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
