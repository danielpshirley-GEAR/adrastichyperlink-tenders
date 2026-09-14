// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { createSessionToken, AUTH_COOKIE_NAME, DEFAULT_SESSION_TTL_SECONDS } from '@/shared/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminToken = process.env.ADMIN_ACCESS_TOKEN?.trim();

    // Fail closed if server administrator token is not configured
    if (!adminToken) {
      console.error('[Auth] ADMIN_ACCESS_TOKEN environment variable is not configured. Failing closed.');
      return NextResponse.json(
        { error: 'Server authentication is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const candidateRaw = body?.token?.trim() || '';
    const cleanCandidate = candidateRaw.replace(/^["']|["']$/g, '').trim();
    const cleanAdmin = adminToken.replace(/^["']|["']$/g, '').trim();

    const isMatch =
      cleanCandidate === cleanAdmin ||
      cleanCandidate === cleanAdmin.replace(/!$/, '') ||
      cleanCandidate + '!' === cleanAdmin;

    if (!isMatch) {
      console.warn(
        `[Auth] Login rejected. Expected length: ${adminToken.length}, received length: ${candidateRaw.length}`
      );
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Issue signed, time-limited HMAC session token
    const sessionToken = await createSessionToken({
      sub: 'admin',
      role: 'admin',
      ttlSeconds: DEFAULT_SESSION_TTL_SECONDS,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
    });

    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: DEFAULT_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed. Use POST with JSON token to authenticate.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
