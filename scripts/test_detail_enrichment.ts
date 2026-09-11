// scripts/test_detail_enrichment.ts
import { DetailEnrichmentService } from '../src/modules/public-tenders/services/detail-enrichment';
import { FindATenderConnector } from '../src/modules/public-tenders/connectors/find-a-tender';
import { getTendersRepository } from '../src/shared/database/db';

async function main() {
  console.log('====================================================');
  console.log('TESTING DETAIL ENRICHMENT PIPELINE & ABERDEEN REAL-LIFE NOTICE');
  console.log('====================================================');

  const connector = new FindATenderConnector();
  const enrichmentService = new DetailEnrichmentService();
  const repo = getTendersRepository();

  console.log('\n--- 1. Fetching Real Official Notice: 068074-2026 ---');
  const noticeId = '068074-2026';
  const rawNotice = await connector.fetchNotice(noticeId);
  if (!rawNotice) {
    throw new Error(`Failed to fetch official notice ${noticeId} from Find a Tender OCDS endpoint.`);
  }

  console.log(`[PASS] Retrieved OCDS release for ${rawNotice.noticeId} (${rawNotice.title})`);
  console.log(`- Tag: ${JSON.stringify((rawNotice.rawPayload as any)?.tag)}`);
  console.log(`- Value: £${rawNotice.valueAmount?.toLocaleString()} ${rawNotice.valueCurrency}`);
  console.log(`- Buyer: ${rawNotice.buyerName}`);

  console.log('\n--- 2. Deterministic Stage Resolution ---');
  const stage = DetailEnrichmentService.determineProcurementStage(
    rawNotice.rawPayload,
    rawNotice.title,
    rawNotice.description
  );
  console.log(`- Resolved Procurement Stage: ${stage}`);
  if (stage !== 'PRELIMINARY MARKET ENGAGEMENT') {
    throw new Error(`Expected PRELIMINARY MARKET ENGAGEMENT, got: ${stage}`);
  }
  console.log('[PASS] Correctly classified as PRELIMINARY MARKET ENGAGEMENT (PIN without call for competition).');

  console.log('\n--- 3. Running Detail Enrichment Pipeline ---');
  const initialTender = {
    id: 'test-aberdeen-uuid',
    canonicalReference: noticeId,
    latestNoticeId: noticeId,
    ocid: rawNotice.ocid,
    title: rawNotice.title,
    plainEnglishSummary: rawNotice.description.slice(0, 200),
    buyerName: rawNotice.buyerName,
    valueAmount: rawNotice.valueAmount,
    valueCurrency: rawNotice.valueCurrency,
    publishedAt: rawNotice.publishedAt,
    submissionDeadline: rawNotice.submissionDeadline,
    qualification: 'STRONG' as const,
    verificationGrade: 'A' as const,
    officialNoticeUrl: rawNotice.officialNoticeUrl,
    serviceTags: ['marketing', 'campaign', 'visual_identity'] as any[],
    sourceId: 'find_a_tender',
    isArchived: false,
    discoveredAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
    bidDecisionState: 'UNDECIDED' as const,
  };

  const enrichment = await enrichmentService.enrichTender(initialTender, rawNotice);
  console.log('\n=== ENRICHMENT SUMMARY ===');
  console.log(`- Procurement Stage: ${enrichment.procurementStage}`);
  console.log(`- Is Open For Bid: ${enrichment.submissionDetails.isOpenForBid} (Expected: false)`);
  console.log(`- Is Market Engagement: ${enrichment.submissionDetails.isMarketEngagement} (Expected: true)`);
  console.log(`- Scope Populated: ${Boolean(enrichment.scopeAndSpec.whatBuyerWants)}`);
  console.log(`- What Buyer Wants: ${enrichment.scopeAndSpec.whatBuyerWants.slice(0, 100)}...`);
  console.log(`- Business Objective: ${enrichment.scopeAndSpec.businessObjective.slice(0, 100)}...`);
  console.log(`- Required Services (${enrichment.scopeAndSpec.requiredServices.length}):`, enrichment.scopeAndSpec.requiredServices);
  console.log(`- Key Deliverables (${enrichment.scopeAndSpec.keyDeliverables.length}):`, enrichment.scopeAndSpec.keyDeliverables);
  console.log(`- Creative Overlap:`, enrichment.scopeAndSpec.creativeMarketingDigitalOverlap);
  console.log(`- Outside Capability:`, enrichment.scopeAndSpec.servicesOutsideCoreCapability);
  console.log(`- Important Dates:`, enrichment.scopeAndSpec.importantDates);
  console.log(`- Documents Found (${enrichment.documents.length}):`);
  enrichment.documents.forEach((d) => {
    console.log(`  * [${d.accessState}] ${d.fileName} (${d.docType})`);
  });
  console.log(`- Eligibility Items (${enrichment.requirements.length}):`);
  enrichment.requirements.forEach((r) => {
    console.log(`  * [${r.status}] ${r.requirementName} (${r.category})`);
  });
  console.log(`- Evaluation Criteria (${enrichment.evaluationCriteria.length}):`);
  enrichment.evaluationCriteria.forEach((c) => {
    console.log(`  * ${c.criterion} (Weight: ${c.weightingPercentage ?? 'None'}, Published: ${c.isPublished})`);
  });
  console.log(`- Submission Route: ${enrichment.submissionDetails.submissionRoute}`);
  console.log(`- Submission Portal: ${enrichment.submissionDetails.submissionPortalUrl}`);
  console.log(`- Buyer Contact:`, enrichment.submissionDetails.buyerContact);
  console.log(`- Fit Rationale: ${enrichment.fitAndRisks.whyAdrastichyperlinkFits}`);
  console.log(`- Partnering Recommendation: ${enrichment.fitAndRisks.partneringRecommendation}`);
  console.log(`- Source Evidence Items (${enrichment.sourceEvidence.length}):`);
  enrichment.sourceEvidence.forEach((ev) => {
    console.log(`  * ${ev.topic}: "${ev.fact}" (Source: ${ev.source})`);
  });

  // Assertions
  if (enrichment.submissionDetails.isOpenForBid !== false) {
    throw new Error('FAIL: Preliminary Market Engagement should NOT be open for bid!');
  }
  if (enrichment.scopeAndSpec.requiredServices.length === 0) {
    throw new Error('FAIL: Required services were not extracted!');
  }
  if (enrichment.requirements.length === 0) {
    throw new Error('FAIL: Requirements were not populated!');
  }
  if (enrichment.documents.length === 0) {
    throw new Error('FAIL: Documents were not discovered!');
  }
  if (enrichment.sourceEvidence.length === 0) {
    throw new Error('FAIL: Source evidence attribution missing!');
  }

  console.log('\n--- 4. Repository Persistence & Parity Verification ---');
  const tenderToSave = {
    ...initialTender,
    procurementStage: enrichment.procurementStage,
    requirements: enrichment.requirements,
    documents: enrichment.documents,
    evaluationCriteria: enrichment.evaluationCriteria,
    enrichment,
  };

  const saved = await repo.save(tenderToSave);
  console.log(`[PASS] Tender saved to database with ID: ${saved.id}`);

  const loaded = await repo.getByCanonicalReference(noticeId);
  if (!loaded) {
    throw new Error(`FAIL: Could not retrieve saved tender by canonical reference ${noticeId}`);
  }

  console.log(`[PASS] Tender loaded from database:`);
  console.log(`- Procurement Stage: ${loaded.procurementStage}`);
  console.log(`- Requirements Count: ${loaded.requirements?.length}`);
  console.log(`- Documents Count: ${loaded.documents?.length}`);
  console.log(`- Evaluation Criteria Count: ${loaded.evaluationCriteria?.length}`);
  console.log(`- Enrichment Present: ${Boolean(loaded.enrichment)}`);

  if (!loaded.enrichment || !loaded.requirements?.length || !loaded.documents?.length) {
    throw new Error('FAIL: Enrichment payload did not round-trip through repository!');
  }

  console.log('\n====================================================');
  console.log('ALL DETAIL ENRICHMENT TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
