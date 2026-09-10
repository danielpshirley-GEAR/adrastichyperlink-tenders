// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const adminToken = process.env.ADMIN_ACCESS_TOKEN || 'admin-secret-dev';

    if (!token || token.trim() !== adminToken.trim()) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('adrastichyperlink_auth', token.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
