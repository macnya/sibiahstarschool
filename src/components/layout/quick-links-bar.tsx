import Link from 'next/link';

const quickLinks = [
  { href: '/admissions', label: 'Apply Now' },
  { href: '/events', label: 'Upcoming Events' },
  { href: '/blog', label: 'School Blog' },
  { href: '/contact', label: 'Contact Us' },
  { href: '/facilities#transport', label: 'Transport Services' },
];

export function QuickLinksBar() {
  return (
    <div className="bg-accent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap">
        {quickLinks.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/80 transition-colors ${
              i !== quickLinks.length - 1 ? 'border-r border-accent-foreground/15' : ''
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
