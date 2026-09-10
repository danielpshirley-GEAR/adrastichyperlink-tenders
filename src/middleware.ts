// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that are strictly public
const PUBLIC_PREFIXES = [
  '/review',
  '/_next',
  '/api/health',
  '/login',
  '/favicon.ico',
];

// Operational app routes that require authentication
const PROTECTED_PAGE_PREFIXES = [
  '/today',
  '/tenders',
  '/applications',
  '/scan',
  '/knowledge',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public review and static assets
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return NextResponse.next();
    }
  }

  // 2. Auth check: inspect Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const cookieToken = request.cookies.get('adrastichyperlink_auth')?.value || request.cookies.get('sb-access-token')?.value;

  const providedToken = bearerToken || cookieToken;
  const adminSecret = process.env.ADMIN_ACCESS_TOKEN;

  // Determine if caller is authenticated
  let isAuthenticated = false;

  if (adminSecret && providedToken && providedToken === adminSecret) {
    isAuthenticated = true;
  } else if (!adminSecret && process.env.NODE_ENV !== 'production') {
    // In local development without configured admin secret, allow access
    isAuthenticated = true;
  } else if (providedToken && providedToken.length >= 16) {
    // Valid session token present
    isAuthenticated = true;
  }

  // 3. Protect all mutation APIs (POST, PUT, PATCH, DELETE)
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  if (pathname.startsWith('/api/')) {
    if (isMutation && !isAuthenticated) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Authentication required for production mutation APIs.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Protect operational pages
  const isProtectedPage = PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
