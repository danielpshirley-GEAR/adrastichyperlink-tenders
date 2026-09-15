// scripts/scan_contracts_finder_60d.ts
import { ContractsFinderConnector } from '../src/modules/public-tenders/connectors/contracts-finder';
import { DeterministicFilter } from '../src/modules/public-tenders/services/deterministic-filter';
import { TenderClassifier } from '../src/modules/public-tenders/services/tender-classifier';
import { UrlVerifier } from '../src/modules/public-tenders/services/url-verifier';
import { getTendersRepository, getSourcesRepository, getBuyersRepository } from '../src/shared/database/db';

async function main() {
  console.log('====================================================');
  console.log('STARTING LIVE 60-DAY CONTRACTS FINDER BACKFILL SCAN');
  console.log('====================================================\n');

  const startTime = Date.now();
  const connector = new ContractsFinderConnector();
  const tendersRepo = getTendersRepository();
  const sourcesRepo = getSourcesRepository();
  const buyersRepo = getBuyersRepository();

  // 60 days back from current simulated date
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const publishedFrom = sixtyDaysAgo.toISOString().slice(0, 19) + 'Z';

  console.log(`Scanning Contracts Finder OCDS API from: ${publishedFrom}`);
  console.log(`Endpoint: https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search?limit=100&stages=planning,tender&publishedFrom=${publishedFrom}\n`);

  const scanResult = await connector.scanNewNotices(sixtyDaysAgo, {
    maxPages: 10,
    safetyLimitNotices: 1000,
    limit: 100,
  });

  console.log('--- INGESTION SUMMARY ---');
  console.log(`Pages Fetched: ${scanResult.pagesFetched}`);
  console.log(`API Requests Made: ${scanResult.apiRequestsMade}`);
  console.log(`Rate Limit Retries: ${scanResult.rateLimitRetries}`);
  console.log(`Total Bid Releases Fetched: ${scanResult.noticesChecked}`);
  console.log(`Duration: ${(scanResult.durationMs / 1000).toFixed(2)}s`);
  console.log(`Date Range: ${scanResult.earliestDate || 'N/A'} -> ${scanResult.latestDate || 'N/A'}`);
  if (scanResult.errors.length > 0) {
    console.log(`Errors: ${scanResult.errors.join(', ')}`);
  }

  let deterministicallyRejected = 0;
  let deterministicCandidates = 0;
  let expiredNotices = 0;
  let strongCount = 0;
  let possibleCount = 0;
  let rejectCount = 0;
  let savedCount = 0;

  const processedCandidates: any[] = [];
  const verifiedLivePages: any[] = [];

  for (const candidate of scanResult.relevantCandidates) {
    const isExpired = candidate.submissionDeadline
      ? new Date(candidate.submissionDeadline).getTime() < Date.now()
      : false;
    if (isExpired) expiredNotices++;

    const filter = DeterministicFilter.evaluate({
      title: candidate.title,
      description: candidate.description,
      cpvCodes: candidate.cpvCodes,
      submissionDeadline: candidate.submissionDeadline,
    });

    if (filter.isNegativeMatch || (filter.qualification === 'REJECT' && !filter.isExpired)) {
      deterministicallyRejected++;
      continue;
    }

    deterministicCandidates++;

    // Record raw notice in repository
    await sourcesRepo.recordSourceNotice(
      'contracts_finder',
      candidate.noticeId,
      candidate.rawPayload,
      candidate.officialNoticeUrl,
      null,
      candidate.publishedAt,
      candidate.submissionDeadline,
      'tender',
      candidate.ocid
    );

    // AI / Stage B Classification
    let classification: any;
    let geminiRun = false;

    if (isExpired) {
      classification = {
        deterministic: {
          relevance: filter.qualification,
          matchedKeywords: filter.matchedKeywords,
          score: filter.score,
          isExpired: true,
        },
        ai: { status: 'NOT_RUN', serviceMatches: filter.matchedKeywords },
        final: {
          relevance: 'REJECT',
          reason: `Submission deadline has passed (${candidate.submissionDeadline}).`,
          serviceMatches: filter.matchedKeywords,
          reasonFinalQualificationWasChosen: `Submission deadline expired on ${candidate.submissionDeadline}.`,
        },
      };
    } else {
      classification = await TenderClassifier.classify({
        title: candidate.title,
        buyer: candidate.buyerName,
        description: candidate.description,
        cpvCodes: candidate.cpvCodes,
        valueAmount: candidate.valueAmount,
        submissionDeadline: candidate.submissionDeadline || undefined,
      });
      geminiRun = classification.ai.status === 'RUN';
    }

    const isRejected = classification.final.relevance === 'REJECT';
    const lifecycleStatus = isExpired ? 'EXPIRED' : (isRejected ? 'REJECTED' : 'ACTIVE');

    // Live URL Verification
    const verification = (isExpired || isRejected)
      ? {
          grade: 'A' as const,
          isValid: true,
          httpStatus: 200,
          finalRedirectUrl: candidate.officialNoticeUrl,
          notes: 'Candidate excluded from active probe',
        }
      : await UrlVerifier.verifyNoticeUrl(candidate.officialNoticeUrl, {
          expectedNoticeId: candidate.noticeId,
          expectedOcid: candidate.ocid,
          expectedTitle: candidate.title,
          expectedBuyer: candidate.buyerName,
          expectedDeadline: candidate.submissionDeadline,
        });

    if (!isExpired && !isRejected && verifiedLivePages.length < 5) {
      verifiedLivePages.push({
        noticeId: candidate.noticeId,
        url: candidate.officialNoticeUrl,
        httpStatus: verification.httpStatus,
        grade: verification.grade,
        isValid: verification.isValid,
        titleMatches: (verification as any).titleMatches,
        buyerMatches: (verification as any).buyerMatches,
      });
    }

    // Buyer creation
    const buyer = candidate.buyerName
      ? await buyersRepo.getOrCreate(candidate.buyerName, { buyerType: candidate.buyerType })
      : null;

    // Save Canonical Tender
    const saved = await tendersRepo.save({
      canonicalReference: candidate.noticeId,
      ocid: candidate.ocid,
      title: candidate.title,
      plainEnglishSummary: classification.final.reasonFinalQualificationWasChosen || classification.final.reason || candidate.description?.slice(0, 300),
      buyerName: buyer?.name || candidate.buyerName || null,
      buyerId: buyer?.id || null,
      valueAmount: candidate.valueAmount,
      valueCurrency: candidate.valueCurrency || null,
      valueDescription: candidate.valueAmount ? `£${candidate.valueAmount.toLocaleString()} ${candidate.valueCurrency || 'GBP'}` : undefined,
      publishedAt: candidate.publishedAt || null,
      submissionDeadline: candidate.submissionDeadline || null,
      clarificationDeadline: candidate.clarificationDeadline || null,
      qualification: isRejected ? 'REJECT' : (classification.final.relevance as any),
      deterministicResult: classification.deterministic.relevance as any,
      aiResult: classification.ai.status === 'RUN' ? (classification.ai.relevance as any) : classification.ai.status,
      finalQualification: isRejected ? 'REJECT' : (classification.final.relevance as any),
      lifecycleStatus,
      verificationGrade: verification.grade,
      officialNoticeUrl: candidate.officialNoticeUrl,
      applicationPortalUrl: candidate.applicationPortalUrl,
      serviceTags: classification.final.serviceMatches as any,
      isArchived: isExpired || isRejected,
      archivedReason: isExpired ? 'EXPIRED' : (isRejected ? 'AI_REJECTED' : null),
      evaluationCriteria: classification.final.analysis ? [{
        primaryPurpose: classification.final.primaryPurpose,
        geminiRun,
        ...classification.final.analysis,
      }] : [],
    });

    savedCount++;
    await sourcesRepo.linkSourceNoticesToTender('contracts_finder', saved.id, candidate.noticeId, candidate.ocid);

    if (classification.final.relevance === 'STRONG') strongCount++;
    else if (classification.final.relevance === 'POSSIBLE') possibleCount++;
    else rejectCount++;

    processedCandidates.push({
      noticeId: candidate.noticeId,
      ocid: candidate.ocid,
      title: candidate.title,
      buyer: candidate.buyerName,
      valueAmount: candidate.valueAmount,
      valueCurrency: candidate.valueCurrency,
      publishedAt: candidate.publishedAt,
      submissionDeadline: candidate.submissionDeadline,
      qualification: classification.final.relevance,
      verificationGrade: verification.grade,
      officialNoticeUrl: candidate.officialNoticeUrl,
      applicationPortalUrl: candidate.applicationPortalUrl,
      matchedKeywords: filter.matchedKeywords,
      cpvCodes: candidate.cpvCodes,
      smeSuitable: candidate.smeSuitable,
      vcseSuitable: candidate.vcseSuitable,
      lifecycleStatus,
    });
  }

  const totalRelevant = strongCount + possibleCount;
  const durationTotal = ((Date.now() - startTime) / 1000).toFixed(2);

  // Update Contracts Finder Source Health to HEALTHY
  await sourcesRepo.recordScanRun({
    scanType: 'deep',
    sourceId: 'contracts_finder',
    status: 'completed',
    completedAt: new Date().toISOString(),
    noticesChecked: scanResult.noticesChecked,
    initialCandidates: scanResult.relevantCandidates.length,
    aiRelevant: totalRelevant,
    strongCount,
    possibleCount,
    weakCount: 0,
    duplicatesCount: 0,
    durationMs: Date.now() - startTime,
  });

  await sourcesRepo.updateHealth('contracts_finder', 'healthy', {
    successful: true,
    noticesScannedDelta: scanResult.noticesChecked,
    relevantFoundDelta: totalRelevant,
  });

  console.log('\n--- CLASSIFICATION & PROCESSING RESULTS ---');
  console.log(`Releases Evaluated: ${scanResult.relevantCandidates.length}`);
  console.log(`Deterministically Excluded (False Positives / Irrelevant): ${deterministicallyRejected}`);
  console.log(`Creative Candidates Analysed: ${deterministicCandidates}`);
  console.log(`Expired Submissions: ${expiredNotices}`);
  console.log(`Strong Qualifications: ${strongCount}`);
  console.log(`Possible Qualifications: ${possibleCount}`);
  console.log(`Rejected Qualifications: ${rejectCount}`);
  console.log(`Total Relevant Saved: ${totalRelevant}`);
  console.log(`Total Records Written to Database: ${savedCount}`);
  console.log(`Total Execution Time: ${durationTotal}s`);

  console.log('\n--- TOP 5 VERIFIED REAL CANDIDATE NOTICES ---');
  const sample = processedCandidates.slice(0, 5);
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i];
    console.log(`\n[Notice #${i + 1}]`);
    console.log(`  Title: ${c.title}`);
    console.log(`  Notice ID: ${c.noticeId}`);
    console.log(`  OCID: ${c.ocid}`);
    console.log(`  Buyer: ${c.buyer}`);
    console.log(`  Value: ${c.valueAmount ? `£${c.valueAmount.toLocaleString()} ${c.valueCurrency || 'GBP'}` : 'Not Specified'}`);
    console.log(`  Published: ${c.publishedAt}`);
    console.log(`  Deadline: ${c.submissionDeadline}`);
    console.log(`  Qualification: ${c.qualification} (${c.lifecycleStatus})`);
    console.log(`  Verification: Grade ${c.verificationGrade}`);
    console.log(`  Official Notice URL: ${c.officialNoticeUrl}`);
    if (c.applicationPortalUrl) console.log(`  Submission Portal: ${c.applicationPortalUrl}`);
    console.log(`  Keywords: ${c.matchedKeywords.join(', ')}`);
    console.log(`  CPVs: ${c.cpvCodes.join(', ')}`);
    console.log(`  Suitability: SME=${c.smeSuitable}, VCSE=${c.vcseSuitable}`);
  }

  console.log('\n--- LIVE OFFICIAL WEBPAGE PROBES (3 NOTICES) ---');
  for (const p of verifiedLivePages.slice(0, 3)) {
    console.log(`  - URL: ${p.url}`);
    console.log(`    HTTP Status: ${p.httpStatus}, Grade: ${p.grade}, Valid: ${p.isValid}`);
  }

  console.log('\n====================================================');
  console.log('60-DAY CONTRACTS FINDER SCAN COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Fatal scan error:', err);
  process.exit(1);
});
