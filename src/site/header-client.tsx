'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, GraduationCap, Menu, Phone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface NavItem { href: string; label: string; hint?: string }
interface NavGroup { key: string; href: string; label: string; blurb: string; items: NavItem[] }

const PHONE = '+254721412004';

function buildGroups(campuses: { name: string; slug: string }[]): NavGroup[] {
  return [
    {
      key: 'about',
      href: '/about',
      label: 'About',
      blurb: 'Who we are, what we believe and the people behind our schools.',
      items: [
        { href: '/about', label: 'Our story & values', hint: 'Mission, vision and leadership' },
        { href: '/about#team', label: 'Our team', hint: 'The teachers and staff you will meet' },
        { href: '/facilities', label: 'Facilities', hint: 'Classrooms, play areas and more' },
      ],
    },
    {
      key: 'schools',
      href: '/schools',
      label: 'Our Schools',
      blurb: 'One family of schools, from pre-school to Grade 9.',
      items: [
        ...campuses.map((c) => ({ href: `/schools/${c.slug}`, label: c.name, hint: 'Classes, contacts and applying' })),
        { href: '/schools', label: 'All our schools', hint: 'Compare campuses side by side' },
      ],
    },
    {
      key: 'academics',
      href: '/curriculum',
      label: 'Academics',
      blurb: 'A balanced programme that builds knowledge, character and confidence.',
      items: [
        { href: '/curriculum', label: 'Curriculum overview' },
        { href: '/curriculum#preschool', label: 'Pre-school' },
        { href: '/curriculum#primary', label: 'Primary school' },
        { href: '/curriculum#junior-secondary', label: 'Junior school' },
        { href: '/curriculum#extracurricular', label: 'Co-curricular activities' },
      ],
    },
    {
      key: 'admissions',
      href: '/admissions',
      label: 'Admissions',
      blurb: 'Apply online in about five minutes and track every step.',
      items: [
        { href: '/admissions/apply', label: 'Apply online', hint: 'Start an application' },
        { href: '/admissions/status', label: 'Track your application', hint: 'Reference number + phone' },
        { href: '/admissions', label: 'How admission works' },
        { href: '/scholarships', label: 'Scholarships & support' },
        { href: '/pay-fees', label: 'Pay school fees', hint: 'Check balance, pay by M-Pesa' },
      ],
    },
    {
      key: 'life',
      href: '/events',
      label: 'Life at School',
      blurb: 'News, events and moments from our school community.',
      items: [
        { href: '/events', label: 'Events' },
        { href: '/blog', label: 'News & blog' },
        { href: '/gallery', label: 'Photo gallery' },
        { href: '/facilities#transport', label: 'School transport' },
      ],
    },
  ];
}

const UTILITY = [
  { href: '/pay-fees', label: 'Pay Fees', icon: Wallet },
  { href: '/admissions/status', label: 'Track Application' },
  { href: '/events', label: 'Events' },
  { href: '/contact', label: 'Contact' },
];

