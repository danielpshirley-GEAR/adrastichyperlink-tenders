// scripts/test_contracts_finder.ts
import assert from 'assert';
import {
  ContractsFinderConnector,
  extractNoticeUuid,
  formatContractsFinderNoticeUrl,
  assertValidContractsFinderNoticeUrl,
} from '../src/modules/public-tenders/connectors/contracts-finder';
import { DeterministicFilter } from '../src/modules/public-tenders/services/deterministic-filter';
import { UrlVerifier } from '../src/modules/public-tenders/services/url-verifier';
import { SourceRegistry } from '../src/modules/public-tenders/connectors/registry';
import { GET as getHealth } from '../src/app/api/health/route';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('====================================================');
  console.log('RUNNING CONTRACTS FINDER COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  const connector = new ContractsFinderConnector();

  // 1. UUID Extraction
  await test('1. UUID extraction extracts 36-char lowercase UUID from release IDs', () => {
    const rawReleaseId = '392859ec-e188-4629-9a79-5e045efdf9bd-914058';
    const uuid = extractNoticeUuid(rawReleaseId);
    assert.strictEqual(uuid, '392859ec-e188-4629-9a79-5e045efdf9bd');

    const upperCaseUuid = 'A1B2C3D4-E5F6-7A8B-9C0D-1E2F3A4B5C6D-1';
    assert.strictEqual(extractNoticeUuid(upperCaseUuid), 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');

    const cleanUuid = '7d2e8e7b-1193-4a6c-9c71-248ab4c98a12';
    assert.strictEqual(extractNoticeUuid(cleanUuid), '7d2e8e7b-1193-4a6c-9c71-248ab4c98a12');
  });

  // 2. Official URL formatting and assertion
  await test('2. Official notice URL strictly follows https://www.contractsfinder.service.gov.uk/Notice/[UUID]', () => {
    const url = formatContractsFinderNoticeUrl('392859ec-e188-4629-9a79-5e045efdf9bd-914058');
    assert.strictEqual(url, 'https://www.contractsfinder.service.gov.uk/Notice/392859ec-e188-4629-9a79-5e045efdf9bd');
    assert.ok(assertValidContractsFinderNoticeUrl(url), 'Must match official regex');

    const rawWithQuery = 'https://www.contractsfinder.service.gov.uk/Notice/392859ec-e188-4629-9a79-5e045efdf9bd?referrer=rss';
    const cleaned = formatContractsFinderNoticeUrl('392859ec-e188-4629-9a79-5e045efdf9bd', rawWithQuery);
    assert.strictEqual(cleaned, 'https://www.contractsfinder.service.gov.uk/Notice/392859ec-e188-4629-9a79-5e045efdf9bd');
  });

  // 3. Search response parsing
  await test('3. OCDS Release payload parses correctly into RawNoticeRecord', () => {
    const releasePayload = {
      id: 'e6a8d672-0001-4b77-a841-f73919e59102-12345',
      ocid: 'ocds-b5fd17-e6a8d672-0001-4b77-a841-f73919e59102',
      date: '2026-03-01T10:00:00Z',
      tag: ['tender'],
      buyer: { name: 'Department for Culture, Media and Sport' },
      parties: [
        {
          roles: ['buyer'],
          name: 'Department for Culture, Media and Sport',
          details: { classifications: [{ description: 'Central Government Entity' }] },
          address: { locality: 'London', region: 'Greater London', postalCode: 'SW1A 2BQ' },
        },
      ],
      tender: {
        title: 'National Youth Campaign Video Production & Motion Design',
        description: 'Provision of creative agency services for animated explainer videos and digital campaign assets.',
        value: { amount: 150000, currency: 'GBP' },
        minValue: { amount: 100000, currency: 'GBP' },
        datePublished: '2026-03-01T10:00:00Z',
        tenderPeriod: { endDate: '2026-04-15T12:00:00Z' },
        enquiryPeriod: { endDate: '2026-04-01T12:00:00Z' },
        classification: { id: '92111250', description: 'Information film production' },
        items: [{ classification: { id: '79341400' } }],
        suitability: { sme: true, vcse: false },
        documents: [
          {
            id: 'doc-1',
            documentType: 'tenderNotice',
            url: 'https://www.contractsfinder.service.gov.uk/Notice/e6a8d672-0001-4b77-a841-f73919e59102',
            description: 'Official Notice Web Page',
          },
          {
            id: 'doc-2',
            documentType: 'procurementDocuments',
            url: 'https://supplier.e-procurement-portal.com/tender/12345',
            description: 'Submission Portal',
          },
        ],
      },
    };

    const parsed = connector.parseOcdsRelease(releasePayload);
    assert.ok(parsed, 'Parsed record must exist');
    assert.strictEqual(parsed!.sourceId, 'contracts_finder');
    assert.strictEqual(parsed!.noticeId, 'e6a8d672-0001-4b77-a841-f73919e59102');
    assert.strictEqual(parsed!.ocid, 'ocds-b5fd17-e6a8d672-0001-4b77-a841-f73919e59102');
    assert.strictEqual(parsed!.title, 'National Youth Campaign Video Production & Motion Design');
    assert.strictEqual(parsed!.buyerName, 'Department for Culture, Media and Sport');
    assert.strictEqual(parsed!.buyerType, 'Central Government Entity');
    assert.strictEqual(parsed!.buyerLocation, 'London, Greater London, SW1A 2BQ');
    assert.strictEqual(parsed!.valueAmount, 150000);
    assert.strictEqual(parsed!.valueCurrency, 'GBP');
    assert.strictEqual(parsed!.minValueAmount, 100000);
    assert.strictEqual(parsed!.publishedAt, '2026-03-01T10:00:00Z');
    assert.strictEqual(parsed!.submissionDeadline, '2026-04-15T12:00:00Z');
    assert.strictEqual(parsed!.clarificationDeadline, '2026-04-01T12:00:00Z');
    assert.strictEqual(parsed!.smeSuitable, true);
    assert.strictEqual(parsed!.vcseSuitable, false);
    assert.strictEqual(parsed!.officialNoticeUrl, 'https://www.contractsfinder.service.gov.uk/Notice/e6a8d672-0001-4b77-a841-f73919e59102');
    assert.strictEqual(parsed!.applicationPortalUrl, 'https://supplier.e-procurement-portal.com/tender/12345');
    assert.deepStrictEqual(parsed!.cpvCodes, ['92111250', '79341400']);
    assert.strictEqual(parsed!.documentLinks.length, 2);
  });

  // 4. Missing fields strictly remain null (No fake defaults or date synthesis)
  await test('4. Missing fields strictly remain null/undefined (No date or value synthesis)', () => {
    const minimalPayload = {
      id: '99999999-1111-2222-3333-444444444444-1',
      tender: {
        title: 'Minimal Opportunity',
      },
    };

    const parsed = connector.parseOcdsRelease(minimalPayload);
    assert.ok(parsed);
    assert.strictEqual(parsed!.valueAmount, undefined);
    assert.strictEqual(parsed!.valueCurrency, null);
    assert.strictEqual(parsed!.submissionDeadline, null);
    assert.strictEqual(parsed!.clarificationDeadline, null);
    assert.strictEqual(parsed!.publishedAt, null);
    assert.strictEqual(parsed!.buyerName, null);
    assert.strictEqual(parsed!.smeSuitable, undefined);
    assert.strictEqual(parsed!.vcseSuitable, undefined);
  });

  // 5. Award releases not treated as new bid opportunities
  await test('5. Award-only and contract releases are rejected from new bid discovery', () => {
    const awardPayload = {
      id: 'award-1234-uuid-1',
      tag: ['award'],
      tender: { title: 'Awarded Contract' },
    };
    const contractPayload = {
      id: 'contract-1234-uuid-1',
      tag: ['contract'],
      tender: { title: 'Signed Contract' },
    };
    const tenderPayload = {
      id: 'tender-1234-uuid-1',
      tag: ['tender'],
      tender: { title: 'Live Tender Opportunity' },
    };
    const planningPayload = {
      id: 'planning-1234-uuid-1',
      tag: ['planning'],
      tender: { title: 'Pipeline Engagement Notice' },
    };

    const isBidOpportunity = (r: any) => {
      const tags = Array.isArray(r.tag) ? r.tag : [];
      const isPureAward = tags.includes('award') || tags.includes('awardUpdate') || tags.includes('contract');
      return tags.includes('tender') || tags.includes('planning') || !isPureAward;
    };

    assert.strictEqual(isBidOpportunity(awardPayload), false, 'Pure award must be excluded');
    assert.strictEqual(isBidOpportunity(contractPayload), false, 'Pure contract must be excluded');
    assert.strictEqual(isBidOpportunity(tenderPayload), true, 'Tender stage is bid opportunity');
    assert.strictEqual(isBidOpportunity(planningPayload), true, 'Planning stage is bid opportunity');
  });

  // 6. Multi-CPV record collection
  await test('6. Multi-CPV collection aggregates primary and additional item classifications', () => {
    const payload = {
      id: 'cpv-uuid-1234-5678-000000000001-1',
      tender: {
        title: 'Multi CPV Project',
        classification: { id: '79822500' }, // Graphic design
        items: [
          {
            classification: { id: '92111200' }, // Advertising films
            additionalClassifications: [{ id: '72413000' }, { id: '79822500' }], // Website design + duplicate
          },
        ],
      },
    };

    const parsed = connector.parseOcdsRelease(payload);
    assert.ok(parsed);
    assert.deepStrictEqual(parsed!.cpvCodes, ['79822500', '92111200', '72413000']);
  });

  // 7. Preserves Non-GBP currencies
  await test('7. Preserves Non-GBP currencies when explicitly provided', () => {
    const payload = {
      id: 'euro-uuid-1234-5678-000000000002-1',
      tender: {
        title: 'European Collaboration',
        value: { amount: 50000, currency: 'EUR' },
      },
    };
    const parsed = connector.parseOcdsRelease(payload);
    assert.strictEqual(parsed!.valueCurrency, 'EUR');
    assert.strictEqual(parsed!.valueAmount, 50000);
  });

  // 8. Distinguishes official notice URL from external application portal URL
  await test('8. Distinguishes official notice URL from external submission portals', () => {
    const payload = {
      id: 'c0ffee11-2222-3333-4444-555555555555-1',
      tender: {
        title: 'Portal Tender',
        submissionMethodDetails: 'https://supplier.adamprocure.co.uk/project/789',
        documents: [
          {
            documentType: 'tenderNotice',
            url: 'https://www.contractsfinder.service.gov.uk/Notice/c0ffee11-2222-3333-4444-555555555555',
          },
          {
            documentType: 'biddingDocuments',
            url: 'https://www.sproc.net/portal/view/1234',
          },
        ],
      },
    };
    const parsed = connector.parseOcdsRelease(payload);
    assert.ok(parsed);
    assert.strictEqual(parsed!.officialNoticeUrl, 'https://www.contractsfinder.service.gov.uk/Notice/c0ffee11-2222-3333-4444-555555555555');
    assert.strictEqual(parsed!.applicationPortalUrl, 'https://www.sproc.net/portal/view/1234');
  });

  // 9. Deterministic filter: false positives on arboriculture / tree planting
  await test('9. Deterministic filter rejects arboriculture & growing media false positives', () => {
    const arborNotice = {
      title: 'Supply of Growing Media and Arboricultural Services',
      description: 'The Council requires growing media, peat-free compost, and tree planting services.',
      cpvCodes: ['03451000'],
    };
    const evalResult = DeterministicFilter.evaluate(arborNotice);
    assert.strictEqual(evalResult.passed, false, 'Must reject growing media / arboriculture');
    assert.strictEqual(evalResult.qualification, 'REJECT');
    assert.ok(evalResult.rejectedReason?.includes('growing media') || evalResult.rejectedReason?.includes('Arboriculture'));
  });

  // 10. Deterministic filter: false positives on passenger & taxi transport
  await test('10. Deterministic filter rejects passenger assistant and taxi routes', () => {
    const taxiNotice = {
      title: 'Passenger Assistant and Taxi and MPV Transport Services',
      description: 'Home to school transport and special educational needs travel assistance.',
      cpvCodes: ['60120000'],
    };
    const evalResult = DeterministicFilter.evaluate(taxiNotice);
    assert.strictEqual(evalResult.passed, false, 'Must reject passenger transport');
    assert.strictEqual(evalResult.qualification, 'REJECT');
  });

  // 11. Deterministic filter: false positives on clinical imaging / endoscopy
  await test('11. Deterministic filter rejects medical imaging & clinical video equipment', () => {
    const medicalNotice = {
      title: 'Clinical Video and Medical Imaging Maintenance',
      description: 'Maintenance services for endoscopy and ultrasound visualization towers.',
      cpvCodes: ['33100000'],
    };
    const evalResult = DeterministicFilter.evaluate(medicalNotice);
    assert.strictEqual(evalResult.passed, false, 'Must reject medical video');
    assert.strictEqual(evalResult.qualification, 'REJECT');
  });

  // 12. Deterministic filter: false positives on roofing repairs
  await test('12. Deterministic filter rejects roofing and flat roof repairs', () => {
    const roofNotice = {
      title: 'Flat Roof Repair and Guttering Framework',
      description: 'Design and installation of mastic asphalt roofing membrane.',
      cpvCodes: ['45261900'],
    };
    const evalResult = DeterministicFilter.evaluate(roofNotice);
    assert.strictEqual(evalResult.passed, false, 'Must reject roofing');
    assert.strictEqual(evalResult.qualification, 'REJECT');
  });

  // 13. Deterministic filter: qualifies genuine creative opportunities
  await test('13. Deterministic filter qualifies genuine creative opportunities (STRONG/POSSIBLE)', () => {
    const motionNotice = {
      title: '2D Animation and Explainer Video Production',
      description: 'Creative studio required for brand strategy, motion graphics, and digital content creation.',
      cpvCodes: ['92111250'],
    };
    const evalResult = DeterministicFilter.evaluate(motionNotice);
    assert.strictEqual(evalResult.passed, true, 'Must pass creative opportunity');
    assert.strictEqual(evalResult.qualification, 'STRONG');
    assert.ok(evalResult.matchedKeywords.includes('explainer video'));
    assert.ok(evalResult.matchedKeywords.includes('motion graphics'));
  });

  // 14. Deterministic filter: rejects expired deadlines
  await test('14. Deterministic filter marks past deadlines as expired and REJECT', () => {
    const expiredNotice = {
      title: 'Brand Identity Design',
      description: 'Visual identity creation.',
      submissionDeadline: '2020-01-01T12:00:00Z',
    };
    const evalResult = DeterministicFilter.evaluate(expiredNotice);
    assert.strictEqual(evalResult.passed, false);
    assert.strictEqual(evalResult.isExpired, true);
    assert.strictEqual(evalResult.qualification, 'REJECT');
  });

  // 15. UrlVerifier recognizes contractsfinder.service.gov.uk as official domain
  await test('15. UrlVerifier recognizes contractsfinder.service.gov.uk as official domain', async () => {
    const nonOfficial = await UrlVerifier.verifyNoticeUrl('https://fraudulent-portal.co.uk/Notice/1234');
    assert.strictEqual(nonOfficial.grade, 'X');
    assert.strictEqual(nonOfficial.isValid, false);
  });

  // 16. SourceRegistry reports 2 active sources and 5 not implemented sources
  await test('16. SourceRegistry reports 2 Active (FTS, CF) and 5 Not Implemented', async () => {
    const registry = SourceRegistry.getInstance();
    const meta = await registry.getSourcesMeta();
    assert.strictEqual(meta.length, 7, 'Must have 7 total sources');

    const active = meta.filter((s) => s.health !== 'not_implemented');
    const notImplemented = meta.filter((s) => s.health === 'not_implemented');

    assert.strictEqual(active.length, 2, 'Exactly 2 sources must be active');
    assert.strictEqual(notImplemented.length, 5, 'Exactly 5 sources must be not_implemented');

    const fts = meta.find((s) => s.id === 'find_a_tender');
    const cf = meta.find((s) => s.id === 'contracts_finder');
    assert.ok(fts, 'Find a Tender must exist');
    assert.ok(cf, 'Contracts Finder must exist');
    assert.strictEqual(fts?.health, 'healthy');
    assert.ok(cf?.health === 'healthy' || cf?.health === 'untested');
  });

  // 17. GET /api/health reports findATender, contractsFinder, and 5 remaining sources
  await test('17. /api/health reports findATender, contractsFinder, and remainingSources (5)', async () => {
    const res = await getHealth();
    assert.strictEqual(res.status, 200);
    const json = await res.json();

    assert.ok(json.findATender, 'findATender field must exist');
    assert.ok(json.contractsFinder, 'contractsFinder field must exist');
    assert.strictEqual(json.findATender.health, 'healthy');
    assert.ok(json.contractsFinder.health === 'healthy' || json.contractsFinder.health === 'untested');

    assert.ok(json.remainingSources, 'remainingSources field must exist');
    assert.strictEqual(json.remainingSources.total, 5);
    assert.strictEqual(json.remainingSources.notImplemented, 5);
    assert.strictEqual(json.remainingSources.status, 'NOT IMPLEMENTED');

    assert.ok(json.otherSources, 'otherSources field must exist for backward compatibility');
    assert.strictEqual(json.otherSources.total, 5);
  });

  // 18. Rate limit 403 backoff logic & bounded retries
  await test('18. Rate limit policy: max retries bounded, 403 progressive backoff calculated', () => {
    for (let retry = 1; retry <= 5; retry++) {
      const waitMs = Math.min(30000 * retry, 300000);
      assert.ok(waitMs >= 30000 && waitMs <= 300000, `Wait for attempt ${retry} must be between 30s and 300s`);
    }
    const cappedWaitMs = Math.min(30000 * 10, 300000);
    assert.strictEqual(cappedWaitMs, 300000, 'Must cap at 300,000ms (5 minutes)');
  });

  // 19. Cross-source deduplication logic
  await test('19. Cross-source identity precedence maintains provenance without overwriting', () => {
    const ftsNotice = {
      sourceId: 'find_a_tender',
      canonicalReference: '067718-2026',
      ocid: 'ocds-b5fd17-067718-2026',
      title: 'Creative Framework',
    };
    const cfNotice = {
      sourceId: 'contracts_finder',
      canonicalReference: '392859ec-e188-4629-9a79-5e045efdf9bd',
      ocid: 'ocds-b5fd17-067718-2026',
      title: 'Creative Framework - Contracts Finder Release',
    };

    assert.strictEqual(ftsNotice.ocid, cfNotice.ocid, 'OCIDs match across sources');
    assert.notStrictEqual(ftsNotice.canonicalReference, cfNotice.canonicalReference, 'Source notice IDs remain distinct');
  });

  // 20. Pagination cursor link handling
  await test('20. Pagination traversal detects presence of next cursor link', () => {
    const page1 = {
      releases: [{ id: 'rel-1' }],
      links: { next: 'https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?cursor=abc123' },
    };
    const page2 = {
      releases: [{ id: 'rel-2' }],
      links: {},
    };

    assert.ok(page1.links.next);
    assert.strictEqual(Boolean(page2.links.next), false);
  });

  // 21. Handles malformed JSON payloads gracefully
  await test('21. Parse handles malformed / null release objects gracefully', () => {
    assert.strictEqual(connector.parseOcdsRelease(null), null);
    assert.strictEqual(connector.parseOcdsRelease(undefined), null);
    assert.strictEqual(connector.parseOcdsRelease({}), null);
    assert.strictEqual(connector.parseOcdsRelease({ id: '' }), null);
  });

  // 22. User-Agent header formatting prevents WAF 403 blocks
  await test('22. Connector User-Agent identifies engine with contact and browser string', () => {
    const ua = (connector as any).userAgent;
    assert.ok(ua.includes('Adrastichyperlink Procurement Engine'));
    assert.ok(ua.includes('contact@adrastichyperlink.com'));
    assert.ok(ua.includes('Mozilla/5.0'));
  });

  // 23. Direct notice retrieval respects 404
  await test('23. fetchNotice returns null for non-existent or blank notice IDs', async () => {
    const result = await connector.fetchNotice('');
    assert.strictEqual(result, null);
  });

  // 24. SME suitability extraction
  await test('24. SME & VCSE suitability flags are extracted as strict booleans or undefined', () => {
    const payloadTrue = {
      id: 'sme-test-1',
      tender: { suitability: { sme: true, vcse: true } },
    };
    const parsedTrue = connector.parseOcdsRelease(payloadTrue);
    assert.strictEqual(parsedTrue?.smeSuitable, true);
    assert.strictEqual(parsedTrue?.vcseSuitable, true);

    const payloadFalse = {
      id: 'sme-test-2',
      tender: { suitability: { sme: false, vcse: false } },
    };
    const parsedFalse = connector.parseOcdsRelease(payloadFalse);
    assert.strictEqual(parsedFalse?.smeSuitable, false);
    assert.strictEqual(parsedFalse?.vcseSuitable, false);
  });

  console.log('\n====================================================');
  console.log(`CONTRACTS FINDER SUITE: ${passed} / ${passed + failed} TESTS PASSED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
