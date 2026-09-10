// src/app/api/scan/route.ts
import { NextResponse } from 'next/server';
import { FindATenderConnector } from '@/modules/public-tenders/connectors/find-a-tender';
import { TenderClassifier } from '@/modules/public-tenders/services/tender-classifier';
import { UrlVerifier } from '@/modules/public-tenders/services/url-verifier';
import { TendersRepository } from '@/shared/database/repositories/tenders';
import { SourcesRepository, SourceHealthStatus } from '@/shared/database/repositories/sources';
import { BuyersRepository } from '@/shared/database/repositories/buyers';
import { GeminiClient } from '@/shared/ai/gemini-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const scanType = (body.scanType || 'quick').toLowerCase();
    const maxPages = typeof body.maxPages === 'number' ? body.maxPages : (scanType === 'full' ? 10 : 3);

    const fts = new FindATenderConnector();
    const sourceRecord = SourcesRepository.getById('find_a_tender');

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
    let strongCount = 0;
    let possibleCount = 0;
    let weakCount = 0;
    let rejectCount = 0;
    let canonicalTendersCreated = 0;
    let canonicalTendersUpdated = 0;
    let duplicatesCount = 0;
    let urlVerificationFailures = 0;
    let processingErrors = 0;

    const isGeminiAvailable = GeminiClient.isConfigured();

    // Process all candidate releases
    for (const candidate of candidates) {
      try {
        uniqueNoticesSet.add(candidate.noticeId);
        if (candidate.ocid) uniqueOcidsSet.add(candidate.ocid);

        // 1. Record raw notice in database with content hashing & versioning
        const rawRecordResult = SourcesRepository.recordSourceNotice(
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

        // 3. Classify candidate
        const classification = await TenderClassifier.classify({
          title: candidate.title,
          buyer: candidate.buyerName,
          description: candidate.description,
          cpvCodes: candidate.cpvCodes,
          valueAmount: candidate.valueAmount,
          submissionDeadline: candidate.submissionDeadline || undefined,
          noticeType: 'tender',
        });

        if (isGeminiAvailable) {
          geminiAnalysed++;
        }

        if (classification.relevance === 'REJECT') {
          rejectCount++;
          deterministicallyRejected++;
          continue;
        }

        // 4. Record buyer
        const buyer = BuyersRepository.getOrCreate(candidate.buyerName, {
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
          existingTender = await TendersRepository.getByOcid(candidate.ocid);
        }
        if (!existingTender) {
          existingTender = await TendersRepository.getByCanonicalReference(candidate.noticeId);
        }

        const isNewTender = !existingTender;

        // 7. Save canonical tender
        const saved = await TendersRepository.save({
          id: existingTender?.id,
          canonicalReference: candidate.noticeId,
          ocid: candidate.ocid,
          title: candidate.title,
          plainEnglishSummary: classification.reason || candidate.description?.slice(0, 300),
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
          qualification: classification.relevance as any,
          deterministicResult: classification.relevance as any,
          aiResult: isGeminiAvailable ? (classification.relevance as any) : 'NOT_RUN',
          finalQualification: classification.relevance as any,
          lifecycleStatus: isExpired ? 'EXPIRED' : 'ACTIVE',
          verificationGrade: verification.grade,
          officialNoticeUrl: candidate.officialNoticeUrl,
          applicationPortalUrl: candidate.applicationPortalUrl,
          serviceTags: classification.serviceMatches as any,
          isArchived: isExpired,
        });

        if (isNewTender) {
          canonicalTendersCreated++;
        } else {
          canonicalTendersUpdated++;
        }

        // 8. Link raw source notice to the canonical tender
        SourcesRepository.linkSourceNoticesToTender(saved.id, candidate.noticeId, candidate.ocid);

        // 9. Record link verification
        SourcesRepository.recordSourceLink(
          saved.id,
          'find_a_tender',
          candidate.officialNoticeUrl,
          'official_notice',
          verification.grade,
          verification.httpStatus || null,
          verification.finalRedirectUrl || null,
          verification.notes
        );

        if (classification.relevance === 'STRONG') strongCount++;
        else if (classification.relevance === 'POSSIBLE') possibleCount++;
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
    SourcesRepository.recordScanRun({
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
    SourcesRepository.updateHealth('find_a_tender', healthStatus, {
      successful: isScanSuccessful,
      lastScanError: errorMessage,
      noticesScannedDelta: rawReleasesFetched,
      relevantFoundDelta: relevantFound,
    });

    return NextResponse.json({
      status: 'completed',
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
