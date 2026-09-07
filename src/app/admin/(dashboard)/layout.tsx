import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../auth-actions';
import { Button } from '@/components/ui/button';
import { AdminSidebarNav } from '@/components/admin/sidebar-nav';
import {
  LayoutDashboard, CalendarDays, Newspaper, Images, Mail, LogOut, ExternalLink, FileEdit,
} from 'lucide-react';

// The admin panel must never be cached or statically rendered.
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin',          label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/content',  label: 'Content',  icon: FileEdit },
  { href: '/admin/events',   label: 'Events',   icon: CalendarDays },
  { href: '/admin/blog',     label: 'Blog',     icon: Newspaper },
  { href: '/admin/gallery',  label: 'Gallery',  icon: Images },
  { href: '/admin/messages', label: 'Messages', icon: Mail },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // middleware.ts already redirects unauthenticated users, but a layout
  // that trusts middleware alone would expose everything if the matcher
  // is ever edited. Check here too.
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Sibiah Star admin</span>
            <span className="rounded bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {profile.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link href="/" target="_blank">
                View site <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-col gap-8 px-4 py-8 md:flex-row">
        <AdminSidebarNav items={NAV} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
