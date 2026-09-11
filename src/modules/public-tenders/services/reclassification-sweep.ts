// src/modules/public-tenders/services/reclassification-sweep.ts
import { getTendersRepository, getSourcesRepository } from '@/shared/database/db';
import { DeterministicFilter } from './deterministic-filter';
import { TenderClassifier } from './tender-classifier';
import { formatOfficialNoticeUrl, FindATenderConnector } from '../connectors/find-a-tender';

export interface ReclassifiedNoticeAudit {
  noticeId: string;
  title: string | null;
  buyer: string | null;
  priorQualification: string;
  priorLifecycleStatus: string;
  priorIsArchived: boolean;
  priorAiResult?: string;
  newQualification: string;
  newLifecycleStatus: string;
  newIsArchived: boolean;
  newAiResult?: string;
  primaryPurpose?: string;
  recommendation?: string;
  aiReviewStatus?: string;
  changed: boolean;
  reason: string;
  geminiRetried: boolean;
  geminiRetrySuccess?: boolean;
  failureReason?: string;
  officialNoticeUrl: string;
}

export interface ReclassificationSweepResult {
  totalInspected: number;
  totalChanged: number;
  reclassifiedToReject: number;
  retainedActive: number;
  geminiRetriesAttempted: number;
  geminiRetriesSucceeded: number;
  geminiRetriesFailed: number;
  failureReasons: Record<string, number>;
  activeAllCount: number;
  archivedCount: number;
  records: ReclassifiedNoticeAudit[];
}

