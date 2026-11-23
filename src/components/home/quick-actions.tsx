import Link from 'next/link';
import { ArrowRight, CalendarCheck, ClipboardCheck, Search, Wallet } from 'lucide-react';

const ACTIONS = [
  { href: '/admissions/apply', title: 'Apply online', text: 'Start an application in about five minutes.', icon: ClipboardCheck },
  { href: '/admissions/status', title: 'Track your application', text: 'See where it is with your reference number.', icon: Search },
  { href: '/pay-fees', title: 'Pay school fees', text: 'Check the balance and pay by M-Pesa.', icon: Wallet },
  { href: '/contact', title: 'Book a school visit', text: 'Meet our teachers and see the classrooms.', icon: CalendarCheck },
];

/** The four things most visitors come to do, lifted over the bottom edge of the hero. */
export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="relative z-10 -mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="group flex h-full flex-col rounded-lg border-b-4 border-accent bg-white p-6 shadow-xl transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-accent"><a.icon className="h-6 w-6" aria-hidden="true" /></span>
                <span className="display-title text-xl text-primary">{a.title}</span>
                <span className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{a.text}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">Go <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
