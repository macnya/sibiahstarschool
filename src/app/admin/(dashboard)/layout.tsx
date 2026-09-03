import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../auth-actions';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, CalendarDays, Newspaper, Images, Mail, LogOut, ExternalLink,
} from 'lucide-react';

// The admin panel must never be cached or statically rendered.
export const dynamic = 'force-dynamic';

const NAV = [
  { href: '/admin',          label: 'Overview', icon: LayoutDashboard },
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
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-primary">Sibiah Star admin</span>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {profile.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" target="_blank">
                View site <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex flex-col gap-8 px-4 py-8 md:flex-row">
        <nav className="md:w-52 shrink-0">
          <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
