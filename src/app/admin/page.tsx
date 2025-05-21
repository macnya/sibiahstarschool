
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-provider';
import { Loader2 } from 'lucide-react';

const AdminPage = () => {
  const { user, isAdmin, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading) {
      if (!user) {
        router.push('/admin/login');
      } else if (user && !isAdmin) {
        // If user is logged in but not an admin, redirect to home or an access denied page
        console.warn("User is not an admin. Redirecting from /admin main page.");
        router.push('/'); // Or a specific '/access-denied' page
      } else if (user && isAdmin) {
        router.push('/admin/dashboard');
      }
    }
  }, [user, isAdmin, initialLoading, router]);

  if (initialLoading || (user && !isAdmin && !initialLoading)) { // Show loader while checking or if redirecting non-admin
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Checking authorization...</p>
      </div>
    );
  }
  // Fallback content, though redirects should usually handle it
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to admin section...</p>
    </div>
  );
};

export default AdminPage;
