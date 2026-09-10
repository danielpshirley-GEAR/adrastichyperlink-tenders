// src/app/api/scan/route.ts
import { NextResponse } from 'next/server';
import { FindATenderConnector } from '@/modules/public-tenders/connectors/find-a-tender';
import { TenderClassifier } from '@/modules/public-tenders/services/tender-classifier';
import { UrlVerifier } from '@/modules/public-tenders/services/url-verifier';
import { getTendersRepository, getSourcesRepository, getBuyersRepository } from '@/shared/database/db';
import { SourceHealthStatus } from '@/shared/database/repositories/sources';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const tendersRepo = getTendersRepository();
    const sourcesRepo = getSourcesRepository();
    const buyersRepo = getBuyersRepository();

    const body = await req.json().catch(() => ({}));
    const scanType = (body.scanType || 'quick').toLowerCase();
    const maxPages = typeof body.maxPages === 'number' ? body.maxPages : (scanType === 'full' ? 10 : 3);

    const fts = new FindATenderConnector();
    const sourceRecord = await sourcesRepo.getById('find_a_tender');

    let scanResult;
    if (scanType === 'quick') {
      const sinceDate = sourceRecord?.lastSuccessfulScanAt
        ? new Date(sourceRecord.lastSuccessfulScanAt)
        : new Date(Date.now() - 3 * 86400000);
      scanResult = await fts.scanNewNotices(sinceDate, { maxPages });
    } else if (scanType === 'deep') {
      const liveRes = await fts.scanLiveNotices({ maxPages });
      const pipeRes = await fts.scanPipeline({ maxPages });
      scanResult = {
        sourceId: 'find_a_tender',
        scannedAt: new Date().toISOString(),
        noticesChecked: liveRes.noticesChecked + pipeRes.noticesChecked,
        pagesFetched: liveRes.pagesFetched + pipeRes.pagesFetched,
        apiRequestsMade: liveRes.apiRequestsMade + pipeRes.apiRequestsMade,
        rateLimitRetries: liveRes.rateLimitRetries + pipeRes.rateLimitRetries,
        durationMs: liveRes.durationMs + pipeRes.durationMs,
        relevantCandidates: [...liveRes.relevantCandidates, ...pipeRes.relevantCandidates],
        errors: [...liveRes.errors, ...pipeRes.errors],
        paginationComplete: liveRes.paginationComplete && pipeRes.paginationComplete,
        truncatedBySafetyLimit: liveRes.truncatedBySafetyLimit || pipeRes.truncatedBySafetyLimit,
        nextCursorPresent: liveRes.nextCursorPresent || pipeRes.nextCursorPresent,
      };
    } else {
      // 'full'
      scanResult = await fts.scanLiveNotices({ maxPages });
    }

    const rawReleasesFetched = scanResult.noticesChecked;
    const candidates = scanResult.relevantCandidates;

    const uniqueNoticesSet = new Set<string>();
    const uniqueOcidsSet = new Set<string>();

    let expiredNotices = 0;
    let deterministicallyRejected = 0;
    let geminiAnalysed = 0;
    let geminiRequested = 0;
    let geminiSucceeded = 0;
    let geminiFailed = 0;
    let geminiSkippedByDeterministicFilter = 0;

    let strongCount = 0;
    let possibleCount = 0;
    let weakCount = 0;
    let rejectCount = 0;
    let canonicalTendersCreated = 0;
    let canonicalTendersUpdated = 0;
    let duplicatesCount = 0;
    let urlVerificationFailures = 0;
    let processingErrors = 0;

    // Process all candidate releases
    for (const candidate of candidates) {
      try {
        uniqueNoticesSet.add(candidate.noticeId);
        if (candidate.ocid) uniqueOcidsSet.add(candidate.ocid);

        // 1. Record raw notice in database with content hashing & versioning
        const rawRecordResult = await sourcesRepo.recordSourceNotice(
          'find_a_tender',
          candidate.noticeId,
          candidate.rawPayload,
          candidate.officialNoticeUrl,
          null, // linked after tender save
          candidate.publishedAt,
          candidate.submissionDeadline,
          (candidate.rawPayload as any)?.tag?.[0] || 'tender',
          candidate.ocid
        );

        if (rawRecordResult.isDuplicate) {
          duplicatesCount++;
        }

        // 2. Check if deadline is already expired
        const isExpired = candidate.submissionDeadline
          ? new Date(candidate.submissionDeadline).getTime() < Date.now()
          : false;

        if (isExpired) {
          expiredNotices++;
        }

        // 3. Classify candidate with distinct deterministic and Gemini evaluation
        const classification = await TenderClassifier.classify({
          title: candidate.title,
          buyer: candidate.buyerName,
          description: candidate.description,
          cpvCodes: candidate.cpvCodes,
          valueAmount: candidate.valueAmount,
          submissionDeadline: candidate.submissionDeadline || undefined,
          noticeType: 'tender',
        });

        if (classification.deterministic.relevance === 'REJECT') {
          geminiSkippedByDeterministicFilter++;
          rejectCount++;
          deterministicallyRejected++;
          continue;
        }

        if (classification.ai.status === 'RUN') {
          geminiRequested++;
          geminiSucceeded++;
          geminiAnalysed++;
        } else if (classification.ai.status === 'FAILED') {
          geminiRequested++;
          geminiFailed++;
        }

        // 4. Record buyer
        const buyer = await buyersRepo.getOrCreate(candidate.buyerName, {
          buyerType: candidate.buyerType,
        });

        // 5. Live URL verification with strict Grade A criteria
        const verification = await UrlVerifier.verifyNoticeUrl(candidate.officialNoticeUrl, {
          expectedNoticeId: candidate.noticeId,
          expectedOcid: candidate.ocid,
          expectedTitle: candidate.title,
          expectedBuyer: candidate.buyerName,
          expectedDeadline: candidate.submissionDeadline,
        });

        if (verification.grade === 'X' || !verification.isValid) {
          urlVerificationFailures++;
        }

        // 6. Check existing canonical tender for deduplication (by OCID first, then notice ID)
        let existingTender = null;
        if (candidate.ocid) {
          existingTender = await tendersRepo.getByOcid(candidate.ocid);
        }
        if (!existingTender) {
          existingTender = await tendersRepo.getByCanonicalReference(candidate.noticeId);
        }

        const isNewTender = !existingTender;

        // 7. Save canonical tender with separated classification results
        const saved = await tendersRepo.save({
          id: existingTender?.id,
          canonicalReference: candidate.noticeId,
          ocid: candidate.ocid,
          title: candidate.title,
          plainEnglishSummary: classification.final.reason || candidate.description?.slice(0, 300),
          buyerName: buyer.name,
          buyerId: buyer.id,
          valueAmount: candidate.valueAmount,
          valueCurrency: candidate.valueCurrency || 'GBP',
          valueDescription: candidate.valueAmount
            ? `£${candidate.valueAmount.toLocaleString()} ${candidate.valueCurrency || 'GBP'}`
            : undefined,
          publishedAt: candidate.publishedAt || null,
          submissionDeadline: candidate.submissionDeadline || null,
          clarificationDeadline: candidate.clarificationDeadline || null,
          qualification: classification.final.relevance as any,
          deterministicResult: classification.deterministic.relevance as any,
          aiResult: classification.ai.status === 'RUN' ? (classification.ai.relevance as any) : classification.ai.status,
          finalQualification: classification.final.relevance as any,
          lifecycleStatus: isExpired ? 'EXPIRED' : 'ACTIVE',
          verificationGrade: verification.grade,
          officialNoticeUrl: candidate.officialNoticeUrl,
          applicationPortalUrl: candidate.applicationPortalUrl,
          serviceTags: classification.final.serviceMatches as any,
          isArchived: isExpired,
        });

        if (isNewTender) {
          canonicalTendersCreated++;
        } else {
          canonicalTendersUpdated++;
        }

        // 8. Link raw source notice to canonical tender (source-scoped)
        await sourcesRepo.linkSourceNoticesToTender('find_a_tender', saved.id, candidate.noticeId, candidate.ocid);

        // 9. Record link verification
        await sourcesRepo.recordSourceLink(
          saved.id,
          'find_a_tender',
          candidate.officialNoticeUrl,
          'official_notice',
          verification.grade,
          verification.httpStatus || null,
          verification.finalRedirectUrl || null,
          verification.notes
        );

        if (classification.final.relevance === 'STRONG') strongCount++;
        else if (classification.final.relevance === 'POSSIBLE') possibleCount++;
        else weakCount++;
      } catch (err: any) {
        processingErrors++;
        console.error(`[Scan] Error processing notice ${candidate.noticeId}:`, err.message);
      }
    }

    const durationMs = Date.now() - startTime;
    const relevantFound = strongCount + possibleCount + weakCount;

    // Determine truthful health status
    let healthStatus: SourceHealthStatus = 'healthy';
    let errorMessage: string | null = null;

    if (scanResult.errors.length > 0 && rawReleasesFetched === 0) {
      healthStatus = 'error';
      errorMessage = scanResult.errors[0];
    } else if (scanResult.errors.length > 0 || processingErrors > 0 || urlVerificationFailures > (relevantFound * 0.5)) {
      healthStatus = 'degraded';
      errorMessage = scanResult.errors[0] || `${processingErrors} processing errors encountered`;
    }

    const isScanSuccessful = healthStatus === 'healthy' || (healthStatus === 'degraded' && rawReleasesFetched > 0);

    // Record scan run
    await sourcesRepo.recordScanRun({
      scanType,
      sourceId: 'find_a_tender',
      status: healthStatus === 'error' ? 'failed' : 'completed',
      completedAt: new Date().toISOString(),
      noticesChecked: rawReleasesFetched,
      initialCandidates: candidates.length,
      aiRelevant: relevantFound,
      strongCount,
      possibleCount,
      weakCount,
      duplicatesCount,
      errorMessage,
      durationMs,
    });

    // Update source health truthfully
    await sourcesRepo.updateHealth('find_a_tender', healthStatus, {
      successful: isScanSuccessful,
      lastScanError: errorMessage,
      noticesScannedDelta: rawReleasesFetched,
      relevantFoundDelta: relevantFound,
    });

    const isTruncated = Boolean(scanResult.truncatedBySafetyLimit);

    return NextResponse.json({
      status: 'completed',
      message: isTruncated ? 'SCAN PARTIAL — SAFETY LIMIT REACHED' : 'Scan Completed Successfully',
      scanType,
      source: 'Find a Tender (FTS)',
      sourceHealth: healthStatus,
      pagesFetched: scanResult.pagesFetched,
      rawReleasesFetched,
      uniqueNotices: uniqueNoticesSet.size,
      uniqueOcids: uniqueOcidsSet.size,
      expiredNotices,
      deterministicallyRejected,
      geminiAnalysed,
      geminiMetrics: {
        requested: geminiRequested,
        succeeded: geminiSucceeded,
        failed: geminiFailed,
        skippedByDeterministicFilter: geminiSkippedByDeterministicFilter,
      },
      pagination: {
        paginationComplete: scanResult.paginationComplete ?? !isTruncated,
        truncatedBySafetyLimit: isTruncated,
        nextCursorPresent: scanResult.nextCursorPresent ?? false,
      },
      strongCount,
      possibleCount,
      weakCount,
      rejectCount,
      canonicalTendersCreated,
      canonicalTendersUpdated,
      duplicatesCount,
      urlVerificationFailures,
      processingErrors,
      durationMs,
      apiRequestsMade: scanResult.apiRequestsMade,
      rateLimitRetries: scanResult.rateLimitRetries,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Scan API fatal error:', error);
    return NextResponse.json(
      {
        error: 'Scan execution error',
        message: error.message,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
