// scripts/test_source_and_db_health.ts
import { SourcesRepository } from '../src/shared/database/repositories/sources';
import { checkDatabaseHealth } from '../src/shared/database/db';
import { getDb } from '../src/shared/database/db';

async function main() {
  console.log('=== TESTS H, I, K: SOURCE HEALTH, DB HEALTH & 7 SOURCES REGISTRY ===');
  const db = getDb();

  console.log('\n--- 1. Testing Agreed 7 Sources Registry (TEST K) ---');
  const allSources = SourcesRepository.getAll();
  const sourceIds = allSources.map((s) => s.id).sort();
  console.log('Registered sources in database:', sourceIds);

  const expectedIds = [
    'contracts_finder',
    'etenders_ni',
    'find_a_tender',
    'mod_dsp',
    'nhs_atamis',
    'public_contracts_scotland',
    'sell2wales',
  ].sort();

  if (JSON.stringify(sourceIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`FAIL: Source IDs do not match agreed seven.\nExpected: ${JSON.stringify(expectedIds)}\nGot: ${JSON.stringify(sourceIds)}`);
  }

  // Confirm other 6 are not_implemented
  const notImplemented = allSources.filter((s) => s.id !== 'find_a_tender' && s.healthStatus === 'not_implemented');
  if (notImplemented.length !== 6) {
    throw new Error(`FAIL: Expected 6 sources to be not_implemented, found ${notImplemented.length}`);
  }
  console.log('TEST K PASS: Initial source registry exactly matches the agreed seven sources.');

  console.log('\n--- 2. Testing Source Health Truthfulness (TEST H) ---');
  const ftsSourceBefore = SourcesRepository.getById('find_a_tender');
  const originalLastSuccess = ftsSourceBefore?.lastSuccessfulScanAt;
  console.log(`Initial last_successful_scan_at: ${originalLastSuccess}`);

  // Simulate a failed scan run
  console.log('Simulating a failed scan with error message...');
  SourcesRepository.updateHealth('find_a_tender', 'error', {
    successful: false,
    lastScanError: 'Simulated network timeout or upstream HTTP 500 error',
  });

  const ftsAfterError = SourcesRepository.getById('find_a_tender');
  console.log(`Source health after error: ${ftsAfterError?.healthStatus}`);
  console.log(`Source last_scan_error: ${ftsAfterError?.lastScanError}`);
  console.log(`Source last_successful_scan_at: ${ftsAfterError?.lastSuccessfulScanAt}`);

  if (ftsAfterError?.healthStatus === 'healthy') {
    throw new Error('FAIL: Failed source request incorrectly reported healthy!');
  }
  if (ftsAfterError?.lastSuccessfulScanAt !== originalLastSuccess) {
    throw new Error('FAIL: Failed scan incorrectly updated last_successful_scan_at!');
  }
  if (!ftsAfterError?.lastScanError) {
    throw new Error('FAIL: Failed scan did not record last_scan_error!');
  }
  console.log('TEST H PASS: Failed source request correctly sets error status and preserves last_successful_scan_at.');

  // Restore to healthy
  SourcesRepository.updateHealth('find_a_tender', 'healthy', {
    successful: true,
  });

  console.log('\n--- 3. Testing Database Health Probe (TEST I) ---');
  const healthyProbe = await checkDatabaseHealth();
  console.log('Normal database health probe result:', healthyProbe);
  if (!healthyProbe.healthy || healthyProbe.type !== 'sqlite') {
    throw new Error('FAIL: Database probe failed on normal operating state.');
  }

  // Temporarily break probe table to verify health probe genuinely fails without hardcoded true
  db.exec('DROP TABLE db_health_probes');
  const brokenProbe = await checkDatabaseHealth();
  console.log('Database probe result after dropping probe table:', brokenProbe);

  if (brokenProbe.healthy) {
    throw new Error('FAIL: checkDatabaseHealth returned healthy even when probe failed (hardcoded fallback remains)!');
  }
  console.log('TEST I PASS: Database health genuinely failed when probe failed. Zero hardcoded truth.');

  // Recreate probe table
  db.exec('CREATE TABLE IF NOT EXISTS db_health_probes (id TEXT PRIMARY KEY, probed_at TEXT NOT NULL)');
  const restoredProbe = await checkDatabaseHealth();
  if (!restoredProbe.healthy) {
    throw new Error('FAIL: Restored probe should be healthy.');
  }
  console.log('Database probe restored successfully.');

  console.log('\nALL TESTS H, I, K PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
