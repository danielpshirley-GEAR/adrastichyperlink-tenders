// src/app/api/scan/route.ts
import { NextResponse } from 'next/server';
import { FindATenderConnector } from '@/modules/public-tenders/connectors/find-a-tender';
import { TenderClassifier } from '@/modules/public-tenders/services/tender-classifier';
import { UrlVerifier } from '@/modules/public-tenders/services/url-verifier';
import { TendersRepository } from '@/shared/database/repositories/tenders';
import { SourcesRepository } from '@/shared/database/repositories/sources';
import { BuyersRepository } from '@/shared/database/repositories/buyers';
import { RawNoticeRecord } from '@/modules/public-tenders/connectors/types';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const scanType = (body.scanType || 'quick').toLowerCase();

    const fts = new FindATenderConnector();
    const sourceRecord = SourcesRepository.getById('find_a_tender');

    let scanResult;
    if (scanType === 'quick') {
      const sinceDate = sourceRecord?.lastSuccessfulScanAt
        ? new Date(sourceRecord.lastSuccessfulScanAt)
        : new Date(Date.now() - 3 * 86400000);
      scanResult = await fts.scanNewNotices(sinceDate);
    } else if (scanType === 'deep') {
      const liveRes = await fts.scanLiveNotices();
      const pipeRes = await fts.scanPipeline();
      scanResult = {
        sourceId: 'find_a_tender',
        scannedAt: new Date().toISOString(),
        noticesChecked: liveRes.noticesChecked + pipeRes.noticesChecked,
        relevantCandidates: [...liveRes.relevantCandidates, ...pipeRes.relevantCandidates],
        errors: [...liveRes.errors, ...pipeRes.errors],
      };
    } else {
      // 'full'
      scanResult = await fts.scanLiveNotices();
    }

    const noticesChecked = scanResult.noticesChecked;
    const candidates = scanResult.relevantCandidates;

    let strongCount = 0;
    let possibleCount = 0;
    let weakCount = 0;
    let duplicatesCount = 0;
    let failuresCount = 0;
    const savedTenders = [];

    // Deduplicate incoming candidates by noticeId
    const seenIds = new Set<string>();
    const uniqueCandidates: RawNoticeRecord[] = [];
    for (const c of candidates) {
      if (seenIds.has(c.noticeId)) {
        duplicatesCount++;
      } else {
        seenIds.add(c.noticeId);
        uniqueCandidates.push(c);
      }
    }

    // Process each unique candidate
    for (const candidate of uniqueCandidates) {
      try {
        // 1. Record raw notice JSON into database
        SourcesRepository.recordSourceNotice(
          'find_a_tender',
          candidate.noticeId,
          candidate.rawPayload,
          candidate.officialNoticeUrl,
          null,
          candidate.publishedAt,
          candidate.submissionDeadline,
          (candidate.rawPayload as any)?.tag?.[0] || 'tender'
        );

        // 2. Classify candidate
        const classification = await TenderClassifier.classify({
          title: candidate.title,
          buyer: candidate.buyerName,
          description: candidate.description,
          cpvCodes: candidate.cpvCodes,
          valueAmount: candidate.valueAmount,
          noticeType: 'tender',
        });

        if (classification.relevance === 'REJECT') {
          continue;
        }

        // 3. Buyer record
        const buyer = BuyersRepository.getOrCreate(candidate.buyerName, {
          buyerType: candidate.buyerType,
        });

        // 4. Live URL Verification
        const verification = await UrlVerifier.verifyNoticeUrl(candidate.officialNoticeUrl, {
          expectedNoticeId: candidate.noticeId,
          expectedTitle: candidate.title,
          expectedBuyer: candidate.buyerName,
          expectedDeadline: candidate.submissionDeadline,
        });

        // 5. Save canonical tender
        const saved = await TendersRepository.save({
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
          publishedAt: candidate.publishedAt || new Date().toISOString(),
          submissionDeadline: candidate.submissionDeadline || new Date(Date.now() + 14 * 86400000).toISOString(),
          clarificationDeadline: candidate.clarificationDeadline,
          qualification: classification.relevance as any,
          verificationGrade: verification.grade as any,
          officialNoticeUrl: candidate.officialNoticeUrl,
          applicationPortalUrl: candidate.applicationPortalUrl,
          serviceTags: classification.serviceMatches as any,
        });

        // 6. Record source link
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

        savedTenders.push(saved);
      } catch (err: any) {
        failuresCount++;
        console.error(`Error processing notice ${candidate.noticeId}:`, err.message);
      }
    }

    const durationMs = Date.now() - startTime;
    const aiRelevant = strongCount + possibleCount + weakCount;

    // Record scan run
    SourcesRepository.recordScanRun({
      scanType,
      sourceId: 'find_a_tender',
      status: scanResult.errors.length > 0 && noticesChecked === 0 ? 'failed' : 'completed',
      completedAt: new Date().toISOString(),
      noticesChecked,
      initialCandidates: candidates.length,
      aiRelevant,
      strongCount,
      possibleCount,
      weakCount,
      duplicatesCount,
      errorMessage: scanResult.errors[0] || null,
      durationMs,
    });

    // Update source health
    SourcesRepository.updateHealth('find_a_tender', 'healthy', {
      successful: true,
      noticesScannedDelta: noticesChecked,
      relevantFoundDelta: aiRelevant,
    });

    return NextResponse.json({
      status: 'completed',
      scanType,
      source: 'Find a Tender (FTS)',
      noticesChecked,
      initialCandidates: candidates.length,
      duplicatesCount,
      relevantFound: aiRelevant,
      strongCount,
      possibleCount,
      weakCount,
      failuresCount,
      durationMs,
      savedTendersCount: savedTenders.length,
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