export function HeaderClient({ campuses }: { campuses: { name: string; slug: string }[] }) {
  const pathname = usePathname();
  const groups = buildGroups(campuses);
  const [open, setOpen] = useState<string | null>(null);
  const [pinned, setPinnedState] = useState(false);
  const setPinned = (v: boolean) => { pinnedRef.current = v; setPinnedState(v); };
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => { if (!pinnedRef.current) setOpen(null); }, 160); };

  // Close menus when the page changes.
  useEffect(() => { setOpen(null); setPinned(false); setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click outside / Escape closes the open menu (keyboard users keep their place).
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) { setOpen(null); setPinned(false); } };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(null); setPinned(false);
        navRef.current?.querySelector<HTMLButtonElement>(`[data-group="${open}"]`)?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const groupActive = useCallback((g: NavGroup) => g.items.some((i) => i.href.split('#')[0] !== '/' && pathname.startsWith(i.href.split('#')[0])), [pathname]);

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="hidden bg-primary text-primary-foreground lg:block">
        <div className="container mx-auto flex h-9 items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
          <a href={`tel:${PHONE}`} className="inline-flex items-center gap-1.5 text-primary-foreground/80 hover:text-accent">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />(254) 721-412004
          </a>
          <ul className="flex items-center gap-1">
            {UTILITY.map((u) => (
              <li key={u.href}>
                <Link href={u.href} className="inline-flex items-center gap-1.5 rounded px-3 py-1 font-medium text-primary-foreground/90 hover:bg-white/10 hover:text-accent">
                  {u.icon && <u.icon className="h-3.5 w-3.5" aria-hidden="true" />}{u.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main bar */}
      <div className={cn('border-b border-black/5 bg-white/95 backdrop-blur transition-shadow', scrolled && 'shadow-md')}>
        <div className="container mx-auto flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-primary" aria-label="Sibiah Star School — home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-accent"><GraduationCap className="h-5 w-5" aria-hidden="true" /></span>
            <span className="leading-tight">
              <span className="display-title block text-xl">Sibiah Star</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/60">Pre-school to Grade 9</span>
            </span>
          </Link>

          <nav ref={navRef} aria-label="Main" className="hidden items-center lg:flex" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            {groups.map((g) => {
              const isOpen = open === g.key;
              return (
                <div
                  key={g.key}
                  className="relative flex items-center"
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') { cancelClose(); if (!pinnedRef.current || !open) setOpen(g.key); } }}
                  onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setOpen((cur) => (cur === g.key ? null : cur)); setPinned(false); } }}
                >
                  <Link
                    href={g.href}
                    className={cn(
                      'rounded-md py-2 pl-3 pr-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isOpen || groupActive(g) ? 'text-primary' : 'text-foreground/75 hover:text-primary',
                    )}
                  >
                    {g.label}
                  </Link>
                  <button
                    type="button"
                    data-group={g.key}
                    aria-expanded={isOpen}
                    aria-controls={`menu-${g.key}`}
                    aria-label={`Show ${g.label} menu`}
                    onClick={() => { if (isOpen && pinned) { setOpen(null); setPinned(false); } else { cancelClose(); setOpen(g.key); setPinned(true); } }}
                    className="rounded-md px-1.5 py-2 text-foreground/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
                  </button>
                  <div
                    id={`menu-${g.key}`}
                    hidden={!isOpen}
                    className="absolute left-1/2 top-full z-50 w-[30rem] -translate-x-1/2 pt-3"
                  >
                    <div className="grid grid-cols-5 overflow-hidden rounded-lg border-t-4 border-accent bg-white shadow-2xl ring-1 ring-black/5">
                      <div className="col-span-2 bg-primary p-5 text-primary-foreground star-pattern">
                        <p className="eyebrow">{g.label}</p>
                        <p className="mt-2 text-sm leading-relaxed text-primary-foreground/85">{g.blurb}</p>
                      </div>
                      <ul className="col-span-3 py-2">
                        {g.items.map((item) => (
                          <li key={item.href + item.label}>
                            <Link href={item.href} className="block px-5 py-2.5 hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none">
                              <span className="block text-sm font-semibold text-primary">{item.label}</span>
                              {item.hint && <span className="block text-xs text-muted-foreground">{item.hint}</span>}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
            <Link href="/contact" className={cn('rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:text-primary', pathname.startsWith('/contact') ? 'text-primary' : 'text-foreground/75')}>
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden bg-accent font-semibold text-accent-foreground shadow hover:bg-accent/90 sm:inline-flex">
              <Link href="/admissions/apply">Apply Now</Link>
            </Button>

            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-6 w-6" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[22rem] max-w-[92vw] overflow-y-auto bg-primary p-0 text-primary-foreground">
                  <SheetTitle className="sr-only">Site menu</SheetTitle>
                  <div className="border-b border-white/15 p-5">
                    <p className="display-title text-2xl">Sibiah Star</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-accent">Pre-school to Grade 9</p>
                  </div>
                  <nav aria-label="Mobile" className="p-3">
                    {groups.map((g) => (
                      <details key={g.key} className="group border-b border-white/10">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3.5 text-base font-semibold">
                          {g.label}<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <ul className="pb-3">
                          {g.items.map((item) => (
                            <li key={item.href + item.label}>
                              <SheetClose asChild>
                                <Link href={item.href} className="block rounded px-6 py-2 text-sm text-primary-foreground/85 hover:bg-white/10 hover:text-accent">{item.label}</Link>
                              </SheetClose>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ))}
                    <SheetClose asChild><Link href="/contact" className="block border-b border-white/10 px-3 py-3.5 text-base font-semibold">Contact</Link></SheetClose>
                    <SheetClose asChild><Link href="/pay-fees" className="block px-3 py-3.5 text-base font-semibold">Pay school fees</Link></SheetClose>
                  </nav>
                  <div className="p-5">
                    <SheetClose asChild>
                      <Link href="/admissions/apply" className="block rounded-md bg-accent px-4 py-3 text-center font-semibold text-accent-foreground">Apply Now</Link>
                    </SheetClose>
                    <a href={`tel:${PHONE}`} className="mt-3 block text-center text-sm text-primary-foreground/80">Call (254) 721-412004</a>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
