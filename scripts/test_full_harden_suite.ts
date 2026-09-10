// scripts/test_full_harden_suite.ts
import { FindATenderConnector } from '../src/modules/public-tenders/connectors/find-a-tender';
import { SourcesRepository } from '../src/shared/database/repositories/sources';
import { TendersRepository } from '../src/shared/database/repositories/tenders';
import { checkDatabaseHealth } from '../src/shared/database/db';
import { GeminiClient } from '../src/shared/ai/gemini-client';
import { getDb } from '../src/shared/database/db';

async function runHardenSuite() {
  console.log('====================================================');
  console.log('PHASE 2.1 — FULL HARDENING ACCEPTANCE TEST SUITE');
  console.log('====================================================\n');

  const results: Record<string, boolean> = {};
  const db = getDb();
  const connector = new FindATenderConnector();

  // TEST A: Pagination beyond 100
  try {
    process.stdout.write('TEST A: Find a Tender pagination beyond 100 records... ');
    const pageScan = await connector.scanLiveNotices({ maxPages: 2 });
    if (pageScan.pagesFetched >= 2 && pageScan.noticesChecked > 100) {
      results['A'] = true;
      console.log(`PASS (${pageScan.noticesChecked} notices across ${pageScan.pagesFetched} pages)`);
    } else {
      results['A'] = false;
      console.log(`FAIL (fetched ${pageScan.noticesChecked})`);
    }
  } catch (e: any) {
    results['A'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST B & C: No generated/fallback dates
  try {
    process.stdout.write('TEST B & C: No generated/fallback publication dates or deadlines... ');
    const dummyRef = 'TEST-SUITE-NULL-DATES';
    db.prepare('DELETE FROM tenders WHERE canonical_reference = ?').run(dummyRef);
    const saved = await TendersRepository.save({
      canonicalReference: dummyRef,
      title: 'Null Date Verification',
      buyerName: 'Public Sector Audit',
      publishedAt: null,
      submissionDeadline: null,
      qualification: 'POSSIBLE',
      verificationGrade: 'B',
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/TEST-SUITE-NULL-DATES',
    });

    const raw = db.prepare('SELECT published_at, submission_deadline FROM tenders WHERE id = ?').get(saved.id) as any;
    db.prepare('DELETE FROM tenders WHERE id = ?').run(saved.id);

    if (saved.publishedAt === null && saved.submissionDeadline === null && raw.published_at === null && raw.submission_deadline === null) {
      results['B'] = true;
      results['C'] = true;
      console.log('PASS (genuinely null/unknown)');
    } else {
      results['B'] = false;
      results['C'] = false;
      console.log(`FAIL (published: ${saved.publishedAt}, deadline: ${saved.submissionDeadline})`);
    }
  } catch (e: any) {
    results['B'] = false;
    results['C'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST D: Exact notice endpoint
  try {
    process.stdout.write('TEST D: Exact notice endpoint retrieval & non-existent 404... ');
    const realNotice = await connector.fetchNotice('085808-2026');
    const bogusNotice = await connector.fetchNotice('999999-2099');
    if (realNotice && realNotice.noticeId === '085808-2026' && bogusNotice === null) {
      results['D'] = true;
      console.log('PASS (real notice parsed, bogus returned null)');
    } else {
      results['D'] = false;
      console.log(`FAIL (realNotice: ${Boolean(realNotice)}, bogusNotice: ${Boolean(bogusNotice)})`);
    }
  } catch (e: any) {
    results['D'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST E: OCID-based canonical deduplication
  try {
    process.stdout.write('TEST E: OCID-based canonical procurement identity... ');
    const ocidTest = 'ocds-suite-test-01';
    db.prepare('DELETE FROM source_notices WHERE ocid = ?').run(ocidTest);
    db.prepare('DELETE FROM tenders WHERE ocid = ?').run(ocidTest);

    const t1 = await TendersRepository.save({
      canonicalReference: 'SUITE-NOTICE-01',
      ocid: ocidTest,
      title: 'Procurement Initial Release',
      buyerName: 'Audit Authority',
      publishedAt: '2026-09-01T00:00:00Z',
      submissionDeadline: '2026-10-01T00:00:00Z',
      qualification: 'POSSIBLE',
      verificationGrade: 'A',
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/SUITE-NOTICE-01',
    });

    const t2 = await TendersRepository.save({
      canonicalReference: 'SUITE-NOTICE-02',
      ocid: ocidTest, // Same OCID!
      title: 'Procurement Amendment Release',
      buyerName: 'Audit Authority',
      publishedAt: '2026-09-05T00:00:00Z',
      submissionDeadline: '2026-10-01T00:00:00Z',
      qualification: 'STRONG',
      verificationGrade: 'A',
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/SUITE-NOTICE-02',
    });

    const count = (db.prepare('SELECT COUNT(*) as count FROM tenders WHERE ocid = ?').get(ocidTest) as any).count;
    db.prepare('DELETE FROM tenders WHERE id = ?').run(t1.id);

    if (t1.id === t2.id && count === 1 && t2.title === 'Procurement Amendment Release') {
      results['E'] = true;
      console.log('PASS (updated existing canonical row via OCID)');
    } else {
      results['E'] = false;
      console.log(`FAIL (t1.id: ${t1.id}, t2.id: ${t2.id}, count: ${count})`);
    }
  } catch (e: any) {
    results['E'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST F: Repeated identical scan does not duplicate raw release
  try {
    process.stdout.write('TEST F: Repeated identical scan does not duplicate raw release... ');
    const testNoticeId = 'TEST-DEDUPE-SUITE-01';
    db.prepare('DELETE FROM source_notices WHERE notice_id = ?').run(testNoticeId);

    const payload = { test: 'payload_data_suite', id: testNoticeId };
    const r1 = SourcesRepository.recordSourceNotice('find_a_tender', testNoticeId, payload, 'https://example.com/1');
    const r2 = SourcesRepository.recordSourceNotice('find_a_tender', testNoticeId, payload, 'https://example.com/1');

    const count = (db.prepare('SELECT COUNT(*) as count FROM source_notices WHERE notice_id = ?').get(testNoticeId) as any).count;
    db.prepare('DELETE FROM source_notices WHERE notice_id = ?').run(testNoticeId);

    if (count === 1 && r2.isDuplicate) {
      results['F'] = true;
      console.log('PASS (unchanged payload recognized, row count = 1)');
    } else {
      results['F'] = false;
      console.log(`FAIL (count: ${count}, isDuplicate: ${r2.isDuplicate})`);
    }
  } catch (e: any) {
    results['F'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST G: Raw release is linked to canonical tender
  try {
    process.stdout.write('TEST G: Raw release is linked to canonical tender... ');
    const testNoticeId = 'TEST-LINK-SUITE-01';
    db.prepare('DELETE FROM source_notices WHERE notice_id = ?').run(testNoticeId);

    const testTender = await TendersRepository.save({
      canonicalReference: testNoticeId,
      title: 'Test Link Canonical Tender',
      qualification: 'POSSIBLE',
      verificationGrade: 'A',
      officialNoticeUrl: 'https://example.com',
    });

    SourcesRepository.recordSourceNotice('find_a_tender', testNoticeId, { sample: 1 }, 'https://example.com');
    SourcesRepository.linkSourceNoticesToTender('find_a_tender', testTender.id, testNoticeId);

    const row = db.prepare('SELECT tender_id FROM source_notices WHERE notice_id = ?').get(testNoticeId) as any;
    db.prepare('DELETE FROM source_notices WHERE notice_id = ?').run(testNoticeId);
    db.prepare('DELETE FROM tenders WHERE id = ?').run(testTender.id);

    if (row && row.tender_id === testTender.id) {
      results['G'] = true;
      console.log('PASS (source_notices.tender_id correctly populated)');
    } else {
      results['G'] = false;
      console.log(`FAIL (tender_id: ${row?.tender_id})`);
    }
  } catch (e: any) {
    results['G'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST H: Failed source request does not produce HEALTHY state
  try {
    process.stdout.write('TEST H: Failed source request does not produce HEALTHY state... ');
    const prev = SourcesRepository.getById('find_a_tender');
    const prevSuccess = prev?.lastSuccessfulScanAt;

    SourcesRepository.updateHealth('find_a_tender', 'error', {
      successful: false,
      lastScanError: 'Suite simulated network error',
    });

    const errorState = SourcesRepository.getById('find_a_tender');
    SourcesRepository.updateHealth('find_a_tender', 'healthy', { successful: true });

    if (errorState?.healthStatus === 'error' && errorState?.lastSuccessfulScanAt === prevSuccess) {
      results['H'] = true;
      console.log('PASS (error status recorded, last_successful_scan_at untouched)');
    } else {
      results['H'] = false;
      console.log(`FAIL (status: ${errorState?.healthStatus})`);
    }
  } catch (e: any) {
    results['H'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST I: Database health probe cannot return true via hardcoded fallback
  try {
    process.stdout.write('TEST I: Database health probe genuinely verifies connection... ');
    db.exec('DROP TABLE db_health_probes');
    const brokenProbe = await checkDatabaseHealth();
    db.exec('CREATE TABLE IF NOT EXISTS db_health_probes (id TEXT PRIMARY KEY, probed_at TEXT NOT NULL)');
    const restoredProbe = await checkDatabaseHealth();

    if (!brokenProbe.healthy && restoredProbe.healthy) {
      results['I'] = true;
      console.log('PASS (probe genuinely failed without table, succeeded when operational)');
    } else {
      results['I'] = false;
      console.log(`FAIL (broken.healthy: ${brokenProbe.healthy}, restored.healthy: ${restoredProbe.healthy})`);
    }
  } catch (e: any) {
    results['I'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST J: Supabase/PostgreSQL repository interface & persistence architecture
  try {
    process.stdout.write('TEST J: Repository abstraction & production database check... ');
    const { isSupabaseConfigured, getSupabaseClient } = await import('../src/shared/database/supabase');

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient()!;
      const testId = 'test-supabase-probe-' + Date.now();

      const { error: insErr } = await client.from('db_health_probes').insert({ id: testId, probed_at: new Date().toISOString() });
      if (insErr) throw insErr;

      const { data: retrieved, error: getErr } = await client.from('db_health_probes').select('*').eq('id', testId).single();
      if (getErr || !retrieved) throw new Error('Supabase retrieval failed');

      await client.from('db_health_probes').delete().eq('id', testId);

      results['J'] = true;
      console.log('PASS (Supabase PostgreSQL verified with real write/read/delete)');
    } else {
      results['J'] = false;
      console.log('SKIPPED / BLOCKED (Supabase not configured in current environment; cloud credentials required)');
    }
  } catch (e: any) {
    results['J'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST K: Initial source registry exactly matches the agreed seven
  try {
    process.stdout.write('TEST K: Initial source registry matches agreed seven... ');
    const sources = SourcesRepository.getAll();
    const ids = sources.map((s) => s.id).sort();
    const expected = [
      'contracts_finder',
      'etenders_ni',
      'find_a_tender',
      'mod_dsp',
      'nhs_atamis',
      'public_contracts_scotland',
      'sell2wales',
    ].sort();

    if (JSON.stringify(ids) === JSON.stringify(expected)) {
      results['K'] = true;
      console.log(`PASS (${ids.join(', ')})`);
    } else {
      results['K'] = false;
      console.log(`FAIL (got: ${ids.join(', ')})`);
    }
  } catch (e: any) {
    results['K'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST L: Gemini classifier operates or truthfully remains UNCONFIGURED
  try {
    process.stdout.write('TEST L: Gemini classifier truthful configuration state... ');
    const isConfigured = GeminiClient.isConfigured();
    if (!isConfigured) {
      results['L'] = false;
      console.log('UNCONFIGURED / SKIPPED (Gemini API key not configured; deterministic fallback active)');
    } else {
      const res = await (await import('../src/modules/public-tenders/services/tender-classifier')).TenderClassifier.classify({
        title: 'Motion Design and Brand Video Production',
        buyer: 'Department for Education',
        description: 'Creation of educational 2D animated videos.',
      });
      if (res.ai.status === 'RUN' && res.ai.relevance) {
        results['L'] = true;
        console.log(`CONFIGURED + PASS (Gemini live call succeeded: ${res.ai.model}, relevance: ${res.ai.relevance})`);
      } else {
        results['L'] = false;
        console.log(`FAIL (Gemini status: ${res.ai.status})`);
      }
    }
  } catch (e: any) {
    results['L'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST M: No review fixtures appear in production
  try {
    process.stdout.write('TEST M: No review fixtures in production routes... ');
    const allTenders = await TendersRepository.getAll();
    const fixtureIds = ['tender-dfe-creative-2026', 'tender-ace-branding-2026', 'tender-nhs-motion-2026', 'app-dfe-01'];
    const hasFixtureInDb = allTenders.some((t) => fixtureIds.includes(t.id));

    const fs = await import('fs');
    const todayPage = fs.readFileSync('src/app/today/page.tsx', 'utf8');
    const tendersPage = fs.readFileSync('src/app/tenders/page.tsx', 'utf8');
    const hasFixtureImports = todayPage.includes('reviewTenders') || tendersPage.includes('reviewTenders');

    if (!hasFixtureInDb && !hasFixtureImports) {
      results['M'] = true;
      console.log('PASS (production database and page components free from review fixtures)');
    } else {
      results['M'] = false;
      console.log(`FAIL (hasFixtureInDb: ${hasFixtureInDb}, hasFixtureImports: ${hasFixtureImports})`);
    }
  } catch (e: any) {
    results['M'] = false;
    console.log(`FAIL (${e.message})`);
  }

  // TEST N: Zero fabricated credentials or application scores
  try {
    process.stdout.write('TEST N: No fake company credentials or fabricated application scores... ');
    const fs = await import('fs');

    const prohibited = [
      'Agile Motion Delivery',
      'Verified Brand Compliance',
      '12345678',
    ];

    const prodFilesToCheck = [
      'src/shared/database/repositories/applications.ts',
      'src/shared/database/supabase.ts',
      'src/modules/public-tenders/components/KnowledgeView.tsx',
      'src/app/knowledge/page.tsx',
    ];

    let foundViolations: string[] = [];
    for (const f of prodFilesToCheck) {
      if (fs.existsSync(f)) {
        const content = fs.readFileSync(f, 'utf8');
        for (const p of prohibited) {
          if (content.includes(p)) {
            foundViolations.push(`${f} contains "${p}"`);
          }
        }
      }
    }

    // Inspect SQLite applications table in local database for 88 or fake win themes
    const appRows = db.prepare('SELECT * FROM applications').all() as any[];
    for (const app of appRows) {
      if (app.overall_suitability_score === 88) {
        foundViolations.push(`Application ${app.id} contains fabricated score 88`);
      }
      if (typeof app.win_themes === 'string' && app.win_themes.includes('Agile Motion Delivery')) {
        foundViolations.push(`Application ${app.id} contains fabricated win theme`);
      }
    }

    if (foundViolations.length === 0) {
      results['N'] = true;
      console.log('PASS (verified zero occurrences of fabricated scores, win themes, or company credentials)');
    } else {
      results['N'] = false;
      console.log(`FAIL (${foundViolations.join('; ')})`);
    }
  } catch (e: any) {
    results['N'] = false;
    console.log(`FAIL (${e.message})`);
  }

  console.log('\n====================================================');
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  console.log(`TOTAL ACCEPTANCE TESTS PASSED: ${passedCount} / ${totalCount}`);
  if (!results['J']) {
    console.log('[NOTE] TEST J is SKIPPED / BLOCKED pending live Supabase cloud credentials.');
  }
  if (!results['L']) {
    console.log('[NOTE] TEST L is UNCONFIGURED / SKIPPED pending Gemini API key.');
  }
  console.log('====================================================');

  const requiredTests = ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'M', 'N'];
  const failedRequired = requiredTests.filter((key) => !results[key]);
  if (failedRequired.length > 0) {
    console.error(`FAILED TESTS: ${failedRequired.join(', ')}`);
    process.exit(1);
  }
}

runHardenSuite().catch((err) => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