export class ReclassificationSweep {
  /**
   * Safe reclassification sweep for existing database records.
   * 1. Re-evaluates active tenders against the current deterministic filter.
   * 2. Retries Gemini with bounded backoff for candidates with aiResult = FAILED.
   * 3. Updates canonical tender records in Supabase/SQLite while preserving raw notices and audit history.
   */
  static async execute(): Promise<ReclassificationSweepResult> {
    const tendersRepo = getTendersRepository();
    const sourcesRepo = getSourcesRepository();

    // 1. Fetch all currently active tenders in the ALL inbox
    const activeTenders = await tendersRepo.getAll('ALL');

    // Also include key audited notices to ensure comprehensive evaluation
    const auditIds = ['066480-2026', '067718-2026', '068074-2026', '081520-2026'];
    const inspectedMap = new Map<string, any>();

    for (const t of activeTenders) {
      inspectedMap.set(t.canonicalReference, t);
      if (t.latestNoticeId) inspectedMap.set(t.latestNoticeId, t);
    }

    for (const id of auditIds) {
      if (!inspectedMap.has(id)) {
        const found = await tendersRepo.getByCanonicalReference(id);
        if (found) {
          inspectedMap.set(id, found);
        }
      }
    }

    const tendersToEvaluate = Array.from(new Set(Array.from(inspectedMap.values())));

    let totalChanged = 0;
    let reclassifiedToReject = 0;
    let geminiRetriesAttempted = 0;
    let geminiRetriesSucceeded = 0;
    let geminiRetriesFailed = 0;
    const failureReasons: Record<string, number> = {};
    const auditRecords: ReclassifiedNoticeAudit[] = [];

    for (const tender of tendersToEvaluate) {
      const noticeId = tender.latestNoticeId || tender.canonicalReference;
      const priorQualification = tender.qualification;
      const priorLifecycleStatus = tender.lifecycleStatus || 'ACTIVE';
      const priorIsArchived = tender.isArchived;
      const priorAiResult = tender.aiResult;

      // Load saved source notice if available, or fetch complete release via connector
      let rawNotice: any = null;
      try {
        rawNotice = await sourcesRepo.getSourceNotice('find_a_tender', noticeId);
      } catch {
        // Fall back to tender record data
      }

      let description =
        rawNotice?.raw_notice_json?.tender?.description ||
        rawNotice?.raw_notice_json?.description ||
        tender.description ||
        '';

      let cpvCodes: string[] = [];
      if (rawNotice?.raw_notice_json) {
        const ocds = rawNotice.raw_notice_json;
        if (ocds.tender?.classification?.id) cpvCodes.push(ocds.tender.classification.id);
        if (Array.isArray(ocds.tender?.items)) {
          for (const it of ocds.tender.items) {
            if (it.classification?.id && !cpvCodes.includes(it.classification.id)) cpvCodes.push(it.classification.id);
          }
        }
      }

      // If description or CPVs are missing from database payload, fetch complete notice via FindATenderConnector
      if (!description || description.length < 50 || cpvCodes.length === 0) {
        try {
          const connector = new FindATenderConnector();
          const fetched = await connector.fetchNotice(noticeId);
          if (fetched) {
            description = fetched.description || description;
            cpvCodes = fetched.cpvCodes?.length ? fetched.cpvCodes : cpvCodes;
          }
        } catch {
          description = description || tender.plainEnglishSummary || tender.title || '';
        }
      }

      // Run current deterministic filter
      const deterministic = DeterministicFilter.evaluate({
        title: tender.title,
        description,
        cpvCodes,
        submissionDeadline: tender.submissionDeadline,
      });

      const cleanOfficialUrl = formatOfficialNoticeUrl(noticeId, tender.officialNoticeUrl);

      // Check if deterministic filter rejects (e.g. Highland Council 066480-2026)
      if (deterministic.isNegativeMatch || (deterministic.qualification === 'REJECT' && !deterministic.isExpired)) {
        const newQualification = 'REJECT';
        const newLifecycleStatus = 'REJECTED';
        const newIsArchived = true;
        const archivedReason = 'RULE_RECLASSIFIED';
        const changeReason = deterministic.rejectedReason || 'Reclassified as REJECT via current deterministic negative filters.';
        const primaryPurpose =
          deterministic.rejectedReason?.toLowerCase().includes('property maintenance') ||
          tender.title?.toLowerCase().includes('maintenance') ||
          tender.title?.toLowerCase().includes('housing')
            ? 'CONSTRUCTION'
            : 'OTHER';

        await tendersRepo.save({
          id: tender.id,
          canonicalReference: tender.canonicalReference,
          latestNoticeId: tender.latestNoticeId || tender.canonicalReference,
          ocid: tender.ocid,
          title: tender.title,
          buyerName: tender.buyerName,
          buyerId: tender.buyerId,
          valueAmount: tender.valueAmount,
          valueCurrency: tender.valueCurrency,
          valueDescription: tender.valueDescription,
          publishedAt: tender.publishedAt,
          submissionDeadline: tender.submissionDeadline,
          qualification: newQualification as any,
          deterministicResult: 'REJECT' as any,
          finalQualification: newQualification as any,
          lifecycleStatus: newLifecycleStatus as any,
          isArchived: newIsArchived,
          archivedReason,
          officialNoticeUrl: cleanOfficialUrl,
          plainEnglishSummary: changeReason,
          serviceTags: tender.serviceTags,
        } as any);

        totalChanged++;
        reclassifiedToReject++;

        auditRecords.push({
          noticeId,
          title: tender.title,
          buyer: tender.buyerName,
          priorQualification,
          priorLifecycleStatus,
          priorIsArchived,
          priorAiResult,
          newQualification,
          newLifecycleStatus,
          newIsArchived,
          newAiResult: priorAiResult,
          primaryPurpose,
          recommendation: 'PASS',
          aiReviewStatus: 'SKIPPED',
          changed: true,
          reason: changeReason,
          geminiRetried: false,
          officialNoticeUrl: cleanOfficialUrl,
        });

        continue;
      }

      // Candidate passed deterministic filter. Check if Gemini retry is required
      const shouldRetryGemini =
        tender.aiResult === 'FAILED' ||
        !tender.geminiAnalysis ||
        tender.aiResult === 'NOT_RUN' ||
        tender.aiResult === 'UNAVAILABLE' ||
        noticeId === '067718-2026';

      if (shouldRetryGemini) {
        geminiRetriesAttempted++;

        const classification = await TenderClassifier.classify({
          title: tender.title,
          buyer: tender.buyerName,
          description,
          cpvCodes,
          submissionDeadline: tender.submissionDeadline,
          valueAmount: tender.valueAmount,
        });

        const isGeminiSuccess = classification.ai.status === 'RUN';
        let geminiFailureReason: string | undefined;

        if (isGeminiSuccess) {
          geminiRetriesSucceeded++;

          const isRejected = classification.final.relevance === 'REJECT';
          const newQualification = isRejected ? 'REJECT' : classification.final.relevance;
          const newLifecycleStatus = isRejected ? 'REJECTED' : 'ACTIVE';
          const newIsArchived = isRejected;
          const archivedReason = isRejected ? 'AI_REJECTED' : null;

          await tendersRepo.save({
            id: tender.id,
            canonicalReference: tender.canonicalReference,
            latestNoticeId: tender.latestNoticeId || tender.canonicalReference,
            ocid: tender.ocid,
            title: tender.title,
            buyerName: tender.buyerName,
            buyerId: tender.buyerId,
            valueAmount: tender.valueAmount,
            valueCurrency: tender.valueCurrency,
            valueDescription: tender.valueDescription,
            publishedAt: tender.publishedAt,
            submissionDeadline: tender.submissionDeadline,
            qualification: newQualification as any,
            deterministicResult: classification.deterministic.relevance as any,
            aiResult: classification.ai.relevance as any,
            aiReviewStatus: 'COMPLETED',
            primaryPurpose: classification.final.primaryPurpose,
            recommendation: classification.final.recommendation || 'WATCH',
            finalQualification: newQualification as any,
            lifecycleStatus: newLifecycleStatus as any,
            isArchived: newIsArchived,
            archivedReason: archivedReason as any,
            officialNoticeUrl: cleanOfficialUrl,
            plainEnglishSummary: classification.final.reasonFinalQualificationWasChosen || classification.final.reason,
            serviceTags: classification.final.serviceMatches as any,
            geminiAnalysis: classification.final.analysis,
          } as any);

          if (isRejected) reclassifiedToReject++;
          totalChanged++;

          auditRecords.push({
            noticeId,
            title: tender.title,
            buyer: tender.buyerName,
            priorQualification,
            priorLifecycleStatus,
            priorIsArchived,
            priorAiResult,
            newQualification,
            newLifecycleStatus,
            newIsArchived,
            newAiResult: classification.ai.relevance,
            primaryPurpose: classification.final.primaryPurpose,
            recommendation: classification.final.recommendation || 'WATCH',
            aiReviewStatus: 'COMPLETED',
            changed: true,
            reason: classification.final.reasonFinalQualificationWasChosen || classification.final.reason,
            geminiRetried: true,
            geminiRetrySuccess: true,
            officialNoticeUrl: cleanOfficialUrl,
          });
        } else {
          // Gemini failed after bounded retry
          geminiRetriesFailed++;
          const category = classification.ai.failureCategory || 'UNKNOWN';
          failureReasons[category] = (failureReasons[category] || 0) + 1;
          geminiFailureReason = `${category}: ${classification.ai.reason || 'Gemini call failed'}`;

          await tendersRepo.save({
            id: tender.id,
            canonicalReference: tender.canonicalReference,
            latestNoticeId: tender.latestNoticeId || tender.canonicalReference,
            ocid: tender.ocid,
            title: tender.title,
            buyerName: tender.buyerName,
            buyerId: tender.buyerId,
            valueAmount: tender.valueAmount,
            valueCurrency: tender.valueCurrency,
            valueDescription: tender.valueDescription,
            publishedAt: tender.publishedAt,
            submissionDeadline: tender.submissionDeadline,
            qualification: 'POSSIBLE',
            deterministicResult: 'POSSIBLE',
            aiResult: 'FAILED' as any,
            aiReviewStatus: 'REQUIRED',
            recommendation: 'REVIEW',
            finalQualification: 'POSSIBLE',
            lifecycleStatus: 'ACTIVE',
            isArchived: false,
            officialNoticeUrl: cleanOfficialUrl,
            plainEnglishSummary: `AI REVIEW INCOMPLETE (${category}). Retained via deterministic filter for manual review with recommendation REVIEW.`,
            serviceTags: tender.serviceTags,
          } as any);

          auditRecords.push({
            noticeId,
            title: tender.title,
            buyer: tender.buyerName,
            priorQualification,
            priorLifecycleStatus,
            priorIsArchived,
            priorAiResult,
            newQualification: 'POSSIBLE',
            newLifecycleStatus: 'ACTIVE',
            newIsArchived: false,
            newAiResult: 'FAILED',
            primaryPurpose: classification.final.primaryPurpose || 'CONSULTANCY_WITH_CREATIVE_OVERLAP',
            recommendation: 'REVIEW',
            aiReviewStatus: 'REQUIRED',
            changed: true,
            reason: `AI REVIEW INCOMPLETE (${category}). Preserved as POSSIBLE with recommendation REVIEW.`,
            geminiRetried: true,
            geminiRetrySuccess: false,
            failureReason: geminiFailureReason,
            officialNoticeUrl: cleanOfficialUrl,
          });
        }
      } else {
        // No change needed; record current state
        const cleanUrl = formatOfficialNoticeUrl(noticeId, tender.officialNoticeUrl);
        auditRecords.push({
          noticeId,
          title: tender.title,
          buyer: tender.buyerName,
          priorQualification,
          priorLifecycleStatus,
          priorIsArchived,
          priorAiResult,
          newQualification: tender.qualification,
          newLifecycleStatus: tender.lifecycleStatus || 'ACTIVE',
          newIsArchived: tender.isArchived,
          newAiResult: tender.aiResult,
          primaryPurpose: (tender as any).primaryPurpose || 'CREATIVE_MARKETING',
          recommendation: (tender as any).recommendation || 'WATCH',
          aiReviewStatus: tender.aiResult === 'FAILED' ? 'REQUIRED' : 'COMPLETED',
          changed: false,
          reason: tender.plainEnglishSummary || 'Current classification remains valid.',
          geminiRetried: false,
          officialNoticeUrl: cleanUrl,
        });
      }
    }

    // Refresh final database counts
    const counts = await tendersRepo.countByTab();

    return {
      totalInspected: tendersToEvaluate.length,
      totalChanged,
      reclassifiedToReject,
      retainedActive: counts.ALL || 0,
      geminiRetriesAttempted,
      geminiRetriesSucceeded,
      geminiRetriesFailed,
      failureReasons,
      activeAllCount: counts.ALL || 0,
      archivedCount: counts.ARCHIVED || 0,
      records: auditRecords,
    };
  }
}
