'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin/fees', label: 'Overview', exact: true },
  { href: '/admin/fees/payments', label: 'Payments' },
  { href: '/admin/fees/arrears', label: 'Arrears' },
  { href: '/admin/fees/invoices', label: 'Invoices' },
  { href: '/admin/fees/import', label: 'Import statement' },
  { href: '/admin/fees/mpesa', label: 'Incoming' },
  { href: '/admin/fees/sms', label: 'SMS' },
  { href: '/admin/fees/setup', label: 'Setup' },
];

export function FeesTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Fees sections" className="mb-6 flex flex-wrap gap-1 border-b">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-medium', active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
