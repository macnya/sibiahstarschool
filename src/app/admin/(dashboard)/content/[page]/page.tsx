import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SITE_CONTENT_PAGES, type SiteContentPage } from '@/lib/site-content/defaults';
import { getPageContent } from '@/lib/site-content/queries';
import { HomeContentForm } from '@/components/admin/content/home-content-form';
import { AboutContentForm } from '@/components/admin/content/about-content-form';
import { FacilitiesContentForm } from '@/components/admin/content/facilities-content-form';
import { CurriculumContentForm } from '@/components/admin/content/curriculum-content-form';
import { ContactContentForm } from '@/components/admin/content/contact-content-form';

export const dynamic = 'force-dynamic';

const TITLES: Record<SiteContentPage, string> = {
  home: 'Home page content',
  about: 'About page content',
  facilities: 'Facilities page content',
  curriculum: 'Curriculum page content',
  contact: 'Contact info',
};

function isSiteContentPage(value: string): value is SiteContentPage {
  return (SITE_CONTENT_PAGES as readonly string[]).includes(value);
}

export default async function AdminContentEditPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (!isSiteContentPage(page)) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/content"
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All content
        </Link>
        <h1 className="text-2xl font-semibold text-primary">{TITLES[page]}</h1>
      </div>

      <ContentForm page={page} />
    </div>
  );
}

async function ContentForm({ page }: { page: SiteContentPage }) {
  switch (page) {
    case 'home': {
      const content = await getPageContent('home');
      return <HomeContentForm initial={content} />;
    }
    case 'about': {
      const content = await getPageContent('about');
      return <AboutContentForm initial={content} />;
    }
    case 'facilities': {
      const content = await getPageContent('facilities');
      return <FacilitiesContentForm initial={content} />;
    }
    case 'curriculum': {
      const content = await getPageContent('curriculum');
      return <CurriculumContentForm initial={content} />;
    }
    case 'contact': {
      const content = await getPageContent('contact');
      return <ContactContentForm initial={content} />;
    }
  }
}
