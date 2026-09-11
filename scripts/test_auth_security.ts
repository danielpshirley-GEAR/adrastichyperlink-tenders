// scripts/test_auth_security.ts
import assert from 'assert';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { POST as loginPost, GET as loginGet } from '../src/app/api/auth/login/route';
import { GET as reclassifyGet } from '../src/app/api/tenders/reclassify/route';
import { createSessionToken, verifySessionToken, AUTH_COOKIE_NAME } from '../src/shared/auth/session';

export async function runAuthSecurityTests(): Promise<void> {
  console.log('====================================================');
  console.log('RUNNING AUTHENTICATION & SECURITY TEST SUITE');
  console.log('====================================================\n');

  const TEST_ADMIN_TOKEN = 'test-audit-admin-token-secure-12345';
  const TEST_SESSION_SECRET = 'test-session-secret-hmac-sha256-67890';

  // Configure test environment secrets
  process.env.ADMIN_ACCESS_TOKEN = TEST_ADMIN_TOKEN;
  process.env.SESSION_SECRET = TEST_SESSION_SECRET;

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  // 1. Arbitrary 16-character token -> 401
  await test('1. Arbitrary 16-character token returns 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=1234567890123456` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 2. Arbitrary 100-character token -> 401
  await test('2. Arbitrary 100-character token returns 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${'A'.repeat(100)}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 3. No cookie GET /api/tenders -> 401
  await test('3. Unauthenticated GET /api/tenders returns 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders', { method: 'GET' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 4. No cookie GET /api/applications -> 401
  await test('4. Unauthenticated GET /api/applications returns 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/applications', { method: 'GET' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 5. No cookie POST /api/scan -> 401
  await test('5. Unauthenticated POST /api/scan returns 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/scan', { method: 'POST' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 6. No cookie POST /api/tenders/reclassify -> 401
  await test('6. Unauthenticated POST /api/tenders/reclassify returns 401 Unauthorized', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders/reclassify', { method: 'POST' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 7. GET /api/tenders/reclassify -> 405 Method Not Allowed
  await test('7. GET /api/tenders/reclassify returns 405 Method Not Allowed with Allow: POST', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders/reclassify', { method: 'GET' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get('allow'), 'POST');

    // Also verify route handler directly
    const directRes = await reclassifyGet();
    assert.strictEqual(directRes.status, 405);
    assert.strictEqual(directRes.headers.get('allow'), 'POST');
  });

  // 8. GET /api/health -> 200 OK (Public route)
  await test('8. Public GET /api/health returns 200 OK without authentication', async () => {
    const req = new NextRequest('http://localhost:3000/api/health', { method: 'GET' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 200);
  });

  // 9. Valid login -> signed session cookie created (never raw master token)
  let validSessionCookie = '';
  await test('9. Valid login issues cryptographically signed session cookie (not master token)', async () => {
    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: TEST_ADMIN_TOKEN }),
    });
    const loginRes = await loginPost(loginReq);
    assert.strictEqual(loginRes.status, 200);

    const setCookie = loginRes.headers.get('set-cookie');
    assert.ok(setCookie, 'set-cookie header must be present');
    assert.ok(setCookie.includes('HttpOnly'), 'Cookie must be HttpOnly');

    const match = setCookie.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
    assert.ok(match && match[1], 'Session cookie value must be present');
    validSessionCookie = match[1];

    // Verify it is NOT the master token literal
    assert.notStrictEqual(validSessionCookie, TEST_ADMIN_TOKEN, 'Session cookie must not be master token');

    // Verify cryptographic signature and claims
    const payload = await verifySessionToken(validSessionCookie);
    assert.ok(payload, 'Session token must verify successfully');
    assert.strictEqual(payload.sub, 'admin');
    assert.strictEqual(payload.role, 'admin');
    assert.ok(payload.exp > Math.floor(Date.now() / 1000));
  });

  // 10. Signed session GET /api/tenders -> 200 (Allowed through middleware)
  await test('10. Valid signed session cookie allows GET /api/tenders through middleware', async () => {
    assert.ok(validSessionCookie, 'Preceding test must have issued a valid session cookie');
    const req = new NextRequest('http://localhost:3000/api/tenders', {
      method: 'GET',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${validSessionCookie}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 200);
  });

  // 11. Tampered session cookie -> 401
  await test('11. Tampered session cookie signature returns 401 Unauthorized', async () => {
    assert.ok(validSessionCookie, 'Preceding test must have issued a valid session cookie');
    const tampered = validSessionCookie.slice(0, -6) + 'xxxxxx';
    const req = new NextRequest('http://localhost:3000/api/tenders', {
      method: 'GET',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${tampered}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 12. Expired session -> 401
  await test('12. Expired session token returns 401 Unauthorized', async () => {
    const expiredToken = await createSessionToken({ ttlSeconds: -60 });
    const req = new NextRequest('http://localhost:3000/api/tenders', {
      method: 'GET',
      headers: { cookie: `${AUTH_COOKIE_NAME}=${expiredToken}` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 13. Operational Pages Protection -> Redirect to /login
  await test('13. Operational UI pages (/today, /tenders, /) redirect unauthenticated users to /login', async () => {
    const reqToday = new NextRequest('http://localhost:3000/today');
    const resToday = await middleware(reqToday);
    assert.strictEqual(resToday.status, 307);
    assert.ok(resToday.headers.get('location')?.includes('/login?redirect=%2Ftoday'));

    const reqRoot = new NextRequest('http://localhost:3000/');
    const resRoot = await middleware(reqRoot);
    assert.strictEqual(resRoot.status, 307);
    assert.ok(resRoot.headers.get('location')?.includes('/login'));
  });

  // 14. Fail-closed check: missing environment secret fails closed
  await test('14. Missing environment credentials fail closed safely', async () => {
    delete process.env.ADMIN_ACCESS_TOKEN;
    delete process.env.SESSION_SECRET;

    const req = new NextRequest('http://localhost:3000/api/tenders');
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);

    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'attempt' }),
    });
    const loginRes = await loginPost(loginReq);
    assert.strictEqual(loginRes.status, 500);

    // Restore test credentials
    process.env.ADMIN_ACCESS_TOKEN = TEST_ADMIN_TOKEN;
    process.env.SESSION_SECRET = TEST_SESSION_SECRET;
  });

  console.log(`\n====================================================`);
  console.log(`AUTH SUITE COMPLETE: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================\n');
}

// Run standalone if executed directly
if (require.main === module) {
  runAuthSecurityTests().catch((err) => {
    console.error('Fatal auth test runner error:', err);
    process.exit(1);
  });
}
