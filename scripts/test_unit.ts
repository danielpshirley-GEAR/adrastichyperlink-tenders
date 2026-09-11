// scripts/test_unit.ts
import assert from 'assert';
import { DeterministicFilter } from '../src/modules/public-tenders/services/deterministic-filter';
import { TenderClassifier } from '../src/modules/public-tenders/services/tender-classifier';
import { UrlVerifier } from '../src/modules/public-tenders/services/url-verifier';
import { FindATenderConnector } from '../src/modules/public-tenders/connectors/find-a-tender';
import { getSqliteDb } from '../src/shared/database/sqlite';
import { checkDatabaseHealth, getDb } from '../src/shared/database/db';

async function runUnitTests() {
  console.log('====================================================');
  console.log('RUNNING UNIT & OFFLINE ADAPTER TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        return (res as any).then(
          () => {
            console.log(`[PASS] ${name}`);
            passed++;
          },
          (err: any) => {
            console.error(`[FAIL] ${name}: ${err.message}`);
            process.exitCode = 1;
          }
        );
      } else {
        console.log(`[PASS] ${name}`);
        passed++;
      }
    } catch (err: any) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  // 1. Deterministic Filter: Positive matching
  test('Deterministic Filter accepts motion design / animation keywords', () => {
    const res = DeterministicFilter.evaluate({
      title: 'Creative Motion Design & Brand Animation Agency',
      description: 'Production of high quality 2D and 3D explanatory videos.',
    });
    assert.strictEqual(res.qualification, 'STRONG');
    assert.ok(res.matchedKeywords.length > 0);
  });

  // 2. Deterministic Filter: Negative exclusion
  test('Deterministic Filter strictly rejects CCTV / Surveillance', () => {
    const res = DeterministicFilter.evaluate({
      title: 'Supply and Installation of CCTV Surveillance Cameras',
      description: 'Public realm security camera systems and network recording.',
    });
    assert.strictEqual(res.qualification, 'REJECT');
    assert.strictEqual(res.isNegativeMatch, true);
  });

  // 3. TenderClassifier separated outputs
  await test('TenderClassifier separates deterministic and AI structures', async () => {
    const res = await TenderClassifier.classify({
      title: 'Motion Graphics and Public Information Video Partner',
      buyer: 'Department for Education',
      description: 'Produce high-impact 2D motion graphics and social video assets.',
    });
    assert.ok(res.deterministic, 'Missing deterministic result');
    assert.ok(res.ai, 'Missing ai result');
    assert.ok(res.final, 'Missing final result');
    assert.ok(['STRONG', 'POSSIBLE'].includes(res.final.relevance));
    assert.ok(['RUN', 'UNCONFIGURED'].includes(res.ai.status));
  });

  // 4. URL Verifier: Official domain validation
  await test('UrlVerifier rejects non-official domains', async () => {
    const res = await UrlVerifier.verifyNoticeUrl('https://fraudulent-tender-portal.fake.org/notice/123');
    assert.strictEqual(res.grade, 'X');
    assert.strictEqual(res.isValid, false);
  });

  // 5. OCDS Release Parser Fixture (no fake dates)
  test('FindATenderConnector parses OCDS release without date fallbacks', () => {
    const fts = new FindATenderConnector();
    const mockRelease = {
      id: 'test-release-001',
      ocid: 'ocds-test-procurement-1',
      tender: {
        id: 'test-release-001',
        title: 'Creative Branding Services',
        description: 'Brand identity and guidelines.',
        value: { amount: 50000, currency: 'GBP' },
        // Intentionally omit publishedDate and tenderPeriod.endDate
      },
      buyer: {
        name: 'Historic England',
      },
    };

    const parsed = (fts as any).parseOcdsRelease(mockRelease);
    assert.ok(parsed, 'Parsed notice should not be null');
    assert.strictEqual(parsed.publishedAt, null, 'publishedAt must be null when omitted');
    assert.strictEqual(parsed.submissionDeadline, null, 'submissionDeadline must be null when omitted');
    assert.strictEqual(parsed.valueAmount, 50000);
    assert.strictEqual(parsed.buyerName, 'Historic England');
  });

  // 6. Local SQLite schema and unique constraint verification
  test('Local SQLite database enforces unique release constraint', () => {
    const db = getDb();
    const testNoticeId = 'TEST-UNIT-UNIQUE-01';
    const testSourceId = 'find_a_tender';
    const testHash = 'deadbeef1234567890abcdef';

    db.prepare('DELETE FROM source_notices WHERE notice_id = ?').run(testNoticeId);

    db.prepare(`
      INSERT INTO source_notices (
        id, source_id, notice_id, raw_notice_json, notice_url, content_hash, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('u1', testSourceId, testNoticeId, '{}', 'https://example.com', testHash, 1);

    // Attempting to insert identical (source_id, notice_id, content_hash) must throw unique constraint violation
    assert.throws(() => {
      db.prepare(`
        INSERT INTO source_notices (
          id, source_id, notice_id, raw_notice_json, notice_url, content_hash, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('u2', testSourceId, testNoticeId, '{}', 'https://example.com', testHash, 1);
    });

    db.prepare('DELETE FROM source_notices WHERE notice_id = ?').run(testNoticeId);
  });

  // 7. Fail-closed production database guard
  await test('Fail-closed production database guard blocks SQLite in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      // Without Supabase configured, checkDatabaseHealth must return PRODUCTION DATABASE NOT CONFIGURED
      const health = await checkDatabaseHealth();
      assert.strictEqual(health.healthy, false);
      assert.strictEqual(health.error, 'PRODUCTION DATABASE NOT CONFIGURED');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  // 8. Reject handling: finalQualification === 'REJECT' sets REJECTED, isArchived, AI_REJECTED
  await test('Reject handling: finalQualification REJECT sets REJECTED, isArchived true, and excludes from ALL', async () => {
    const { TendersRepository } = await import('../src/shared/database/repositories/tenders');
    const testRef = 'TEST-UNIT-REJECT-' + Date.now();

    const saved = await TendersRepository.save({
      canonicalReference: testRef,
      title: 'CCTV & Media Buying Unit Test',
      buyerName: 'Test Buyer Authority',
      deterministicResult: 'POSSIBLE',
      aiResult: 'REJECT',
      finalQualification: 'REJECT',
      publishedAt: '2026-09-01T00:00:00Z',
      submissionDeadline: '2026-10-30T00:00:00Z', // Future deadline!
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/' + testRef,
    });

    assert.strictEqual(saved.qualification, 'REJECT');
    assert.strictEqual(saved.finalQualification, 'REJECT');
    assert.strictEqual(saved.lifecycleStatus, 'REJECTED');
    assert.strictEqual(saved.isArchived, true);
    assert.strictEqual(saved.archivedReason, 'AI_REJECTED');

    // Query ALL tab: must NOT contain this tender
    const allTenders = await TendersRepository.getAll({ tab: 'ALL' });
    assert.ok(!allTenders.some((t) => t.canonicalReference === testRef), 'REJECTED tender must not appear in ALL tab');

    // Query ARCHIVED tab: MUST contain this tender
    const archivedTenders = await TendersRepository.getAll({ tab: 'ARCHIVED' });
    assert.ok(archivedTenders.some((t) => t.canonicalReference === testRef), 'REJECTED tender must appear in ARCHIVED tab');

    // Clean up
    const db = getDb();
    db.prepare('DELETE FROM tenders WHERE canonical_reference = ?').run(testRef);
  });

  // 9. Expired tenders excluded from active ALL
  await test('Expired tenders are excluded from active ALL and appear in ARCHIVED', async () => {
    const { TendersRepository } = await import('../src/shared/database/repositories/tenders');
    const testRef = 'TEST-UNIT-EXPIRED-' + Date.now();

    const saved = await TendersRepository.save({
      canonicalReference: testRef,
      title: 'Expired Tender Test',
      buyerName: 'Expired Authority',
      qualification: 'STRONG',
      publishedAt: '2026-08-01T00:00:00Z',
      submissionDeadline: '2026-08-15T00:00:00Z', // Past deadline
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/' + testRef,
    });

    assert.strictEqual(saved.lifecycleStatus, 'EXPIRED');
    assert.strictEqual(saved.isArchived, true);

    // Query ALL tab: must NOT contain this tender
    const allTenders = await TendersRepository.getAll({ tab: 'ALL' });
    assert.ok(!allTenders.some((t) => t.canonicalReference === testRef), 'EXPIRED tender must not appear in ALL tab');

    // Clean up
    const db = getDb();
    db.prepare('DELETE FROM tenders WHERE canonical_reference = ?').run(testRef);
  });

  // 10. Health endpoint: Genuine build & runtime identification
  await test('Health endpoint: Genuine build & runtime identification without hardcoded SHA', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const healthRouteContent = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/health/route.ts'),
      'utf8'
    );

    // Verify hardcoded SHA c193b1deadef6f63724965081408ae68ac5ba972 is completely gone
    assert.ok(
      !healthRouteContent.includes('c193b1deadef6f63724965081408ae68ac5ba972'),
      'Hardcoded commit SHA must be eradicated from health route'
    );

    const { GET } = await import('../src/app/api/health/route');
    const res = await GET();
    const json = await res.json();

    assert.ok('commit' in json, 'commit must be present in health response');
    assert.ok('runtime' in json, 'runtime must be present in health response');
    assert.ok('deployId' in json, 'deployId must be present in health response');
    assert.ok('deployContext' in json, 'deployContext must be present in health response');
    assert.ok('branch' in json, 'branch must be present in health response');

    // Runtime must be either Netlify Next.js or Next.js Node.js Server
    assert.ok(
      ['Netlify Next.js', 'Next.js Node.js Server'].includes(json.runtime),
      `Invalid runtime reported: ${json.runtime}`
    );

    // Commit must not be the old hardcoded string
    assert.notStrictEqual(json.commit, 'c193b1deadef6f63724965081408ae68ac5ba972');
  });

  // 11. Detail Enrichment: Procurement Stage Resolution & Contextual Gate
  test('DetailEnrichmentService resolves PRELIMINARY MARKET ENGAGEMENT for planning PIN notices', () => {
    const { DetailEnrichmentService } = require('../src/modules/public-tenders/services/detail-enrichment');
    const stage = DetailEnrichmentService.determineProcurementStage(
      { tag: ['planning'], tender: { status: 'planned', communication: { futureNoticeDate: '2026-11-10T00:00:00Z' } } },
      'Aberdeen Destination Marketing and Development Service',
      'Prior Information Notice for market engagement only. Not a call for competition.'
    );
    assert.strictEqual(stage, 'PRELIMINARY MARKET ENGAGEMENT');
  });

  // 12. Detail Enrichment: Document Discovery & Access States
  await test('DetailEnrichmentService discovers documents and tags access states accurately', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const service = new DetailEnrichmentService();
    const mockTender = {
      id: 'test-tender-enrich-unit',
      canonicalReference: '068074-2026',
      title: 'Aberdeen Destination Marketing and Development Service',
      qualification: 'STRONG' as const,
      verificationGrade: 'A' as const,
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/068074-2026',
      serviceTags: [],
      sourceId: 'find_a_tender',
      isArchived: false,
      discoveredAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    const enrichment = await service.enrichTender(mockTender);
    assert.strictEqual(enrichment.procurementStage, 'PRELIMINARY MARKET ENGAGEMENT');
    assert.strictEqual(enrichment.submissionDetails.isOpenForBid, false);
    assert.strictEqual(enrichment.submissionDetails.isMarketEngagement, true);
    assert.ok(enrichment.documents.length >= 2, 'Must discover at least official notice and ITT status');
    assert.ok(enrichment.documents.some((d: any) => d.accessState === 'PUBLIC'), 'Must have PUBLIC official notice');
    assert.ok(enrichment.documents.some((d: any) => d.accessState === 'NOT PUBLISHED'), 'Must record NOT PUBLISHED for pending ITT');
    assert.ok(enrichment.requirements.length >= 4, 'Must populate mandatory and baseline eligibility criteria');
    assert.ok(enrichment.sourceEvidence.length >= 3, 'Must provide source evidence citations');
  });

  // 13. Repository Parity: Round-trip persistence of rich procurement intelligence
  await test('Repository persists and retrieves procurement stage, requirements, documents, and enrichment', async () => {
    const { TendersRepository } = await import('../src/shared/database/repositories/tenders');
    const testRef = 'TEST-ENRICH-ROUNDTRIP-' + Date.now();

    const saved = await TendersRepository.save({
      canonicalReference: testRef,
      title: 'Enrichment Persistence Test',
      buyerName: 'City Council',
      qualification: 'STRONG',
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/' + testRef,
      procurementStage: 'PRELIMINARY MARKET ENGAGEMENT',
      requirements: [
        {
          id: 'req-1',
          tenderId: 't-1',
          category: 'insurance',
          requirementName: 'PI Insurance',
          buyerRequirementText: '£5m cover',
          sourceCitation: 'Notice Spec',
          adrasticCapabilityText: 'Upgradeable upon award',
          status: 'PASS_WITH_ACTION',
          mandatory: true,
        },
      ],
      documents: [
        {
          id: 'doc-1',
          fileName: 'Notice Release',
          docType: 'official_notice',
          accessState: 'PUBLIC',
          requiresLogin: false,
          versionNumber: 1,
          fileHash: 'HASH123',
          analysisStatus: 'analyzed',
          lastCheckedAt: new Date().toISOString(),
        },
      ],
      enrichment: {
        tenderId: 't-1',
        canonicalReference: testRef,
        enrichedAt: new Date().toISOString(),
        procurementStage: 'PRELIMINARY MARKET ENGAGEMENT',
        scopeAndSpec: {
          whatBuyerWants: 'Destination branding and campaign creative',
          businessObjective: 'Economic growth',
          requiredServices: ['Branding', 'Motion'],
          keyDeliverables: ['Brand book', 'Campaign film'],
          targetAudience: 'Visitors',
          contractScope: 'City wide',
          locations: ['Aberdeen'],
          duration: '3 years',
          importantDates: [],
          creativeMarketingDigitalOverlap: ['Motion', 'Branding'],
          servicesOutsideCoreCapability: ['Physical infrastructure'],
          isDetailedScopePublished: true,
        },
        documents: [],
        requirements: [],
        evaluationCriteria: [],
        submissionDetails: {
          procurementStage: 'PRELIMINARY MARKET ENGAGEMENT',
          submissionRoute: 'PCS',
          buyerContact: {},
          requiredAttachments: [],
          participationInstructions: 'Register on PCS',
          isOpenForBid: false,
          isMarketEngagement: true,
        },
        fitAndRisks: {
          whyAdrastichyperlinkFits: 'Branding expertise',
          whyItMayNotFit: 'Prime capacity',
          riskFactors: [],
          partneringRecommendation: 'Consortium lead',
        },
        sourceEvidence: [],
      },
    } as any);

    assert.strictEqual(saved.procurementStage, 'PRELIMINARY MARKET ENGAGEMENT');
    assert.strictEqual(saved.requirements?.length, 1);
    assert.strictEqual(saved.documents?.length, 1);
    assert.ok(saved.enrichment, 'Enrichment must be returned on save');

    const loaded = await TendersRepository.getByCanonicalReference(testRef);
    assert.ok(loaded, 'Tender must be found by canonical reference');
    assert.strictEqual(loaded?.procurementStage, 'PRELIMINARY MARKET ENGAGEMENT');
    assert.strictEqual(loaded?.requirements?.length, 1);
    assert.strictEqual(loaded?.documents?.length, 1);
    assert.strictEqual(loaded?.enrichment?.scopeAndSpec?.whatBuyerWants, 'Destination branding and campaign creative');

    // Clean up
    const db = getDb();
    db.prepare('DELETE FROM tenders WHERE canonical_reference = ?').run(testRef);
  });

  console.log(`\n====================================================`);
  console.log(`UNIT SUITE COMPLETE: ${passed} / ${total} TESTS PASSED`);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }

  // 11. Authentication & Session Security Suite
  const { runAuthSecurityTests } = await import('./test_auth_security');
  await runAuthSecurityTests();
}

runUnitTests().catch((err) => {
  console.error('Unit test fatal error:', err);
  process.exit(1);
});
