import Link from 'next/link';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import { getCampusLinks } from '@/lib/campuses/queries';

/** Only shown when the link is set (NEXT_PUBLIC_FACEBOOK_URL etc.), so there are never dead buttons. */
const SOCIAL = [
  { label: 'Facebook', short: 'FB', href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: 'Instagram', short: 'IG', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: 'YouTube', short: 'YT', href: process.env.NEXT_PUBLIC_YOUTUBE_URL },
  { label: 'WhatsApp', short: 'WA', href: process.env.NEXT_PUBLIC_WHATSAPP_URL },
].filter((s): s is { label: string; short: string; href: string } => Boolean(s.href));

/** Contact details shown when a school has not entered its own in Admin → Schools. */
const FALLBACK = {
  address: 'Baraka Mowlem, Behind Kinyago Secondary School, Nairobi',
  phones: ['+254721412004', '+254700337557', '+254720676660'],
  email: 'sibiahstarschool@gmail.com',
};

export async function SiteFooter() {
  const campuses = await getCampusLinks();
  const year = new Date().getFullYear();
  const h = 'text-sm font-semibold uppercase tracking-[0.2em] text-accent';
  const link = 'text-sm text-primary-foreground/75 transition-colors hover:text-accent';

  return (
    <footer className="bg-primary text-primary-foreground print:hidden">
      <div className="h-1 bg-accent" />
      <div className="star-pattern">
        <div className="container mx-auto px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><GraduationCap className="h-6 w-6" aria-hidden="true" /></span>
                <span className="display-title text-2xl">Sibiah Star</span>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/80">
                Nurturing young minds for a bright future — pre-school, primary and junior school, in a caring community where every child is known and challenged.
              </p>
              <div className="mt-5 flex gap-3">
                {SOCIAL.map((s) => (
                  <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-xs font-semibold transition-colors hover:border-accent hover:text-accent">
                    {s.short}
                  </a>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3">
              <h3 className={h}>Our Schools</h3>
              <ul className="mt-4 space-y-3">
                {campuses.length === 0 && <li><Link href="/schools" className={link}>All our schools</Link></li>}
                {campuses.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/schools/${c.slug}`} className="text-sm font-medium text-white hover:text-accent">{c.name}</Link>
                    {(c.town || c.phone) && <p className="text-xs text-primary-foreground/60">{[c.town, c.phone].filter(Boolean).join(' · ')}</p>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h3 className={h}>Explore</h3>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/about" className={link}>About us</Link></li>
                <li><Link href="/curriculum" className={link}>Curriculum</Link></li>
                <li><Link href="/facilities" className={link}>Facilities</Link></li>
                <li><Link href="/events" className={link}>Events</Link></li>
                <li><Link href="/blog" className={link}>News</Link></li>
                <li><Link href="/gallery" className={link}>Gallery</Link></li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h3 className={h}>Parents</h3>
              <ul className="mt-4 space-y-2.5">
                <li><Link href="/admissions/apply" className={link}>Apply online</Link></li>
                <li><Link href="/admissions/status" className={link}>Track an application</Link></li>
                <li><Link href="/pay-fees" className={link}>Pay school fees</Link></li>
                <li><Link href="/parent-portal" className={link}>Parent portal</Link></li>
                <li><Link href="/teacher-portal" className={link}>Teacher portal</Link></li>
                <li><Link href="/scholarships" className={link}>Scholarships</Link></li>
                <li><Link href="/contact" className={link}>Contact us</Link></li>
              </ul>
              <ul className="mt-6 space-y-3 text-sm text-primary-foreground/80">
                <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><span>{FALLBACK.address}</span></li>
                <li className="flex items-start gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <span>{FALLBACK.phones.map((p, i) => (<span key={p}>{i > 0 && ' / '}<a href={`tel:${p}`} className="hover:text-accent">{p.replace('+254', '0')}</a></span>))}</span>
                </li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><a href={`mailto:${FALLBACK.email}`} className="hover:text-accent">{FALLBACK.email}</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-primary-foreground/65 sm:flex-row">
            <p>&copy; {year} Sibiah Star Pre-school, Primary &amp; Junior School. All rights reserved.</p>
            <p><Link href="/privacy" className="hover:text-accent">Privacy notice</Link> · We welcome children of every background and ability.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
