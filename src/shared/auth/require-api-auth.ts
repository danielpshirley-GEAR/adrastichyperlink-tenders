// src/shared/auth/require-api-auth.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, AUTH_COOKIE_NAME, SessionPayload } from '@/shared/auth/session';

export type ApiAuthResult =
  | {
      authenticated: true;
      role: string;
      sub: string;
      session?: SessionPayload;
    }
  | {
      authenticated: false;
      response: NextResponse;
    };

function extractBearerToken(request: Request | NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1].trim();
  }
  return null;
}

function extractCookie(request: Request | NextRequest, cookieName: string): string | null {
  // 1. NextRequest cookie support
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const val = (request as NextRequest).cookies.get(cookieName)?.value;
    if (val) return val.trim();
  }

  // 2. Standard Web Request Header parsing
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
  if (match) {
    try {
      return decodeURIComponent(match[1].trim());
    } catch {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Route-level authorization helper.
 * Validates either:
 * A. Valid signed HMAC session token from HttpOnly cookie (AUTH_COOKIE_NAME)
 * B. Exact ADMIN_ACCESS_TOKEN Bearer token for approved server automation
 *
 * Fails closed. Returns { authenticated: true, ... } or { authenticated: false, response: 401 NextResponse }.
 */
export async function requireApiAuth(
  request?: Request | NextRequest | null
): Promise<ApiAuthResult> {
  const unauthorizedResponse = NextResponse.json(
    {
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
    },
    { status: 401 }
  );

  if (!request) {
    return { authenticated: false, response: unauthorizedResponse };
  }

  const adminSecret = process.env.ADMIN_ACCESS_TOKEN?.trim();
  const bearerToken = extractBearerToken(request);

  // B. Exact ADMIN_ACCESS_TOKEN Bearer authentication for server automation
  if (adminSecret && adminSecret.length > 0 && bearerToken && bearerToken === adminSecret) {
    return {
      authenticated: true,
      role: 'admin',
      sub: 'admin',
    };
  }

  // A. Valid signed HMAC session cookie
  const cookieToken =
    extractCookie(request, AUTH_COOKIE_NAME) ||
    extractCookie(request, 'sb-access-token');

  if (cookieToken) {
    const session = await verifySessionToken(cookieToken);
    if (session) {
      return {
        authenticated: true,
        role: session.role || 'admin',
        sub: session.sub,
        session,
      };
    }
  }

  // Also support signed session token provided via Bearer header
  if (bearerToken) {
    const session = await verifySessionToken(bearerToken);
    if (session) {
      return {
        authenticated: true,
        role: session.role || 'admin',
        sub: session.sub,
        session,
      };
    }
  }

  // Authentication failed: fail closed
  return {
    authenticated: false,
    response: unauthorizedResponse,
  };
}
