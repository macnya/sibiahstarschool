import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SITE_CONTENT_PAGES } from '@/lib/site-content/defaults';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, { title: string; description: string }> = {
  home: { title: 'Home page', description: 'Hero text, highlights, and section headings.' },
  about: { title: 'About page', description: "Our story, mission, vision, values, director's message, team." },
  admissions: { title: 'Admissions page', description: 'Admission steps, requirements by level, AI guide callout, and application forms.' },
  facilities: { title: 'Facilities page', description: 'Facility list, transport details, and amenities.' },
  curriculum: { title: 'Curriculum page', description: 'Level descriptions, key areas, and extracurriculars.' },
  contact: { title: 'Contact info', description: 'Address, phone, email, and office hours shown on the Contact page.' },
};

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Site content</h1>
        <p className="text-sm text-muted-foreground">
          Edit the text on the public pages. Blog posts, events, gallery, and messages have their
          own sections in the sidebar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SITE_CONTENT_PAGES.map((page) => (
          <Link
            key={page}
            href={`/admin/content/${page}`}
            className="flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:bg-muted"
          >
            <div>
              <p className="font-medium text-primary">{LABELS[page].title}</p>
              <p className="text-sm text-muted-foreground">{LABELS[page].description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
