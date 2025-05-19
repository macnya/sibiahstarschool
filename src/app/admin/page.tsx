
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-provider';
import { Loader2 } from 'lucide-react';

const AdminPage = () => {
  const { user, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialLoading) {
      if (!user) {
        router.push('/admin/login');
      } else {
        // Placeholder for checking admin privileges
        // Real admin role check (e.g., custom claims) would happen here.
        router.push('/admin/dashboard');
      }
    }
  }, [user, initialLoading, router]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // This content will likely not be seen due to redirects, but acts as a fallback.
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to admin section...</p>
    </div>
  );
};

export default AdminPage;
