// scripts/test_detail_enrichment.ts
import { DetailEnrichmentService } from '../src/modules/public-tenders/services/detail-enrichment';
import { FindATenderConnector } from '../src/modules/public-tenders/connectors/find-a-tender';
import { getTendersRepository } from '../src/shared/database/db';
import assert from 'assert';

async function main() {
  console.log('====================================================');
  console.log('GENERIC DETAIL ENRICHMENT PIPELINE VALIDATION');
  console.log('Testing: 068074-2026 (Aberdeen) & 067718-2026 (Glasgow)');
  console.log('====================================================');

  const connector = new FindATenderConnector();
  const enrichmentService = new DetailEnrichmentService();
  const repo = getTendersRepository();

  // ====================================================
  // TEST 1: ABERDEEN NOTICE (068074-2026)
  // ====================================================
  console.log('\n----------------------------------------------------');
  console.log('1. VALIDATING ABERDEEN NOTICE: 068074-2026');
  console.log('----------------------------------------------------');

  const aberdeenRaw = await connector.fetchNotice('068074-2026');
  if (!aberdeenRaw) throw new Error('Could not fetch Aberdeen notice 068074-2026');

  console.log(`[PASS] Fetched official OCDS notice: ${aberdeenRaw.noticeId} (${aberdeenRaw.title})`);
  console.log(`- Value: £${aberdeenRaw.valueAmount?.toLocaleString()} ${aberdeenRaw.valueCurrency}`);
  console.log(`- Buyer: ${aberdeenRaw.buyerName}`);

  const aberdeenTender = {
    id: 'test-aberdeen-uuid',
    canonicalReference: '068074-2026',
    latestNoticeId: '068074-2026',
    ocid: aberdeenRaw.ocid,
    title: aberdeenRaw.title,
    plainEnglishSummary: aberdeenRaw.description.slice(0, 200),
    buyerName: aberdeenRaw.buyerName,
    valueAmount: aberdeenRaw.valueAmount,
    valueCurrency: aberdeenRaw.valueCurrency,
    publishedAt: aberdeenRaw.publishedAt,
    submissionDeadline: aberdeenRaw.submissionDeadline,
    qualification: 'STRONG' as const,
    verificationGrade: 'A' as const,
    officialNoticeUrl: aberdeenRaw.officialNoticeUrl,
    serviceTags: ['marketing', 'campaign', 'visual_identity'] as any[],
    sourceId: 'find_a_tender',
    isArchived: false,
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    bidDecisionState: 'UNDECIDED' as const,
  };

  const aberdeenEnrichment = await enrichmentService.enrichTender(aberdeenTender, aberdeenRaw);

  console.log('\n=== ABERDEEN ENRICHMENT RESULT ===');
  console.log(`- Procurement Stage: ${aberdeenEnrichment.procurementStage}`);
  console.log(`- Formal Bid Open: ${aberdeenEnrichment.submissionDetails.isOpenForBid}`);
  console.log(`- Market Engagement: ${aberdeenEnrichment.submissionDetails.isMarketEngagement}`);
  console.log(`- Published Buyer Scope (${aberdeenEnrichment.scopeAndSpec.buyerRequiredServices.length}):`, aberdeenEnrichment.scopeAndSpec.buyerRequiredServices);
  console.log(`- Buyer Deliverables (${aberdeenEnrichment.scopeAndSpec.buyerKeyDeliverables.length}):`, aberdeenEnrichment.scopeAndSpec.buyerKeyDeliverables);
  console.log(`- Creative Opportunities (${aberdeenEnrichment.scopeAndSpec.creativeOpportunities.length}):`, aberdeenEnrichment.scopeAndSpec.creativeOpportunities.map(o => o.opportunity));
  console.log(`- Eligibility Published: ${aberdeenEnrichment.isEligibilityPublished} (Requirements count: ${aberdeenEnrichment.requirements.length})`);
  console.log(`- Evaluation Published: ${aberdeenEnrichment.evaluationCriteria[0]?.isPublished}`);
  console.log(`- Document Counts:`, aberdeenEnrichment.documentCounts);
  console.log(`- Document Items:`);
  aberdeenEnrichment.documents.forEach(d => {
    console.log(`  * [${d.category}] ${d.fileName} (Access: ${d.accessState}, Hash: ${d.fileHash})`);
  });
  console.log(`- Market Engagement Form:`, aberdeenEnrichment.submissionDetails.marketEngagementForm);
  console.log(`- Contact Point:`, aberdeenEnrichment.submissionDetails.buyerContact);
  console.log(`- Partnering Recommendation:`, aberdeenEnrichment.fitAndRisks.partneringRecommendation);

  // Assertions for Aberdeen
  assert.strictEqual(aberdeenEnrichment.procurementStage, 'PRELIMINARY MARKET ENGAGEMENT');
  assert.strictEqual(aberdeenEnrichment.submissionDetails.isOpenForBid, false, 'Bidding must NOT be open for PME');
  assert.strictEqual(aberdeenEnrichment.submissionDetails.isMarketEngagement, true);
  assert.strictEqual(aberdeenEnrichment.requirements.length, 0, 'Must NOT fabricate eligibility requirements for Aberdeen');
  assert.strictEqual(aberdeenEnrichment.isEligibilityPublished, false);
  assert.strictEqual(aberdeenEnrichment.evaluationCriteria[0].isPublished, false);
  assert.ok(aberdeenEnrichment.evaluationCriteria[0].criterion.includes('not yet been published'));
  assert.ok(aberdeenEnrichment.scopeAndSpec.buyerRequiredServices.length > 0, 'Must extract buyer scope');
  assert.strictEqual(aberdeenEnrichment.scopeAndSpec.buyerKeyDeliverables.length, 0, 'Must not claim deliverables when unstated');
  assert.ok(aberdeenEnrichment.scopeAndSpec.creativeOpportunities.length > 0, 'Must provide creative opportunities');
  aberdeenEnrichment.scopeAndSpec.creativeOpportunities.forEach(o => {
    assert.strictEqual(o.label, 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT');
  });
  aberdeenEnrichment.documents.forEach(d => {
    assert.strictEqual(d.fileHash, null, 'Un-downloaded documents must have null fileHash');
  });
  assert.ok(aberdeenEnrichment.submissionDetails.buyerContact.name?.toLowerCase().includes('mark bremner'));
  assert.strictEqual(aberdeenEnrichment.submissionDetails.buyerContact.email, 'markbremner@aberdeencity.gov.uk');
  assert.ok(aberdeenEnrichment.fitAndRisks.partneringRecommendation.includes('PARTNER'));
  console.log('[PASS] All Aberdeen assertions passed.');

  // ====================================================
  // TEST 2: GLASGOW NOTICE (067718-2026)
  // ====================================================
  console.log('\n----------------------------------------------------');
  console.log('2. VALIDATING GLASGOW NOTICE: 067718-2026');
  console.log('----------------------------------------------------');

  const glasgowRaw = await connector.fetchNotice('067718-2026');
  if (!glasgowRaw) throw new Error('Could not fetch Glasgow notice 067718-2026');

  console.log(`[PASS] Fetched official OCDS notice: ${glasgowRaw.noticeId} (${glasgowRaw.title})`);
  console.log(`- Value: £${glasgowRaw.valueAmount?.toLocaleString()} ${glasgowRaw.valueCurrency}`);
  console.log(`- Buyer: ${glasgowRaw.buyerName}`);

  const glasgowTender = {
    id: 'test-glasgow-uuid',
    canonicalReference: '067718-2026',
    latestNoticeId: '067718-2026',
    ocid: glasgowRaw.ocid,
    title: glasgowRaw.title,
    plainEnglishSummary: glasgowRaw.description.slice(0, 200),
    buyerName: glasgowRaw.buyerName,
    valueAmount: glasgowRaw.valueAmount,
    valueCurrency: glasgowRaw.valueCurrency,
    publishedAt: glasgowRaw.publishedAt,
    submissionDeadline: glasgowRaw.submissionDeadline,
    qualification: 'POSSIBLE' as const,
    verificationGrade: 'A' as const,
    officialNoticeUrl: glasgowRaw.officialNoticeUrl,
    serviceTags: ['creative_strategy', 'marketing'] as any[],
    sourceId: 'find_a_tender',
    isArchived: false,
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    bidDecisionState: 'UNDECIDED' as const,
  };

  const glasgowEnrichment = await enrichmentService.enrichTender(glasgowTender, glasgowRaw);

  console.log('\n=== GLASGOW ENRICHMENT RESULT ===');
  console.log(`- Procurement Stage: ${glasgowEnrichment.procurementStage}`);
  console.log(`- Formal Bid Open: ${glasgowEnrichment.submissionDetails.isOpenForBid}`);
  console.log(`- Market Engagement: ${glasgowEnrichment.submissionDetails.isMarketEngagement}`);
  console.log(`- Published Buyer Scope (${glasgowEnrichment.scopeAndSpec.buyerRequiredServices.length}):`, glasgowEnrichment.scopeAndSpec.buyerRequiredServices);
  console.log(`- Buyer Deliverables (${glasgowEnrichment.scopeAndSpec.buyerKeyDeliverables.length}):`, glasgowEnrichment.scopeAndSpec.buyerKeyDeliverables);
  console.log(`- Creative Opportunities (${glasgowEnrichment.scopeAndSpec.creativeOpportunities.length}):`, glasgowEnrichment.scopeAndSpec.creativeOpportunities.map(o => o.opportunity));
  console.log(`- Eligibility Published: ${glasgowEnrichment.isEligibilityPublished} (Requirements count: ${glasgowEnrichment.requirements.length})`);
  console.log(`- Evaluation Published: ${glasgowEnrichment.evaluationCriteria[0]?.isPublished}`);
  console.log(`- Document Counts:`, glasgowEnrichment.documentCounts);
  console.log(`- Document Items:`);
  glasgowEnrichment.documents.forEach(d => {
    console.log(`  * [${d.category}] ${d.fileName} (Access: ${d.accessState}, Hash: ${d.fileHash})`);
  });
  console.log(`- Contact Point:`, glasgowEnrichment.submissionDetails.buyerContact);
  console.log(`- Partnering Recommendation:`, glasgowEnrichment.fitAndRisks.partneringRecommendation);

  // Assertions for Glasgow
  assert.strictEqual(glasgowEnrichment.procurementStage, 'PRELIMINARY MARKET ENGAGEMENT');
  assert.strictEqual(glasgowEnrichment.submissionDetails.isOpenForBid, false);
  assert.strictEqual(glasgowEnrichment.requirements.length, 0, 'Must NOT fabricate requirements for Glasgow');
  assert.strictEqual(glasgowEnrichment.isEligibilityPublished, false);
  assert.strictEqual(glasgowEnrichment.evaluationCriteria[0].isPublished, false);
  assert.ok(glasgowEnrichment.scopeAndSpec.buyerRequiredServices.length > 0);
  assert.strictEqual(glasgowEnrichment.scopeAndSpec.buyerKeyDeliverables.length, 0);
  assert.ok(glasgowEnrichment.scopeAndSpec.creativeOpportunities.length > 0);
  glasgowEnrichment.documents.forEach(d => {
    assert.strictEqual(d.fileHash, null);
  });
  assert.ok(glasgowEnrichment.fitAndRisks.partneringRecommendation.includes('PARTNER'));
  console.log('[PASS] All Glasgow assertions passed.');

  // ====================================================
  // TEST 3: REPOSITORY PERSISTENCE & PARITY
  // ====================================================
  console.log('\n----------------------------------------------------');
  console.log('3. REPOSITORY PERSISTENCE & PARITY VERIFICATION');
  console.log('----------------------------------------------------');

  const tenderToSave = {
    ...aberdeenTender,
    procurementStage: aberdeenEnrichment.procurementStage,
    requirements: aberdeenEnrichment.requirements,
    isEligibilityPublished: aberdeenEnrichment.isEligibilityPublished,
    eligibilityNoticeText: aberdeenEnrichment.eligibilityNoticeText,
    documents: aberdeenEnrichment.documents,
    evaluationCriteria: aberdeenEnrichment.evaluationCriteria,
    enrichment: aberdeenEnrichment,
  };

  const saved = await repo.save(tenderToSave);
  const loaded = await repo.getByCanonicalReference('068074-2026');
  assert.ok(loaded, 'Tender must load from repository');
  assert.strictEqual(loaded.procurementStage, 'PRELIMINARY MARKET ENGAGEMENT');
  assert.strictEqual(loaded.requirements?.length, 0);
  assert.strictEqual(loaded.documents?.length, aberdeenEnrichment.documents.length);
  assert.strictEqual(loaded.documents?.[0].fileHash, null);
  assert.ok(loaded.enrichment, 'Enrichment payload must persist');
  console.log('[PASS] Repository roundtrip verified successfully.');

  console.log('\n====================================================');
  console.log('ALL DUAL-NOTICE REAL-LIFE ENRICHMENT TESTS PASSED!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
