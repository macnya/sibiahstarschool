import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Anonymous client for public content reads.
 *
 * The server client in ./server.ts reads cookies, and any page that reads
 * cookies is forced into dynamic rendering — meaning every visitor hits
 * Supabase. Public pages show the same published content to everyone, so
 * they use this cookie-free client instead and can be cached and
 * revalidated on a timer.
 *
 * Only ever use this for reading published, non-personalised content.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
