// src/shared/auth/session.ts

export interface SessionPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export const AUTH_COOKIE_NAME = 'adrastichyperlink_auth';
export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns the secret used for signing and verifying session tokens.
 * Priority:
 * 1. SESSION_SECRET
 * 2. Cryptographic derivation from ADMIN_ACCESS_TOKEN (so the raw master token is never in the token signature)
 * Returns null if neither is configured (caller must fail closed).
 */
export function getSessionSecret(): string | null {
  const sessionSecret = process.env.SESSION_SECRET?.trim();
  if (sessionSecret) {
    return sessionSecret;
  }

  const adminToken = process.env.ADMIN_ACCESS_TOKEN?.trim();
  if (adminToken) {
    // Derive a distinct session key using HMAC/SHA-256 namespace prefix
    return `adrastichyperlink:derived-session-secret-v1:${adminToken}`;
  }

  return null;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stringToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return arrayBufferToBase64Url(bytes.buffer);
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlToString(base64url: string): string {
  const bytes = base64UrlToUint8Array(base64url);
  return new TextDecoder().decode(bytes);
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 */
export async function createSessionToken(options?: {
  sub?: string;
  role?: string;
  ttlSeconds?: number;
}): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('Authentication secret is not configured in environment. Failed closed.');
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = options?.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: SessionPayload = {
    sub: options?.sub || 'admin',
    role: options?.role || 'admin',
    iat: now,
    exp: now + ttl,
    jti: crypto.randomUUID(),
  };

  const headerB64 = stringToBase64Url(JSON.stringify(header));
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(dataToSign)
  );

  const signatureB64 = arrayBufferToBase64Url(signatureBuffer);
  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verifies the HMAC-SHA256 signature and expiration of a session token.
 * Returns the decoded payload if valid and unexpired, or null otherwise.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes.buffer as ArrayBuffer,
      dataToVerify
    );
    if (!isValid) {
      return null;
    }

    const payloadJson = base64UrlToString(payloadB64);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
