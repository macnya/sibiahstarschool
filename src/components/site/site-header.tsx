import { getCampusLinks } from '@/lib/campuses/queries';
import { HeaderClient } from '@/components/site/header-client';

/** Server wrapper: reads the list of schools so the menu always shows every campus (including new ones). */
export async function SiteHeader() {
  const campuses = await getCampusLinks();
  return <HeaderClient campuses={campuses.map((c) => ({ name: c.name, slug: c.slug }))} />;
}
