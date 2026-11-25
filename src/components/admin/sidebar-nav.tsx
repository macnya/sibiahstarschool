'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FilePen, CalendarDays, Newspaper, Images, Mail, HeartHandshake, ClipboardList, Users, Building2, Wallet, School, GraduationCap, CalendarCheck,
} from 'lucide-react';

// Defined here, inside the Client Component, rather than passed in as a
// prop from the server layout. Icon *components* (as opposed to already-
// rendered JSX) can't be serialized across the server->client boundary —
// passing them as props from a Server Component throws at render time.
// 'group'  = administrators of the whole school group (see everything)
// 'campus' = administrators limited to one campus (admissions + students only)
// 'editor' = website editors (content only, as before)
type Scope = 'group' | 'campus' | 'editor';

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; scopes: Scope[] }[] = [
  { href: '/admin',              label: 'Overview',      icon: LayoutDashboard, scopes: ['group', 'campus', 'editor'] },
  { href: '/admin/admissions',   label: 'Admissions',    icon: ClipboardList,   scopes: ['group', 'campus'] },
  { href: '/admin/students',     label: 'Students',      icon: Users,           scopes: ['group', 'campus'] },
  { href: '/admin/attendance',   label: 'Attendance',    icon: CalendarCheck,   scopes: ['group', 'campus'] },
  { href: '/admin/classes',      label: 'Classes',       icon: School,          scopes: ['group', 'campus'] },
  { href: '/admin/teachers',     label: 'Teachers',      icon: GraduationCap,   scopes: ['group', 'campus'] },
  { href: '/admin/fees',         label: 'Fees',          icon: Wallet,          scopes: ['group', 'campus'] },
  { href: '/admin/campuses',     label: 'Schools',       icon: Building2,       scopes: ['group'] },
  { href: '/admin/content',      label: 'Content',       icon: FilePen,         scopes: ['group', 'editor'] },
  { href: '/admin/events',       label: 'Events',        icon: CalendarDays,    scopes: ['group', 'editor'] },
  { href: '/admin/blog',         label: 'Blog',          icon: Newspaper,       scopes: ['group', 'editor'] },
  { href: '/admin/gallery',      label: 'Gallery',       icon: Images,          scopes: ['group', 'editor'] },
  { href: '/admin/scholarships', label: 'Scholarships',  icon: HeartHandshake,  scopes: ['group', 'editor'] },
  { href: '/admin/messages',     label: 'Messages',      icon: Mail,            scopes: ['group', 'editor'] },
];

export function AdminSidebarNav({ scope = 'group' }: { scope?: Scope }) {
  const pathname = usePathname();

  return (
    <nav className="md:w-52 shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV.filter((item) => item.scopes.includes(scope)).map(({ href, label, icon: Icon }) => {
          // Exact match for the overview link (it's a prefix of every
          // other admin route); startsWith for the rest so a sub-page
          // like /admin/blog/new still highlights "Blog".
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-2.5 whitespace-nowrap rounded-md border-l-4 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'border-accent bg-accent/10 text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
