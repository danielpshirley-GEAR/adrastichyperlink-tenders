// scripts/sync_contracts_finder_render.ts
import { ContractsFinderConnector } from '../src/modules/public-tenders/connectors/contracts-finder';
import { DeterministicFilter } from '../src/modules/public-tenders/services/deterministic-filter';
import { TenderClassifier } from '../src/modules/public-tenders/services/tender-classifier';
import { UrlVerifier } from '../src/modules/public-tenders/services/url-verifier';
import { getTendersRepository, getSourcesRepository, getBuyersRepository, checkDatabaseHealth } from '../src/shared/database/db';

async function main() {
  console.log('====================================================');
  console.log('[Render Startup] Checking Contracts Finder Sync State');
  console.log('====================================================');

  try {
    const dbHealth = await checkDatabaseHealth();
    console.log(`[Render Startup] Database engine: ${dbHealth.type}, healthy: ${dbHealth.healthy}`);

    if (!dbHealth.healthy) {
      console.log('[Render Startup] Database not healthy/configured. Skipping sync.');
      return;
    }

    const sourcesRepo = getSourcesRepository();
    const sourceRecord = await sourcesRepo.getById('contracts_finder');

    console.log(`[Render Startup] Current contracts_finder state:`, {
      healthStatus: sourceRecord?.healthStatus,
      lastSuccessfulScanAt: sourceRecord?.lastSuccessfulScanAt,
      totalNoticesScanned: sourceRecord?.totalNoticesScanned,
      totalRelevantFound: sourceRecord?.totalRelevantFound,
    });

    if (
      sourceRecord &&
      sourceRecord.healthStatus === 'healthy' &&
      (sourceRecord.totalNoticesScanned || 0) > 0 &&
      sourceRecord.lastSuccessfulScanAt
    ) {
      console.log('[Render Startup] Contracts Finder is already HEALTHY with scanned notices. Skipping initial scan.');
      return;
    }

    console.log('[Render Startup] Running initial Contracts Finder backfill scan...');
    const startTime = Date.now();
    const connector = new ContractsFinderConnector();
    const tendersRepo = getTendersRepository();
    const buyersRepo = getBuyersRepository();

    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const scanResult = await connector.scanNewNotices(sixtyDaysAgo, {
      maxPages: 6,
      safetyLimitNotices: 800,
      limit: 100,
    });

    console.log(`[Render Startup] Fetched ${scanResult.noticesChecked} releases across ${scanResult.pagesFetched} pages in ${(scanResult.durationMs / 1000).toFixed(2)}s`);

    let deterministicallyRejected = 0;
    let deterministicCandidates = 0;
    let strongCount = 0;
    let possibleCount = 0;
    let rejectCount = 0;
    let savedCount = 0;

    for (const candidate of scanResult.relevantCandidates) {
      const isExpired = candidate.submissionDeadline
        ? new Date(candidate.submissionDeadline).getTime() < Date.now()
        : false;

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
      try {
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
      } catch (e: any) {
        // Continue if already recorded
      }

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

      let verification: {
        grade: 'A' | 'B' | 'C' | 'D' | 'X';
        isValid: boolean;
        httpStatus?: number | null;
        finalRedirectUrl?: string | null;
        notes: string;
      };

      if (isExpired || isRejected) {
        verification = {
          grade: 'X',
          isValid: false,
          httpStatus: null,
          finalRedirectUrl: null,
          notes: 'URL verification not performed because record was excluded before verification.',
        };
      } else {
        verification = await UrlVerifier.verifyNoticeUrl(candidate.officialNoticeUrl, {
          expectedNoticeId: candidate.noticeId,
          expectedOcid: candidate.ocid,
          expectedTitle: candidate.title,
          expectedBuyer: candidate.buyerName,
          expectedDeadline: candidate.submissionDeadline,
        });
      }

      const buyer = candidate.buyerName
        ? await buyersRepo.getOrCreate(candidate.buyerName, { buyerType: candidate.buyerType })
        : null;

      try {
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
      } catch (saveErr: any) {
        console.error(`[Render Startup] Error saving tender ${candidate.noticeId}:`, saveErr.message);
      }

      if (classification.final.relevance === 'STRONG') strongCount++;
      else if (classification.final.relevance === 'POSSIBLE') possibleCount++;
      else rejectCount++;
    }

    const totalRelevant = strongCount + possibleCount;

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

    console.log(`[Render Startup] Contracts Finder sync complete. Scanned: ${scanResult.noticesChecked}, Relevant: ${totalRelevant}, Saved: ${savedCount}, Health set to HEALTHY`);
  } catch (err: any) {
    console.error('[Render Startup] Contracts Finder sync error (non-fatal):', err.message);
  }
}

main()
  .then(() => {
    console.log('[Render Startup] Sync step finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Render Startup] Unexpected fatal error:', err);
    process.exit(0);
  });
