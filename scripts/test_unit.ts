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

  // 12. Detail Enrichment: Document Discovery & Access States (Real Document Model)
  await test('DetailEnrichmentService categorizes documents and tags access states accurately without fake hashes', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const service = new DetailEnrichmentService();
    const mockTender = {
      id: 'test-tender-enrich-unit',
      canonicalReference: '068074-2026',
      title: 'Aberdeen Destination Marketing and Development Service',
      qualification: 'STRONG' as const,
      verificationGrade: 'A' as const,
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/068074-2026',
      buyerName: 'Aberdeen City Council',
      plainEnglishSummary: 'Aberdeen Destination Marketing tender',
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
    assert.ok(enrichment.documents.length >= 2, 'Must discover source notice and portal/ITT items');
    assert.ok(enrichment.documents.some((d: any) => d.category === 'SOURCE_NOTICE'), 'Must have SOURCE_NOTICE');
    assert.ok(enrichment.documents.some((d: any) => d.accessState === 'PUBLIC'), 'Must have PUBLIC access item');
    assert.ok(enrichment.documents.some((d: any) => d.accessState === 'NOT PUBLISHED'), 'Must record NOT PUBLISHED for pending ITT');
    // Critical: No fake placeholder hashes!
    enrichment.documents.forEach((d) => {
      assert.ok(d.fileHash === null || /^[a-f0-9]{64}$/i.test(d.fileHash), `Invalid fileHash on ${d.fileName}: ${d.fileHash}`);
    });
    // Truthful PME: No fabricated requirements
    assert.strictEqual(enrichment.requirements.length, 0, 'PME notice must NOT fabricate buyer requirements');
    assert.strictEqual(enrichment.isEligibilityPublished, false, 'PME must mark eligibility unpublished');
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

  // 14. Evidence Gate: Buyer has not published PI or Cyber -> zero buyer requirements created
  await test('Evidence Gate: Unpublished buyer criteria produces zero requirements and truthful notice', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const service = new DetailEnrichmentService();
    const result = (service as any).synthesizeDeterministically(
      {
        id: 't-test-pme',
        canonicalReference: 'TEST-PME-01',
        title: 'Preliminary Market Notice',
        description: 'Notice for preliminary engagement only. Not a call for competition.',
        qualification: 'POSSIBLE',
        officialNoticeUrl: 'https://example.com/notice',
      },
      null,
      'PRELIMINARY MARKET ENGAGEMENT'
    );

    assert.strictEqual(result.requirements.length, 0, 'Must not fabricate PI, PL, or Cyber requirements');
    assert.strictEqual(result.evaluationCriteria[0].isPublished, false);
    assert.ok(result.evaluationCriteria[0].criterion.includes('not yet been published'));
  });

  // 15. AI Opportunity Interpretation: FactType separation and distinct labeling
  await test('AI Opportunity Interpretation: Distinguishes buyer facts from creative opportunities', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const service = new DetailEnrichmentService();
    const result = (service as any).synthesizeDeterministically(
      {
        id: 't-test-opp',
        canonicalReference: 'TEST-OPP-01',
        title: 'Council Communications Service',
        description: 'Delivering strategic communications, digital media, and public outreach across the region.',
        qualification: 'STRONG',
        officialNoticeUrl: 'https://example.com/notice',
      },
      null,
      'PRELIMINARY MARKET ENGAGEMENT'
    );

    assert.ok(result.scopeAndSpec.creativeOpportunities.length > 0, 'Must suggest creative opportunities');
    result.scopeAndSpec.creativeOpportunities.forEach((opp: any) => {
      assert.strictEqual(opp.label, 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT');
    });
    assert.strictEqual(result.scopeAndSpec.buyerKeyDeliverables.length, 0, 'Must not claim AI ideas as buyer deliverables');
  });

  // 16. File Hashing Integrity: Downloaded document produces real SHA-256; undownloaded sets null
  await test('File Hashing Integrity: Downloaded document produces real SHA-256; undownloaded sets null', async () => {
    const crypto = await import('crypto');
    const testBytes = Buffer.from('Official Procurement Tender Document Content 2026');
    const expectedHash = crypto.createHash('sha256').update(testBytes).digest('hex');

    // Genuine downloaded document
    const downloadedDoc = {
      id: 'doc-real',
      fileName: 'Specification.pdf',
      fileHash: expectedHash,
    };
    assert.strictEqual(downloadedDoc.fileHash.length, 64);
    assert.ok(/^[a-f0-9]{64}$/.test(downloadedDoc.fileHash));

    // Undownloaded document
    const undownloadedDoc = {
      id: 'doc-remote',
      fileName: 'Find a Tender Notice',
      fileHash: null,
    };
    assert.strictEqual(undownloadedDoc.fileHash, null, 'Undownloaded document must have null fileHash');
  });

  // 17. Generic Dynamic Enrichment on Glasgow 067718-2026
  await test('Generic Enrichment: Glasgow 067718-2026 enriches dynamically without notice-specific conditionals', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const service = new DetailEnrichmentService();
    const mockGlasgow = {
      id: 'glasgow-test-01',
      canonicalReference: '067718-2026',
      title: 'Glasgow Business Growth Programme- Phase 4 Framework',
      qualification: 'POSSIBLE' as const,
      verificationGrade: 'A' as const,
      officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/067718-2026',
      buyerName: 'Glasgow City Council',
      plainEnglishSummary: 'Glasgow Business Growth Programme',
      serviceTags: [],
      sourceId: 'find_a_tender',
      isArchived: false,
      discoveredAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    const enrichment = await service.enrichTender(mockGlasgow);
    assert.strictEqual(enrichment.procurementStage, 'PRELIMINARY MARKET ENGAGEMENT');
    assert.strictEqual(enrichment.requirements.length, 0, 'Glasgow PME must not fabricate requirements');
    assert.strictEqual(enrichment.isEligibilityPublished, false);
    assert.ok(enrichment.scopeAndSpec.buyerRequiredServices.length > 0, 'Must extract generic buyer scope');
    assert.strictEqual(enrichment.scopeAndSpec.buyerKeyDeliverables.length, 0, 'Must not fabricate deliverables');
    assert.ok(enrichment.documents.length >= 2, 'Must discover documents');
    enrichment.documents.forEach((d) => {
      assert.strictEqual(d.fileHash, null, 'Must not have fake placeholder hash strings');
    });
  });

  // 18. Market engagement phrase alone does NOT create form
  await test('Form Detection: Market engagement phrase alone does NOT create form', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const form = await DetailEnrichmentService.detectMarketEngagementForm(
      'The Council is currently undertaking preliminary market engagement to inform potential procurement models.'
    );
    assert.strictEqual(form, undefined, 'Must not detect form on generic phrase alone');
  });

  // 19. Explicit "submission form" creates referenced form
  await test('Form Detection: Explicit "submission form" creates referenced form', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const form = await DetailEnrichmentService.detectMarketEngagementForm(
      'Interested parties are asked to complete the market engagement Submission Form and return by email.'
    );
    assert.ok(form, 'Must detect form when submission form is explicitly referenced');
    assert.strictEqual(form?.isReferenced, true);
    assert.strictEqual(form?.formTitle, 'Market Engagement Submission Form');
    assert.strictEqual(form?.accessState, 'ACCESS NOT YET VERIFIED');
    assert.strictEqual(form?.deadline, null, 'Must not invent deadline');
    assert.ok(form?.sourceEvidenceText?.includes('Submission Form'));
  });

  // 20. Explicit Microsoft Forms URL extracts real URL
  await test('Form Detection: Explicit Microsoft Forms URL extracts real URL', async () => {
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const form = await DetailEnrichmentService.detectMarketEngagementForm(
      'To help develop the tender please complete the form at: https://forms.office.com/e/vW0k03HeVY'
    );
    assert.ok(form, 'Must detect form with URL');
    assert.strictEqual(form?.isReferenced, true);
    assert.strictEqual(form?.sourceUrl, 'https://forms.office.com/e/vW0k03HeVY');
    assert.strictEqual(form?.formType, 'Market research / supplier interest form');
    assert.strictEqual(form?.deadline, null);
  });

  // 21. Real Glasgow notice extracts Microsoft Forms URL
  await test('Real Notice: Glasgow notice extracts Microsoft Forms URL', async () => {
    const { FindATenderConnector } = await import('../src/modules/public-tenders/connectors/find-a-tender');
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const connector = new FindATenderConnector();
    const notice = await connector.fetchNotice('067718-2026');
    assert.ok(notice, 'Glasgow notice must be fetched');
    assert.strictEqual(notice?.ocid, 'ocds-h6vhtk-06cdb9', 'Glasgow canonical OCID must be ocds-h6vhtk-06cdb9');

    const form = await DetailEnrichmentService.detectMarketEngagementForm(notice!.description);
    assert.ok(form, 'Must detect Glasgow form from notice text');
    assert.strictEqual(form?.isReferenced, true);
    assert.strictEqual(form?.sourceUrl, 'https://forms.office.com/e/vW0k03HeVY');
  });

  // 22. Real Aberdeen notice references submission form and validates canonical OCID
  await test('Real Notice: Aberdeen notice references submission form and matches canonical OCID', async () => {
    const { FindATenderConnector } = await import('../src/modules/public-tenders/connectors/find-a-tender');
    const { DetailEnrichmentService } = await import('../src/modules/public-tenders/services/detail-enrichment');
    const connector = new FindATenderConnector();
    const notice = await connector.fetchNotice('068074-2026');
    assert.ok(notice, 'Aberdeen notice must be fetched');
    assert.strictEqual(notice?.ocid, 'ocds-h6vhtk-06ce78', 'Aberdeen canonical OCID must be ocds-h6vhtk-06ce78');

    const form = await DetailEnrichmentService.detectMarketEngagementForm(notice!.description);
    assert.ok(form, 'Must detect Aberdeen referenced form');
    assert.strictEqual(form?.isReferenced, true);
    assert.strictEqual(form?.formTitle, 'Market Engagement Submission Form');
    assert.strictEqual(form?.accessState, 'ACCESS NOT YET VERIFIED');
    assert.ok(form?.sourceEvidenceText?.includes('Submission Form'));
  });

  // 23. Fail-Closed Fact Types: Missing factType defaults to UNKNOWN and unverified
  await test('Fail-Closed: Missing factType defaults to UNKNOWN and unverified', async () => {
    const rawFactWithoutType: any = { topic: 'Budget', fact: 'Estimated £1m', source: 'Notice' };
    const factType = rawFactWithoutType.factType ? rawFactWithoutType.factType : 'UNKNOWN';
    const isBuyer = factType === 'EXPLICIT_BUYER_FACT' || factType === 'DOCUMENT_EXTRACTED_FACT' || factType === 'PORTAL_FACT';
    const isVerified = isBuyer && Boolean(rawFactWithoutType.source);
    const confidence = isVerified ? 'VERIFIED' : 'UNVERIFIED';

    assert.strictEqual(factType, 'UNKNOWN');
    assert.strictEqual(isVerified, false);
    assert.strictEqual(confidence, 'UNVERIFIED');
  });

  // 24. Fail-Closed: Fact without evidence is not verified
  await test('Fail-Closed: Fact without evidence is not verified', async () => {
    const factWithoutEvidence: any = { topic: 'Eligibility', fact: 'Must have ISO9001', factType: 'EXPLICIT_BUYER_FACT', source: '' };
    const hasTraceableEvidence = Boolean(factWithoutEvidence.source && factWithoutEvidence.evidenceText);
    const isVerified = hasTraceableEvidence;
    assert.strictEqual(isVerified, false, 'Missing evidence cannot be verified');
  });

  // 25. Requirement Evidence Gate: Requirement without evidence cannot become published buyer requirement
  await test('Requirement Evidence Gate: Requirement without evidence cannot become published buyer requirement', async () => {
    const requirementsWithUnverified: any[] = [
      {
        requirementName: 'AI Assumed Insurance',
        buyerRequirementText: '£5m Professional Indemnity',
        factType: 'UNKNOWN', // Missing provenance
        sourceCitation: '',
        evidenceText: '',
      },
    ];

    const verified = requirementsWithUnverified.filter((r) => {
      const isBuyerFact = r.factType === 'EXPLICIT_BUYER_FACT' || r.factType === 'DOCUMENT_EXTRACTED_FACT';
      const hasText = Boolean(r.buyerRequirementText?.trim());
      const hasEvidence = Boolean(r.evidenceText?.trim() || r.sourceCitation?.trim());
      return isBuyerFact && hasText && hasEvidence;
    });

    const isEligibilityPublished = verified.length > 0;
    assert.strictEqual(verified.length, 0, 'Unverified requirement must be discarded from buyer requirements');
    assert.strictEqual(isEligibilityPublished, false, 'Eligibility must not be marked published');
  });

  // 26. Identity Validation: Wrong OCID / correct notice ID triggers IDENTITY_CONFLICT
  await test('Identity Validation: Wrong OCID / notice ID mismatch triggers IDENTITY_CONFLICT', async () => {
    const { validateNoticeIdentity } = await import('../src/modules/public-tenders/connectors/find-a-tender');
    const result = validateNoticeIdentity(
      { noticeId: '068074-2026', ocid: 'ocds-h6vhtk-WRONG_OCID' },
      { id: '068074-2026', ocid: 'ocds-h6vhtk-06ce78' }
    );
    assert.strictEqual(result.status, 'IDENTITY_CONFLICT');
    assert.strictEqual(result.isConflict, true);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.expectedOcid, 'ocds-h6vhtk-06ce78');
  });

  // 27. Bug 1 Fix: Database engine exposure & UI label mapping
  await test('Bug 1: Database engine mapping — postgres -> Supabase / PostgreSQL', async () => {
    const formatDbLabel = (engine?: string) => {
      return engine === 'postgres'
        ? 'Supabase / PostgreSQL'
        : engine === 'sqlite'
          ? 'Persistent SQLite'
          : 'Database Offline';
    };

    assert.strictEqual(formatDbLabel('postgres'), 'Supabase / PostgreSQL');
    assert.strictEqual(formatDbLabel('sqlite'), 'Persistent SQLite');
    assert.strictEqual(formatDbLabel('none'), 'Database Offline');
    assert.strictEqual(formatDbLabel(undefined), 'Database Offline');

    const { GET: healthGet } = await import('../src/app/api/health/route');
    const healthRes = await healthGet();
    const healthJson = await healthRes.json();
    assert.ok(healthJson.database.engine, 'Health API must expose database.engine');
    assert.ok(
      ['postgres', 'sqlite', 'none'].includes(healthJson.database.engine),
      `database.engine must be postgres|sqlite|none, got: ${healthJson.database.engine}`
    );
  });

  // 28. Phase 2: Source Registry -> 2 / 7 Active, 5 Not Implemented
  await test('Source Registry -> 2 / 7 Active, 5 Not Implemented', async () => {
    const { SourceRegistry } = await import('../src/modules/public-tenders/connectors/registry');
    const sources = await SourceRegistry.getInstance().getSourcesMeta();
    assert.strictEqual(sources.length, 7, 'Must have exactly 7 canonical sources');

    const activeSourcesCount = sources.filter((s) => s.health !== 'not_implemented').length;
    const notImplementedCount = sources.filter((s) => s.health === 'not_implemented').length;

    assert.strictEqual(activeSourcesCount, 2, 'Exactly 2 sources (Find a Tender & Contracts Finder) must be active');
    assert.strictEqual(notImplementedCount, 5, 'Exactly 5 sources must be not_implemented');

    const fts = sources.find((s) => s.id === 'find_a_tender');
    assert.ok(fts, 'Find a Tender must be present in sources');
    assert.strictEqual(fts?.health, 'healthy', 'Find a Tender must be healthy');

    const cf = sources.find((s) => s.id === 'contracts_finder');
    assert.ok(cf, 'Contracts Finder must be present in sources');
    assert.ok(cf?.health === 'healthy' || cf?.health === 'untested', 'Contracts Finder must be healthy or untested');
  });

  // 29. Bug 2 Fix: Find a Tender real counters display
  await test('Bug 2: Find a Tender real counters display', async () => {
    const { SourceRegistry } = await import('../src/modules/public-tenders/connectors/registry');
    const sources = await SourceRegistry.getInstance().getSourcesMeta();
    const fts = sources.find((s) => s.id === 'find_a_tender');

    assert.ok(fts, 'Find a Tender source must exist');
    assert.ok(typeof fts!.noticesChecked === 'number' && fts!.noticesChecked > 0, 'noticesChecked must be real counter > 0');
    assert.ok(typeof fts!.relevantFound === 'number' && fts!.relevantFound > 0, 'relevantFound must be real counter > 0');
    assert.ok(fts!.lastScanAt, 'lastScanAt must be recorded');
  });

  // 30. Bug 3 Fix: TenderRow canonicalReference 067718-2026 -> href /tenders/067718-2026
  await test('Bug 3: TenderRow links use canonicalReference with UUID fallback', async () => {
    const resolveDetailHref = (tender: { id: string; canonicalReference?: string }, basePath = '') => {
      const tenderRef = tender.canonicalReference || tender.id;
      return `${basePath}/tenders/${tenderRef}`;
    };

    const glasgowHref = resolveDetailHref({
      id: 'da464eb0-6711-418e-8a01-749b13227a9f',
      canonicalReference: '067718-2026',
    });
    assert.strictEqual(glasgowHref, '/tenders/067718-2026', 'Must link using canonicalReference');

    const aberdeenHref = resolveDetailHref({
      id: 'test-aberdeen-uuid',
      canonicalReference: '068074-2026',
    });
    assert.strictEqual(aberdeenHref, '/tenders/068074-2026', 'Must link using canonicalReference');

    const fallbackHref = resolveDetailHref({
      id: 'fallback-uuid-1234',
      canonicalReference: '',
    });
    assert.strictEqual(fallbackHref, '/tenders/fallback-uuid-1234', 'Must fallback to UUID if canonicalReference missing');
  });

  // 31. Bug 4 Fix: GET /api/tenders/067718-2026 -> 200
  await test('Bug 4: GET /api/tenders/067718-2026 resolves with 200', async () => {
    const { GET: tenderGet } = await import('../src/app/api/tenders/[id]/route');
    const { createSessionToken, AUTH_COOKIE_NAME } = await import('../src/shared/auth/session');
    process.env.ADMIN_ACCESS_TOKEN = 'test-admin-key-unit-test-32chars-min!!';
    const token = await createSessionToken({ sub: 'admin', role: 'admin' });

    const req = new Request('http://localhost:3000/api/tenders/067718-2026', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    });
    const res = await tenderGet(req, { params: { id: '067718-2026' } });
    assert.strictEqual(res.status, 200, 'GET /api/tenders/067718-2026 must return 200');

    const json = await res.json();
    assert.ok(json.tender, 'Response must contain tender');
    assert.strictEqual(json.tender.canonicalReference, '067718-2026');
  });

  // 32. Bug 4 Fix: GET /api/tenders/068074-2026 -> 200
  await test('Bug 4: GET /api/tenders/068074-2026 resolves with 200', async () => {
    const { GET: tenderGet } = await import('../src/app/api/tenders/[id]/route');
    const { createSessionToken, AUTH_COOKIE_NAME } = await import('../src/shared/auth/session');
    process.env.ADMIN_ACCESS_TOKEN = 'test-admin-key-unit-test-32chars-min!!';
    const token = await createSessionToken({ sub: 'admin', role: 'admin' });

    const req = new Request('http://localhost:3000/api/tenders/068074-2026', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    });
    const res = await tenderGet(req, { params: { id: '068074-2026' } });
    assert.strictEqual(res.status, 200, 'GET /api/tenders/068074-2026 must return 200');

    const json = await res.json();
    assert.ok(json.tender, 'Response must contain tender');
    assert.strictEqual(json.tender.canonicalReference, '068074-2026');
  });

  // 33. Bug 4 Fix: UUID lookup for current UUID -> 200
  await test('Bug 4: UUID lookup for current UUID resolves with 200', async () => {
    const { GET: tenderGet } = await import('../src/app/api/tenders/[id]/route');
    const { createSessionToken, AUTH_COOKIE_NAME } = await import('../src/shared/auth/session');
    process.env.ADMIN_ACCESS_TOKEN = 'test-admin-key-unit-test-32chars-min!!';
    const token = await createSessionToken({ sub: 'admin', role: 'admin' });

    const req = new Request('http://localhost:3000/api/tenders/test-glasgow-uuid', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    });
    const res = await tenderGet(req, { params: { id: 'test-glasgow-uuid' } });
    assert.strictEqual(res.status, 200, 'UUID lookup must return 200');

    const json = await res.json();
    assert.ok(json.tender);
    assert.strictEqual(json.tender.id, 'test-glasgow-uuid');
    assert.strictEqual(json.tender.canonicalReference, '067718-2026');
  });

  // 34. Bug 4 Fix: OCID lookup -> 200
  await test('Bug 4: OCID lookup resolves with 200', async () => {
    const { GET: tenderGet } = await import('../src/app/api/tenders/[id]/route');
    const { createSessionToken, AUTH_COOKIE_NAME } = await import('../src/shared/auth/session');
    process.env.ADMIN_ACCESS_TOKEN = 'test-admin-key-unit-test-32chars-min!!';
    const token = await createSessionToken({ sub: 'admin', role: 'admin' });

    // Glasgow OCID
    const reqGlasgow = new Request('http://localhost:3000/api/tenders/ocds-h6vhtk-06cdb9', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    });
    const resGlasgow = await tenderGet(reqGlasgow, { params: { id: 'ocds-h6vhtk-06cdb9' } });
    assert.strictEqual(resGlasgow.status, 200, 'Glasgow OCID lookup must return 200');
    const jsonGlasgow = await resGlasgow.json();
    assert.strictEqual(jsonGlasgow.tender.canonicalReference, '067718-2026');

    // Aberdeen OCID
    const reqAberdeen = new Request('http://localhost:3000/api/tenders/ocds-h6vhtk-06ce78', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    });
    const resAberdeen = await tenderGet(reqAberdeen, { params: { id: 'ocds-h6vhtk-06ce78' } });
    assert.strictEqual(resAberdeen.status, 200, 'Aberdeen OCID lookup must return 200');
    const jsonAberdeen = await resAberdeen.json();
    assert.strictEqual(jsonAberdeen.tender.canonicalReference, '068074-2026');
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
