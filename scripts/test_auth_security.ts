// scripts/test_auth_security.ts
import assert from 'assert';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { GET as tendersGet } from '../src/app/api/tenders/route';
import { GET as applicationsGet } from '../src/app/api/applications/route';
import { POST as scanPost } from '../src/app/api/scan/route';
import { POST as reclassifyPost, GET as reclassifyGet } from '../src/app/api/tenders/reclassify/route';
import { GET as healthGet } from '../src/app/api/health/route';
import { POST as loginPost } from '../src/app/api/auth/login/route';
import { createSessionToken, verifySessionToken, AUTH_COOKIE_NAME } from '../src/shared/auth/session';
import { requireApiAuth } from '../src/shared/auth/require-api-auth';

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

  // ----------------------------------------------------
  // SECTION 1: DIRECT ROUTE HANDLER AUTHORIZATION TESTS
  // (Verifies routes reject unauthorized requests even if middleware is bypassed)
  // ----------------------------------------------------

  // 1. Direct unauthenticated GET /api/tenders -> 401
  await test('1. Direct unauth GET /api/tenders returns 401 and ZERO data', async () => {
    const res = await tendersGet(new Request('http://localhost:3000/api/tenders'));
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized');
    assert.strictEqual(body.code, 'AUTH_REQUIRED');
    assert.strictEqual(body.tenders, undefined);
  });

  // 2. Direct unauthenticated GET /api/applications -> 401
  await test('2. Direct unauth GET /api/applications returns 401 and ZERO data', async () => {
    const res = await applicationsGet(new Request('http://localhost:3000/api/applications'));
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized');
    assert.strictEqual(body.code, 'AUTH_REQUIRED');
    assert.strictEqual(body.applications, undefined);
  });

  // 3. Direct unauthenticated POST /api/scan -> 401
  await test('3. Direct unauth POST /api/scan returns 401', async () => {
    const res = await scanPost(new Request('http://localhost:3000/api/scan', { method: 'POST' }));
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized');
    assert.strictEqual(body.code, 'AUTH_REQUIRED');
  });

  // 4. Direct unauthenticated POST /api/tenders/reclassify -> 401
  await test('4. Direct unauth POST /api/tenders/reclassify returns 401', async () => {
    const res = await reclassifyPost(new Request('http://localhost:3000/api/tenders/reclassify', { method: 'POST' }));
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized');
    assert.strictEqual(body.code, 'AUTH_REQUIRED');
  });

  // 5. Direct unauthenticated GET /api/health -> 200 (Public)
  await test('5. Direct unauth GET /api/health returns 200 OK', async () => {
    const res = await healthGet();
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.runtime);
  });

  // 6. Direct GET /api/tenders with valid signed session cookie -> 200
  let testSessionCookie = '';
  await test('6. Direct GET /api/tenders with valid signed session cookie returns 200', async () => {
    testSessionCookie = await createSessionToken({ sub: 'admin', role: 'admin' });
    const req = new Request('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${testSessionCookie}` },
    });
    const res = await tendersGet(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok('tenders' in body);
  });

  // 7. Direct GET /api/tenders with valid Bearer ADMIN_ACCESS_TOKEN -> 200
  await test('7. Direct GET /api/tenders with valid Bearer ADMIN_ACCESS_TOKEN returns 200', async () => {
    const req = new Request('http://localhost:3000/api/tenders', {
      headers: { authorization: `Bearer ${TEST_ADMIN_TOKEN}` },
    });
    const res = await tendersGet(req);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok('tenders' in body);
  });

  // 8. Direct GET /api/tenders with random 100-character token -> 401
  await test('8. Direct GET /api/tenders with random 100-char token returns 401', async () => {
    const req = new Request('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${'A'.repeat(100)}` },
    });
    const res = await tendersGet(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized');
  });

  // 9. Direct GET /api/tenders with tampered session cookie -> 401
  await test('9. Direct GET /api/tenders with tampered session returns 401', async () => {
    const tampered = testSessionCookie.slice(0, -6) + 'xxxxxx';
    const req = new Request('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${tampered}` },
    });
    const res = await tendersGet(req);
    assert.strictEqual(res.status, 401);
  });

  // 10. Direct GET /api/tenders with expired session cookie -> 401
  await test('10. Direct GET /api/tenders with expired session returns 401', async () => {
    const expired = await createSessionToken({ ttlSeconds: -60 });
    const req = new Request('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${expired}` },
    });
    const res = await tendersGet(req);
    assert.strictEqual(res.status, 401);
  });

  // 11. Direct GET /api/tenders/reclassify -> 405 Method Not Allowed
  await test('11. Direct GET /api/tenders/reclassify returns 405 with Allow: POST', async () => {
    const res = await reclassifyGet();
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get('allow'), 'POST');
  });

  // ----------------------------------------------------
  // SECTION 2: MIDDLEWARE DEFENSE-IN-DEPTH TESTS
  // ----------------------------------------------------

  // 12. Middleware rejects unauthenticated GET /api/tenders
  await test('12. Middleware rejects unauthenticated GET /api/tenders with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders', { method: 'GET' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized');
    assert.strictEqual(body.code, 'AUTH_REQUIRED');
  });

  // 13. Middleware rejects arbitrary 16-character token bypass
  await test('13. Middleware rejects arbitrary 16-character token with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=1234567890123456` },
    });
    const res = await middleware(req);
    assert.strictEqual(res.status, 401);
  });

  // 14. Middleware rejects GET /api/tenders/reclassify with 405
  await test('14. Middleware rejects GET /api/tenders/reclassify with 405 Allow: POST', async () => {
    const req = new NextRequest('http://localhost:3000/api/tenders/reclassify', { method: 'GET' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get('allow'), 'POST');
  });

  // 15. Middleware allows public /api/health
  await test('15. Middleware passes public GET /api/health with 200', async () => {
    const req = new NextRequest('http://localhost:3000/api/health', { method: 'GET' });
    const res = await middleware(req);
    assert.strictEqual(res.status, 200);
  });

  // 16. Middleware redirects operational UI pages to /login
  await test('16. Middleware redirects unauthenticated /today and / to /login', async () => {
    const reqToday = new NextRequest('http://localhost:3000/today');
    const resToday = await middleware(reqToday);
    assert.strictEqual(resToday.status, 307);
    assert.ok(resToday.headers.get('location')?.includes('/login'));

    const reqRoot = new NextRequest('http://localhost:3000/');
    const resRoot = await middleware(reqRoot);
    assert.strictEqual(resRoot.status, 307);
    assert.ok(resRoot.headers.get('location')?.includes('/login'));
  });

  // 17. Login endpoint issues signed session cookie and never reveals master token
  await test('17. POST /api/auth/login issues signed session cookie', async () => {
    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: TEST_ADMIN_TOKEN }),
    });
    const loginRes = await loginPost(loginReq);
    assert.strictEqual(loginRes.status, 200);

    const setCookie = loginRes.headers.get('set-cookie');
    assert.ok(setCookie?.includes('HttpOnly'));
    const match = setCookie.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
    assert.ok(match && match[1]);
    assert.notStrictEqual(match[1], TEST_ADMIN_TOKEN);

    const verified = await verifySessionToken(match[1]);
    assert.ok(verified);
    assert.strictEqual(verified.role, 'admin');
  });

  // 18. Client source contains no hardcoded preview credential or PREVIEW_DEFAULT_TOKEN
  await test('18. Client source contains no hardcoded preview credential', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const loginFilePath = path.resolve(__dirname, '../src/app/login/page.tsx');
    const content = fs.readFileSync(loginFilePath, 'utf8');

    assert.ok(!content.includes('PREVIEW_DEFAULT_TOKEN'), 'Must not define PREVIEW_DEFAULT_TOKEN');
    assert.ok(!content.includes('admin-preview'), 'Must not contain any literal preview credential');
    assert.ok(!content.includes('adrastichyperlink-admin'), 'Must not contain literal admin secret');
  });

  // 19. /login?token=anything does NOT auto-login (no query param credential ingestion)
  await test('19. Login page does NOT read token credentials from URL query parameters', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const loginFilePath = path.resolve(__dirname, '../src/app/login/page.tsx');
    const content = fs.readFileSync(loginFilePath, 'utf8');

    assert.ok(!content.includes("searchParams.get('token')"), 'Must not read searchParams.get("token")');
    assert.ok(!content.includes('searchParams.get("token")'), 'Must not read searchParams.get("token")');
    assert.ok(!content.includes('queryToken'), 'Must not ingest queryToken');
  });

  // 20. Fill Preview Token button does not exist
  await test('20. "Fill Preview Token" button does not exist in login component', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const loginFilePath = path.resolve(__dirname, '../src/app/login/page.tsx');
    const content = fs.readFileSync(loginFilePath, 'utf8');

    assert.ok(!content.includes('Fill Preview Token'), 'Must not contain "Fill Preview Token" text');
    assert.ok(!content.includes('handleFillPreviewToken'), 'Must not define handleFillPreviewToken function');
  });

  // 21. Incorrect token missing one character -> 401
  await test('21. Incorrect token missing one character returns 401', async () => {
    const truncatedToken = TEST_ADMIN_TOKEN.slice(0, -1);
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: truncatedToken }),
    });
    const res = await loginPost(req);
    assert.strictEqual(res.status, 401);
  });

  // 22. Incorrect token with extra character -> 401
  await test('22. Incorrect token with extra character returns 401', async () => {
    const extendedToken = TEST_ADMIN_TOKEN + '!';
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: extendedToken }),
    });
    const res = await loginPost(req);
    assert.strictEqual(res.status, 401);
  });

  // 23. Exact ADMIN_ACCESS_TOKEN -> login succeeds with 200 and signed session cookie
  await test('23. Exact ADMIN_ACCESS_TOKEN succeeds with 200 and signed cookie', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: TEST_ADMIN_TOKEN }),
    });
    const res = await loginPost(req);
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes(AUTH_COOKIE_NAME));
  });

  // 24. Signed session -> authenticated access succeeds; tampered session -> 401
  await test('24. Signed session succeeds (200), tampered session returns 401', async () => {
    const validSession = await createSessionToken({ sub: 'admin', role: 'admin' });
    const reqValid = new Request('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${validSession}` },
    });
    const resValid = await tendersGet(reqValid);
    assert.strictEqual(resValid.status, 200, 'Valid signed session must return 200');

    // Tampered session
    const tampered = validSession.slice(0, -5) + 'xxxxx';
    const reqTampered = new Request('http://localhost:3000/api/tenders', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${tampered}` },
    });
    const resTampered = await tendersGet(reqTampered);
    assert.strictEqual(resTampered.status, 401, 'Tampered session must return 401');
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
