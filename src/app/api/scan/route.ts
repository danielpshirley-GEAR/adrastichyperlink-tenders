import { NextResponse } from 'next/server';
import { FindATenderConnector, formatOfficialNoticeUrl, assertValidNoticeUrl } from '@/modules/public-tenders/connectors/find-a-tender';
import { TenderClassifier } from '@/modules/public-tenders/services/tender-classifier';
import { DeterministicFilter } from '@/modules/public-tenders/services/deterministic-filter';
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
    const stage = (body.stage || 'tender').toLowerCase();
    const cursorUrl = body.cursorUrl || null;
    const maxPages = typeof body.maxPages === 'number' ? body.maxPages : (scanType === 'full' ? 10 : (scanType === 'paged' ? 1 : 3));

    const fts = new FindATenderConnector();
    const sourceRecord = await sourcesRepo.getById('find_a_tender');

    const limit = typeof body.limit === 'number' ? body.limit : 25;

    let scanResult;
    if (scanType === 'paged' || cursorUrl) {
      if (stage === 'planning') {
        scanResult = await fts.scanPipeline({ maxPages, cursorUrl, limit });
      } else {
        scanResult = await fts.scanLiveNotices({ maxPages, cursorUrl, limit });
      }
    } else if (scanType === 'quick') {
      const sinceDate = sourceRecord?.lastSuccessfulScanAt
        ? new Date(sourceRecord.lastSuccessfulScanAt)
        : new Date(Date.now() - 3 * 86400000);
      scanResult = await fts.scanNewNotices(sinceDate, { maxPages, limit });
    } else if (scanType === 'deep') {
      const liveRes = await fts.scanLiveNotices({ maxPages, limit });
      const pipeRes = await fts.scanPipeline({ maxPages, limit });
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
        nextCursorUrl: liveRes.nextCursorUrl || pipeRes.nextCursorUrl,
        earliestDate: pipeRes.earliestDate && liveRes.earliestDate ? (pipeRes.earliestDate < liveRes.earliestDate ? pipeRes.earliestDate : liveRes.earliestDate) : (liveRes.earliestDate || pipeRes.earliestDate),
        latestDate: pipeRes.latestDate && liveRes.latestDate ? (pipeRes.latestDate > liveRes.latestDate ? pipeRes.latestDate : liveRes.latestDate) : (liveRes.latestDate || pipeRes.latestDate),
      };
    } else {
      // 'full'
      scanResult = await fts.scanLiveNotices({ maxPages, limit });
    }

    const rawReleasesFetched = scanResult.noticesChecked;
    const candidates = scanResult.relevantCandidates;

    const uniqueNoticesSet = new Set<string>();
    const uniqueOcidsSet = new Set<string>();

    let expiredNotices = 0;
    let pipelineNotices = 0;
    let deterministicallyRejected = 0;
    let deterministicCandidates = 0;
    let geminiQueued = 0;
    let geminiCompleted = 0;
    let geminiSkipped = 0;
    let geminiFailed = 0;

    let strongCount = 0;
    let possibleCount = 0;
    const weakCount = 0;
    let rejectCount = 0;
    let canonicalTendersCreated = 0;
    let canonicalTendersUpdated = 0;
    let duplicatesCount = 0;
    let urlVerificationFailures = 0;
    let processingErrors = 0;

    const candidatesProcessed: any[] = [];

    // Process all candidate releases
    for (const candidate of candidates) {
      try {
        uniqueNoticesSet.add(candidate.noticeId);
        if (candidate.ocid) uniqueOcidsSet.add(candidate.ocid);

        const noticeTag = (candidate.rawPayload as any)?.tag?.[0] || (stage === 'planning' ? 'planning' : 'tender');
        const isPlanningNotice = stage === 'planning' || noticeTag === 'planning';
        if (isPlanningNotice) {
          pipelineNotices++;
        }

        // 1. Fast in-memory deterministic filter
        const deterministic = DeterministicFilter.evaluate({
          title: candidate.title,
          description: candidate.description,
          cpvCodes: candidate.cpvCodes,
          submissionDeadline: candidate.submissionDeadline,
          noticeType: isPlanningNotice ? 'planning' : 'tender',
        });

        // If not a creative match, skip database writes and LLM calls
        if (deterministic.isNegativeMatch || (deterministic.qualification === 'REJECT' && !deterministic.isExpired)) {
          deterministicallyRejected++;
          rejectCount++;
          continue;
        }

        deterministicCandidates++;

        // 2. Check if deadline is already expired
        const isExpired = candidate.submissionDeadline
          ? new Date(candidate.submissionDeadline).getTime() < Date.now()
          : false;

        if (isExpired) {
          expiredNotices++;
        }

        const cleanOfficialUrl = formatOfficialNoticeUrl(candidate.noticeId, candidate.officialNoticeUrl);

        // 3. Record raw notice in database with content hashing & versioning for all genuine candidates
        const rawRecordResult = await sourcesRepo.recordSourceNotice(
          'find_a_tender',
          candidate.noticeId,
          candidate.rawPayload,
          cleanOfficialUrl,
          null, // linked after tender save
          candidate.publishedAt,
          candidate.submissionDeadline,
          noticeTag,
          candidate.ocid
        );

        if (rawRecordResult.isDuplicate) {
          duplicatesCount++;
        }

        // 4. Classify candidate with distinct deterministic and Gemini evaluation
        let classification: any;
        let geminiRun = false;

        if (isExpired) {
          geminiSkipped++;
          classification = {
            deterministic: {
              relevance: deterministic.qualification,
              matchedKeywords: deterministic.matchedKeywords,
              score: deterministic.score,
              isExpired: true,
            },
            ai: {
              status: 'NOT_RUN' as const,
              serviceMatches: deterministic.matchedKeywords,
            },
            final: {
              relevance: 'REJECT' as const,
              reason: `Tender submission deadline has passed (Expired: ${candidate.submissionDeadline}). Skipped Gemini evaluation.`,
              serviceMatches: deterministic.matchedKeywords,
              reasonFinalQualificationWasChosen: `Tender submission deadline expired on ${candidate.submissionDeadline}; excluded from active bidding.`,
            },
          };
        } else {
          geminiQueued++;
          classification = await TenderClassifier.classify({
            title: candidate.title,
            buyer: candidate.buyerName,
            description: candidate.description,
            cpvCodes: candidate.cpvCodes,
            valueAmount: candidate.valueAmount,
            submissionDeadline: candidate.submissionDeadline || undefined,
            noticeType: isPlanningNotice ? 'planning' : 'tender',
          });

          if (classification.ai.status === 'RUN') {
            geminiRun = true;
            geminiCompleted++;
          } else {
            geminiFailed++;
          }
        }

        // 5. Record buyer
        const buyer = candidate.buyerName
          ? await buyersRepo.getOrCreate(candidate.buyerName, {
              buyerType: candidate.buyerType,
            })
          : null;

        const isRejected = classification.final.relevance === 'REJECT';
        const lifecycleStatus = isExpired ? 'EXPIRED' : (isRejected ? 'REJECTED' : 'ACTIVE');
        const isArchived = isExpired || isRejected;
        const archivedReason = isExpired ? 'EXPIRED' : (isRejected ? 'AI_REJECTED' : null);

        // 6. Live URL verification with strict Grade A criteria (only probe active actionable candidates)
        const verification = (isExpired || isRejected)
          ? {
              grade: 'A' as const,
              isValid: true,
              notes: isExpired ? 'Expired notice' : 'Candidate classified as rejected',
              httpStatus: 200,
              finalRedirectUrl: cleanOfficialUrl,
            }
          : await UrlVerifier.verifyNoticeUrl(cleanOfficialUrl, {
              expectedNoticeId: candidate.noticeId,
              expectedOcid: candidate.ocid,
              expectedTitle: candidate.title,
              expectedBuyer: candidate.buyerName,
              expectedDeadline: candidate.submissionDeadline,
            });

        if (verification.grade === 'X' || !verification.isValid) {
          urlVerificationFailures++;
        }

        // 7. Check existing canonical tender for deduplication (by OCID first, then notice ID)
        let existingTender = null;
        if (candidate.ocid) {
          existingTender = await tendersRepo.getByOcid(candidate.ocid);
        }
        if (!existingTender) {
          existingTender = await tendersRepo.getByCanonicalReference(candidate.noticeId);
        }

        const isNewTender = !existingTender;

        // 8. Save canonical tender with separated classification results
        const saved = await tendersRepo.save({
          id: existingTender?.id,
          canonicalReference: candidate.noticeId,
          ocid: candidate.ocid,
          title: candidate.title,
          plainEnglishSummary: classification.final.reasonFinalQualificationWasChosen || classification.final.reason || candidate.description?.slice(0, 300),
          buyerName: buyer?.name || candidate.buyerName || null,
          buyerId: buyer?.id || null,
          valueAmount: candidate.valueAmount,
          valueCurrency: candidate.valueCurrency || null,
          valueDescription: candidate.valueAmount
            ? `£${candidate.valueAmount.toLocaleString()} ${candidate.valueCurrency || ''}`.trim()
            : undefined,
          publishedAt: candidate.publishedAt || null,
          submissionDeadline: candidate.submissionDeadline || null,
          clarificationDeadline: candidate.clarificationDeadline || null,
          qualification: isRejected ? 'REJECT' : (classification.final.relevance as any),
          deterministicResult: classification.deterministic.relevance as any,
          aiResult: classification.ai.status === 'RUN' ? (classification.ai.relevance as any) : classification.ai.status,
          finalQualification: isRejected ? 'REJECT' : (classification.final.relevance as any),
          lifecycleStatus,
          verificationGrade: verification.grade,
          officialNoticeUrl: cleanOfficialUrl,
          applicationPortalUrl: candidate.applicationPortalUrl,
          serviceTags: classification.final.serviceMatches as any,
          isArchived,
          archivedReason,
          evaluationCriteria: classification.final.analysis ? [{
            primaryPurpose: classification.final.primaryPurpose,
            geminiRun,
            reasonFinalQualificationWasChosen: classification.final.reasonFinalQualificationWasChosen,
            ...classification.final.analysis,
          }] : [],
          geminiAnalysis: classification.final.analysis,
        });

        if (isNewTender) {
          canonicalTendersCreated++;
        } else {
          canonicalTendersUpdated++;
        }

        // 9. Link raw source notice to canonical tender (source-scoped)
        await sourcesRepo.linkSourceNoticesToTender('find_a_tender', saved.id, candidate.noticeId, candidate.ocid);

        // 10. Record link verification
        await sourcesRepo.recordSourceLink(
          saved.id,
          'find_a_tender',
          cleanOfficialUrl,
          'official_notice',
          verification.grade,
          verification.httpStatus || null,
          verification.finalRedirectUrl || null,
          verification.notes
        );

        if (classification.final.relevance === 'STRONG') strongCount++;
        else if (classification.final.relevance === 'POSSIBLE') possibleCount++;
        else rejectCount++;

        candidatesProcessed.push({
          noticeId: candidate.noticeId,
          ocid: candidate.ocid,
          title: candidate.title,
          buyer: buyer?.name || candidate.buyerName,
          valueAmount: candidate.valueAmount,
          valueDescription: saved.valueDescription,
          publishedAt: candidate.publishedAt,
          submissionDeadline: candidate.submissionDeadline,
          deterministicResult: classification.deterministic.relevance,
          geminiRun,
          aiResult: classification.ai.status === 'RUN' ? classification.ai.relevance : classification.ai.status,
          finalQualification: classification.final.relevance,
          primaryPurpose: classification.final.primaryPurpose,
          recommendation: classification.final.recommendation || 'WATCH',
          reason: classification.final.reason,
          reasonFinalQualificationWasChosen: classification.final.reasonFinalQualificationWasChosen,
          officialNoticeUrl: cleanOfficialUrl,
          isExpired,
          isPlanningNotice,
          lifecycleStatus,
          isArchived,
          verificationGrade: verification.grade,
          analysis: classification.final.analysis,
        });
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
    let finalScanStatus: 'COMPLETED' | 'PARTIAL' | 'DEGRADED' | 'FAILED' = 'COMPLETED';
    let statusMessage = 'Scan Completed Successfully';

    if (healthStatus === 'error' || processingErrors > 0) {
      finalScanStatus = 'FAILED';
      statusMessage = errorMessage || 'Scan Failed — Errors encountered during ingestion';
    } else if (healthStatus === 'degraded' || urlVerificationFailures > 0) {
      finalScanStatus = 'DEGRADED';
      statusMessage = errorMessage || 'Scan Degraded — Warnings or verification problems encountered';
    } else if (isTruncated) {
      finalScanStatus = 'PARTIAL';
      statusMessage = 'SCAN PARTIAL — SAFETY LIMIT REACHED';
    }

    return NextResponse.json({
      status: finalScanStatus,
      message: statusMessage,
      scanType,
      stage,
      source: 'Find a Tender (FTS)',
      sourceHealth: healthStatus,
      pagesFetched: scanResult.pagesFetched,
      rawReleasesFetched,
      uniqueNotices: uniqueNoticesSet.size,
      uniqueOcids: uniqueOcidsSet.size,
      expiredNotices,
      pipelineNotices,
      deterministicallyRejected,
      deterministicCandidates,
      geminiQueued,
      geminiCompleted,
      geminiSkipped,
      geminiFailed,
      geminiAnalysed: geminiCompleted,
      geminiMetrics: {
        queued: geminiQueued,
        completed: geminiCompleted,
        skipped: geminiSkipped,
        failed: geminiFailed,
      },
      pagination: {
        paginationComplete: scanResult.paginationComplete ?? !isTruncated,
        truncatedBySafetyLimit: isTruncated,
        nextCursorPresent: scanResult.nextCursorPresent ?? false,
        nextCursorUrl: scanResult.nextCursorUrl || null,
        earliestDate: scanResult.earliestDate || null,
        latestDate: scanResult.latestDate || null,
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
      candidatesProcessed,
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
