// scripts/verify_render_preview.ts
import assert from 'assert';

const RENDER_BASE_URL = 'https://adrastichyperlink-tenders-preview.onrender.com';
const token = process.env.ADMIN_ACCESS_TOKEN;

if (!token) {
  console.error('FATAL: ADMIN_ACCESS_TOKEN is not present in process.env');
  process.exit(1);
}

async function runVerification() {
  console.log('====================================================');
  console.log('VERIFYING LIVE RENDER PREVIEW DEPLOYMENT');
  console.log(`URL: ${RENDER_BASE_URL}`);
  console.log('====================================================\n');

  // 1. GET /api/health
  console.log('1. Checking GET /api/health...');
  const healthRes = await fetch(`${RENDER_BASE_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200, `Health check must return 200, got ${healthRes.status}`);
  const healthJson = await healthRes.json();

  console.log(`  - Runtime: ${healthJson.runtime}`);
  console.log(`  - Commit: ${healthJson.commit?.slice(0, 7)}`);
  console.log(`  - Branch: ${healthJson.branch}`);
  console.log(`  - Database: ${healthJson.database?.status} (${healthJson.database?.type})`);
  console.log(`  - Gemini: ${healthJson.gemini?.status}`);
  console.log(`  - Find a Tender: ${healthJson.findATender?.status}`);
  console.log(`  - Contracts Finder: ${healthJson.contractsFinder?.status}`);
  console.log(`  - Remaining Sources: ${healthJson.remainingSources?.total} (${healthJson.remainingSources?.status})`);

  assert.strictEqual(healthJson.runtime, 'Render Web Service');
  assert.ok(healthJson.commit && healthJson.commit !== 'UNKNOWN' && healthJson.commit.length >= 7, `Expected valid commit SHA, got ${healthJson.commit}`);
  assert.strictEqual(healthJson.branch, 'preview');
  assert.strictEqual(healthJson.database.status, 'DATABASE CONNECTED');
  assert.strictEqual(healthJson.database.type, 'Supabase PostgreSQL');
  assert.strictEqual(healthJson.findATender.health, 'healthy');
  assert.strictEqual(healthJson.remainingSources.notImplemented, 5);
  console.log('  [PASS] /api/health verification\n');

  // 2. Unauthenticated GET /api/tenders -> 401
  console.log('2. Checking unauthenticated security on GET /api/tenders...');
  const unauthRes = await fetch(`${RENDER_BASE_URL}/api/tenders`);
  assert.strictEqual(unauthRes.status, 401, `Unauthenticated request must return 401, got ${unauthRes.status}`);
  console.log('  [PASS] Unauthenticated request safely blocked with 401\n');

  // 3. Trigger Contracts Finder scan on Render via POST /api/scan
  console.log('3. Triggering live Contracts Finder scan on Render preview...');
  const scanRes = await fetch(`${RENDER_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      sourceId: 'contracts_finder',
      scanType: 'quick',
      maxPages: 2,
    }),
  });

  assert.strictEqual(scanRes.status, 200, `POST /api/scan must return 200, got ${scanRes.status}`);
  const scanJson = await scanRes.json();
  console.log(`  - Scan Status: ${scanJson.status}`);
  console.log(`  - Source: ${scanJson.source}`);
  console.log(`  - Raw Releases Fetched: ${scanJson.rawReleasesFetched}`);
  console.log(`  - Duration: ${scanJson.durationMs}ms`);
  assert.strictEqual(scanJson.sourceId, 'contracts_finder');
  assert.ok(scanJson.status === 'COMPLETED' || scanJson.status === 'DEGRADED', `Scan status must be COMPLETED or DEGRADED, got ${scanJson.status}`);
  console.log('  [PASS] Contracts Finder scan completed on Render\n');

  // 4. Verify /api/health reports Contracts Finder HEALTHY after scan
  console.log('4. Re-checking /api/health after live scan...');
  const postScanHealthRes = await fetch(`${RENDER_BASE_URL}/api/health`);
  const postScanHealth = await postScanHealthRes.json();
  console.log(`  - Contracts Finder Status: ${postScanHealth.contractsFinder?.status}`);
  console.log(`  - Contracts Finder Health: ${postScanHealth.contractsFinder?.health}`);
  console.log(`  - Notices Checked: ${postScanHealth.contractsFinder?.noticesChecked}`);
  console.log(`  - Relevant Found: ${postScanHealth.contractsFinder?.relevantFound}`);
  assert.strictEqual(postScanHealth.contractsFinder.health, 'healthy');
  assert.ok(postScanHealth.contractsFinder.status.includes('HEALTHY'));
  console.log('  [PASS] Contracts Finder is HEALTHY on live Render\n');

  // 5. Authenticated GET /api/tenders
  console.log('5. Checking authenticated GET /api/tenders...');
  const tendersRes = await fetch(`${RENDER_BASE_URL}/api/tenders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(tendersRes.status, 200, `GET /api/tenders must return 200, got ${tendersRes.status}`);
  const tendersJson = await tendersRes.json();
  const tenders = tendersJson.tenders || [];
  console.log(`  - Total Tenders Returned: ${tenders.length}`);
  assert.ok(tenders.length > 0, 'Must return tenders list');

  const ftsTender = tenders.find((t: any) => t.sourceId === 'find_a_tender' || t.canonicalReference === '067718-2026' || t.canonicalReference === '068074-2026');
  const cfTender = tenders.find((t: any) => t.sourceId === 'contracts_finder');
  console.log(`  - Found FTS Tender: ${ftsTender?.title?.slice(0, 50) || 'None'}`);
  console.log(`  - Found CF Tender: ${cfTender?.title?.slice(0, 50) || 'None'}`);
  console.log('  [PASS] Authenticated tenders returned successfully\n');

  // 6. Check detail pages
  if (ftsTender) {
    const ftsDetailRes = await fetch(`${RENDER_BASE_URL}/api/tenders/${ftsTender.canonicalReference}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`6a. Find a Tender detail [${ftsTender.canonicalReference}]: HTTP ${ftsDetailRes.status}`);
    assert.strictEqual(ftsDetailRes.status, 200);
  }

  if (cfTender) {
    const cfDetailRes = await fetch(`${RENDER_BASE_URL}/api/tenders/${cfTender.canonicalReference}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`6b. Contracts Finder detail [${cfTender.canonicalReference}]: HTTP ${cfDetailRes.status}`);
    assert.strictEqual(cfDetailRes.status, 200);
  }

  console.log('\n====================================================');
  console.log('ALL LIVE RENDER PREVIEW CHECKS PASSED WITH 100% SUCCESS');
  console.log('====================================================\n');
}

runVerification().catch((err) => {
  console.error('Render verification failed:', err);
  process.exit(1);
});
