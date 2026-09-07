'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: LucideIcon };

export function AdminSidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="md:w-52 shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map(({ href, label, icon: Icon }) => {
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
