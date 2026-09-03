import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { EventProps } from '@/components/shared/event-card';
import type { BlogPostProps } from '@/components/shared/blog-post-card';
import type {
  EventRow,
  BlogPostRow,
  GalleryImageRow,
  ContactMessageRow,
} from '@/lib/supabase/types';

/**
 * Read-side queries for the public pages.
 *
 * EventCard and BlogPostCard expect `date` as an already-formatted string
 * (they were built against hardcoded data like "March 15, 2025"). The
 * database stores real `date` columns. Formatting happens here so those
 * components stay untouched.
 */

const PLACEHOLDER = 'https://placehold.co/600x400.png';

function formatDate(value: string): string {
  // Append T00:00:00 so the date is parsed in local time. Without it,
  // "2025-03-15" is read as UTC midnight and can render as March 14
  // for anyone west of UTC.
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toEventProps(row: EventRow): EventProps {
  return {
    title: row.title,
    date: formatDate(row.event_date),
    location: row.location,
    description: row.description,
    imageUrl: row.image_url ?? PLACEHOLDER,
    imageHint: row.image_hint ?? undefined,
    slug: row.slug,
  };
}

function toBlogPostProps(row: BlogPostRow): BlogPostProps {
  return {
    title: row.title,
    date: formatDate(row.published_at),
    author: row.author,
    excerpt: row.excerpt,
    imageUrl: row.image_url ?? PLACEHOLDER,
    imageHint: row.image_hint ?? undefined,
    slug: row.slug,
  };
}

// --- public reads -----------------------------------------------------

export async function getPublishedEvents(): Promise<EventProps[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .order('event_date', { ascending: true });

  if (error) {
    // Log and degrade to an empty list. A database hiccup should render
    // the page's empty state, not a 500 for a visiting parent.
    console.error('getPublishedEvents:', error.message);
    return [];
  }
  return (data ?? []).map(toEventProps);
}

export async function getPublishedPosts(): Promise<BlogPostProps[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('getPublishedPosts:', error.message);
    return [];
  }
  return (data ?? []).map(toBlogPostProps);
}

export async function getPublishedGallery(): Promise<GalleryImageRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('getPublishedGallery:', error.message);
    return [];
  }
  return data ?? [];
}

// --- admin reads (RLS restricts these to editors/admins) --------------

export async function getAllEvents(): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: false });
  return data ?? [];
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data ?? null;
}

export async function getAllPosts(): Promise<BlogPostRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false });
  return data ?? [];
}

export async function getPostById(id: string): Promise<BlogPostRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data ?? null;
}

export async function getAllGalleryImages(): Promise<GalleryImageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('gallery_images')
    .select('*')
    .order('sort_order', { ascending: true });
  return data ?? [];
}

export async function getContactMessages(): Promise<ContactMessageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getDashboardCounts() {
  const supabase = await createClient();
  const count = { count: 'exact' as const, head: true };

  const [events, posts, images, unread] = await Promise.all([
    supabase.from('events').select('*', count),
    supabase.from('blog_posts').select('*', count),
    supabase.from('gallery_images').select('*', count),
    supabase.from('contact_messages').select('*', count).eq('handled', false),
  ]);

  return {
    events: events.count ?? 0,
    posts: posts.count ?? 0,
    images: images.count ?? 0,
    unreadMessages: unread.count ?? 0,
  };
}
