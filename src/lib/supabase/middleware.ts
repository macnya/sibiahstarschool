import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Refreshes the auth session on every request and guards /admin.
 *
 * Supabase access tokens are short-lived. Without this running in
 * middleware, a Server Component can read an expired token and the user
 * appears randomly logged out.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always getUser(), never getSession(), in server code. getSession reads
  // the cookie without verifying it, so it can be spoofed. getUser
  // revalidates against Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  const isAdminArea = pathname.startsWith('/admin');

  if (isAdminArea && !isLoginPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/staff-login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Portal inner pages need a login; the sign-in pages themselves stay public.
  const portalGuard: [string, string][] = [
    ['/parent-portal/dashboard', '/parent-portal'],
    ['/parent-portal/child', '/parent-portal'],
    ['/teacher-portal/dashboard', '/teacher-portal'],
    ['/teacher-portal/class', '/teacher-portal'],
    ['/staff/dashboard', '/staff-login'],
  ];
  for (const [prefix, login] of portalGuard) {
    if (!user && (pathname === prefix || pathname.startsWith(prefix + '/'))) {
      const url = request.nextUrl.clone();
      url.pathname = login;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return response;
}
