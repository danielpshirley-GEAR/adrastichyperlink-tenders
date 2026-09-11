// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, AUTH_COOKIE_NAME } from '@/shared/auth/session';

// Routes that are strictly public (no authentication required)
const PUBLIC_PREFIXES = [
  '/review',
  '/_next',
  '/api/health',
  '/api/auth/login',
  '/login',
  '/favicon.ico',
];

// Operational app pages that require authentication
const PROTECTED_PAGE_PREFIXES = [
  '/today',
  '/tenders',
  '/applications',
  '/scan',
  '/knowledge',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow strictly public routes and static assets
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return NextResponse.next();
    }
  }

  // 2. Reclassification route safety: GET must never execute reclassification
  if (pathname === '/api/tenders/reclassify' && request.method === 'GET') {
    return NextResponse.json(
      {
        error: 'Method Not Allowed',
        message: 'Reclassification sweep mutates state and must be triggered via POST.',
      },
      {
        status: 405,
        headers: {
          Allow: 'POST',
        },
      }
    );
  }

  // 3. Auth check: inspect Authorization header and signed session cookies
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const cookieToken =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.cookies.get('sb-access-token')?.value;

  const adminSecret = process.env.ADMIN_ACCESS_TOKEN?.trim();
  let isAuthenticated = false;

  // Check 3a: Direct Bearer token authentication (for CLI/scripts using ADMIN_ACCESS_TOKEN)
  if (adminSecret && bearerToken && bearerToken === adminSecret) {
    isAuthenticated = true;
  }
  // Check 3b: Bearer token containing a valid signed HMAC session token
  else if (bearerToken) {
    const session = await verifySessionToken(bearerToken);
    if (session) {
      isAuthenticated = true;
    }
  }

  // Check 3c: HttpOnly cookie containing a valid signed HMAC session token
  if (!isAuthenticated && cookieToken) {
    const session = await verifySessionToken(cookieToken);
    if (session) {
      isAuthenticated = true;
    }
  }

  // 4. Protect ALL operational APIs (GET, POST, PUT, PATCH, DELETE)
  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Authentication required for operational APIs.',
          code: 'AUTH_REQUIRED',
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Protect operational pages
  const isProtectedPage =
    pathname === '/' ||
    PROTECTED_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
    );

  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
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
