import { createPublicClient } from '@/lib/supabase/public';
import { DEFAULTS_BY_PAGE, mergeContent, type ContentByPage, type SiteContentPage } from './defaults';

/**
 * Reads the editable content for a page and merges it over the hardcoded
 * defaults. Used by both the public page components and the admin editor
 * (content is public either way — this table has no private fields).
 *
 * Uses the cookie-free public client so these pages can stay statically
 * rendered/cached rather than hitting Supabase on every request.
 */
export async function getPageContent<P extends SiteContentPage>(
  page: P
): Promise<ContentByPage[P]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('site_content')
    .select('*')
    .eq('page', page)
    .maybeSingle();

  if (error) {
    console.error(`getPageContent(${page}):`, error.message);
  }

  return mergeContent(DEFAULTS_BY_PAGE[page], data?.content);
}
