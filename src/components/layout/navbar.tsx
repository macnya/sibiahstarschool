
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, School, Home, Info, Users, BookOpen, Building, Image as ImageIcon, Mail, CalendarDays, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/about', label: 'About Us', icon: Info },
  { href: '/admissions', label: 'Admissions', icon: Users },
  { href: '/curriculum', label: 'Curriculum', icon: BookOpen },
  { href: '/facilities', label: 'Facilities', icon: Building },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/blog', label: 'Blog', icon: Newspaper },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/contact', label: 'Contact Us', icon: Mail },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null; 
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity">
            <School className="h-8 w-8 text-accent" />
            <span className="text-xl font-bold tracking-tight">Sibiah Star School</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === link.href ? 'bg-accent text-accent-foreground' : 'hover:bg-primary-foreground hover:text-primary',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile Navigation Trigger */}
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-primary text-primary-foreground p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-primary-foreground/20">
                    <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
                      <School className="h-8 w-8 text-accent" />
                      <span className="text-xl font-bold">Sibiah Star</span>
                    </Link>
                  </div>
                  <nav className="flex-grow p-4 space-y-2">
                    {navLinks.map((link) => (
                       <SheetClose key={link.href} asChild>
                        <Link
                          href={link.href}
                          className={cn(
                            "flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors",
                            pathname.startsWith(link.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-primary-foreground hover:text-primary',
                          )}
                        >
                          <link.icon className="mr-3 h-5 w-5" />
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
