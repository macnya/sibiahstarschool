import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * In Next.js 15 `cookies()` is async, so this function is async too — you
 * must `await createClient()`. Forgetting the await is the most common
 * error when wiring this up.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies. This throw is expected
            // and safe to swallow: middleware.ts refreshes the session
            // instead. Do not "fix" this by removing the try/catch.
          }
        },
      },
    }
  );
}
