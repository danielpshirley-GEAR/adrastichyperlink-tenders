// src/shared/database/repositories/tenders.ts
import { TenderSummary, Qualification, BidDecisionType, VerificationGrade } from '@/modules/public-tenders/types/tender';
import { ITendersRepository } from '../interfaces';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

export class SqliteTendersRepository implements ITendersRepository {
  async getAll(tab?: string, options?: { limit?: number; offset?: number }): Promise<TenderSummary[]> {
    return TendersRepository.getAll({ tab, limit: options?.limit, offset: options?.offset });
  }

  async getById(id: string): Promise<TenderSummary | null> {
    return TendersRepository.getById(id);
  }

  async getByCanonicalReference(ref: string): Promise<TenderSummary | null> {
    return TendersRepository.getByCanonicalReference(ref);
  }

  async getByOcid(ocid: string): Promise<TenderSummary | null> {
    return TendersRepository.getByOcid(ocid);
  }

  async save(tender: Partial<TenderSummary> & { canonicalReference: string; title: string; buyerName: string }): Promise<TenderSummary> {
    return TendersRepository.save(tender);
  }

  async setBidDecision(id: string, decision: BidDecisionType, reasoning?: string): Promise<boolean> {
    return TendersRepository.setBidDecision(id, decision, reasoning);
  }

  async countByTab(): Promise<Record<string, number>> {
    return TendersRepository.countByTab();
  }
}

export class TendersRepository {
  static async getAll(filter?: {
    qualification?: Qualification;
    isArchived?: boolean;
    tab?: string;
    limit?: number;
    offset?: number;
  }): Promise<TenderSummary[]> {
    const db = getDb();
    let query = 'SELECT * FROM tenders WHERE 1=1';
    const params: any[] = [];

    if (filter?.tab) {
      const tab = filter.tab.toUpperCase();
      if (tab === 'STRONG') {
        query += ' AND qualification = ? AND is_archived = 0 AND lifecycle_status = ?';
        params.push('STRONG', 'ACTIVE');
      } else if (tab === 'POSSIBLE') {
        query += ' AND qualification = ? AND is_archived = 0 AND lifecycle_status = ?';
        params.push('POSSIBLE', 'ACTIVE');
      } else if (tab === 'BID') {
        query += ' AND bid_decision_state = ? AND is_archived = 0 AND lifecycle_status = ? AND qualification != ?';
        params.push('BID', 'ACTIVE', 'REJECT');
      } else if (tab === 'WATCH') {
        query += ' AND bid_decision_state = ? AND is_archived = 0 AND lifecycle_status = ? AND qualification != ?';
        params.push('WATCH', 'ACTIVE', 'REJECT');
      } else if (tab === 'PASSED') {
        query += ' AND bid_decision_state = ? AND is_archived = 0 AND lifecycle_status = ? AND qualification != ?';
        params.push('PASS', 'ACTIVE', 'REJECT');
      } else if (tab === 'ARCHIVED') {
        query += ' AND (is_archived = 1 OR lifecycle_status IN (?, ?) OR qualification = ?)';
        params.push('EXPIRED', 'REJECTED', 'REJECT');
      } else {
        // ALL tab: strictly CURRENT ACTIONABLE OPPORTUNITIES ONLY
        query += ' AND is_archived = 0 AND lifecycle_status = ? AND qualification != ?';
        params.push('ACTIVE', 'REJECT');
      }
    } else {
      if (filter?.isArchived !== undefined) {
        query += ' AND is_archived = ?';
        params.push(filter.isArchived ? 1 : 0);
      }
      if (filter?.qualification) {
        query += ' AND qualification = ?';
        params.push(filter.qualification);
      }
    }

    query += ' ORDER BY CASE WHEN published_at IS NOT NULL THEN published_at ELSE discovered_at END DESC';

    if (filter?.limit) {
      query += ` LIMIT ${filter.limit}`;
      if (filter?.offset) {
        query += ` OFFSET ${filter.offset}`;
      }
    }

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(mapRowToTender);
  }

  static async getById(id: string): Promise<TenderSummary | null> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tenders WHERE id = ? OR canonical_reference = ?').get(id, id) as any;
    if (!row) return null;
    return mapRowToTender(row);
  }

  static async getByCanonicalReference(ref: string): Promise<TenderSummary | null> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tenders WHERE canonical_reference = ?').get(ref) as any;
    if (!row) return null;
    return mapRowToTender(row);
  }

  static async getByOcid(ocid: string): Promise<TenderSummary | null> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tenders WHERE ocid = ?').get(ocid) as any;
    if (!row) return null;
    return mapRowToTender(row);
  }

  static async save(
    tender: Partial<TenderSummary> & {
      canonicalReference: string;
      title: string;
      buyerName: string;
      buyerId?: string | null;
      contractStartAt?: string | null;
      contractEndAt?: string | null;
      requirements?: any[];
      documents?: any[];
      applicationPortalUrl?: string | null;
    }
  ): Promise<TenderSummary> {
    const db = getDb();

    // Prioritize OCID for canonical deduplication, then canonicalReference
    let existing: any = null;
    if (tender.ocid) {
      existing = db.prepare('SELECT * FROM tenders WHERE ocid = ?').get(tender.ocid) as any;
    }
    if (!existing) {
      existing = db.prepare('SELECT * FROM tenders WHERE canonical_reference = ?').get(tender.canonicalReference) as any;
    }

    const id = existing?.id || tender.id || randomUUID();
    const now = new Date().toISOString();

    const latestNoticeId = (tender as any).latestNoticeId || tender.canonicalReference;
    const ocid = tender.ocid || existing?.ocid || null;
    const title = tender.title !== undefined ? tender.title : (existing?.title ?? null);
    const plainEnglishSummary = tender.plainEnglishSummary ?? existing?.plain_english_summary ?? null;
    const buyerId = (tender as any).buyerId || existing?.buyer_id || null;
    const buyerName = tender.buyerName !== undefined ? tender.buyerName : (existing?.buyer_name ?? null);
    const valueAmount = tender.valueAmount !== undefined ? tender.valueAmount : (existing?.value_amount ?? null);
    const valueCurrency = tender.valueCurrency || existing?.value_currency || null;
    const valueDescription = tender.valueDescription || existing?.value_description || null;

    // Strict null policy: NEVER fallback to now
    const publishedAt = tender.publishedAt !== undefined ? tender.publishedAt : (existing?.published_at ?? null);
    const submissionDeadline = tender.submissionDeadline !== undefined ? tender.submissionDeadline : (existing?.submission_deadline ?? null);
    const clarificationDeadline = tender.clarificationDeadline !== undefined ? tender.clarificationDeadline : (existing?.clarification_deadline ?? null);

    const contractStartAt = (tender as any).contractStartAt || existing?.contract_start_at || null;
    const contractEndAt = (tender as any).contractEndAt || existing?.contract_end_at || null;

    // Check if deadline is in the past
    const isPastDeadline =
      submissionDeadline && !isNaN(new Date(submissionDeadline).getTime())
        ? new Date(submissionDeadline).getTime() < Date.now()
        : false;

    const isRejected = (tender.finalQualification === 'REJECT' || tender.qualification === 'REJECT' || existing?.final_qualification === 'REJECT' || existing?.qualification === 'REJECT');

    let lifecycleStatus = 'ACTIVE';
    if (isPastDeadline) {
      lifecycleStatus = 'EXPIRED';
    } else if (isRejected) {
      lifecycleStatus = 'REJECTED';
    } else {
      lifecycleStatus = tender.lifecycleStatus || existing?.lifecycle_status || 'ACTIVE';
    }

    const isArchived = (isPastDeadline || isRejected)
      ? 1
      : (tender.isArchived !== undefined ? (tender.isArchived ? 1 : 0) : (existing?.is_archived ?? 0));

    let archivedReason = (tender as any).archivedReason !== undefined ? (tender as any).archivedReason : (existing?.archived_reason ?? null);
    if (isPastDeadline && !archivedReason) {
      archivedReason = 'EXPIRED';
    } else if (isRejected && !archivedReason) {
      archivedReason = 'AI_REJECTED';
    }

    const qualification = isRejected ? 'REJECT' : (tender.qualification || existing?.qualification || 'POSSIBLE');
    const deterministicResult = tender.deterministicResult ?? existing?.deterministic_result ?? null;
    const aiResult = tender.aiResult ?? existing?.ai_result ?? null;
    const finalQualification = isRejected ? 'REJECT' : (tender.finalQualification ?? existing?.final_qualification ?? qualification);

    const verificationGrade = tender.verificationGrade || existing?.verification_grade || 'D';
    const officialNoticeUrl = tender.officialNoticeUrl || existing?.official_notice_url || '';
    const applicationPortalUrl = (tender as any).applicationPortalUrl || existing?.application_portal_url || null;
    const serviceTags = JSON.stringify(tender.serviceTags || (existing?.service_tags ? JSON.parse(existing.service_tags) : []));
    const bidDecisionState = tender.bidDecisionState || existing?.bid_decision_state || 'UNDECIDED';
    const evaluationCriteria = JSON.stringify(tender.evaluationCriteria || (existing?.evaluation_criteria ? JSON.parse(existing.evaluation_criteria) : []));
    const requirements = JSON.stringify((tender as any).requirements || (existing?.requirements ? JSON.parse(existing.requirements) : []));
    const documents = JSON.stringify((tender as any).documents || (existing?.documents ? JSON.parse(existing.documents) : []));

    if (existing) {
      db.prepare(`
        UPDATE tenders SET
          latest_notice_id = ?, ocid = ?, title = ?, plain_english_summary = ?, buyer_id = ?, buyer_name = ?,
          value_amount = ?, value_currency = ?, value_description = ?, published_at = ?,
          submission_deadline = ?, clarification_deadline = ?, contract_start_at = ?, contract_end_at = ?,
          last_verified_at = ?, qualification = ?, deterministic_result = ?, ai_result = ?,
          final_qualification = ?, lifecycle_status = ?, verification_grade = ?, official_notice_url = ?,
          application_portal_url = ?, service_tags = ?, is_archived = ?, archived_reason = ?, bid_decision_state = ?,
          evaluation_criteria = ?, requirements = ?, documents = ?, updated_at = ?
        WHERE id = ?
      `).run(
        latestNoticeId, ocid, title, plainEnglishSummary, buyerId, buyerName,
        valueAmount, valueCurrency, valueDescription, publishedAt,
        submissionDeadline, clarificationDeadline, contractStartAt, contractEndAt,
        now, qualification, deterministicResult, aiResult,
        finalQualification, lifecycleStatus, verificationGrade, officialNoticeUrl,
        applicationPortalUrl, serviceTags, isArchived, archivedReason, bidDecisionState,
        evaluationCriteria, requirements, documents, now,
        id
      );
    } else {
      db.prepare(`
        INSERT INTO tenders (
          id, canonical_reference, latest_notice_id, ocid, title, plain_english_summary,
          buyer_id, buyer_name, value_amount, value_currency, value_description,
          published_at, submission_deadline, clarification_deadline,
          contract_start_at, contract_end_at, discovered_at, last_verified_at,
          qualification, deterministic_result, ai_result, final_qualification,
          lifecycle_status, verification_grade, official_notice_url, application_portal_url,
          service_tags, is_archived, archived_reason, bid_decision_state, evaluation_criteria,
          requirements, documents, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `).run(
        id, tender.canonicalReference, latestNoticeId, ocid, title, plainEnglishSummary,
        buyerId, buyerName, valueAmount, valueCurrency, valueDescription,
        publishedAt, submissionDeadline, clarificationDeadline,
        contractStartAt, contractEndAt, now, now,
        qualification, deterministicResult, aiResult, finalQualification,
        lifecycleStatus, verificationGrade, officialNoticeUrl, applicationPortalUrl,
        serviceTags, isArchived, archivedReason, bidDecisionState, evaluationCriteria,
        requirements, documents, now, now
      );
    }

    // Link any existing source_notices to this canonical tender
    try {
      db.prepare('UPDATE source_notices SET tender_id = ? WHERE notice_id = ?').run(id, tender.canonicalReference);
      if (ocid) {
        db.prepare('UPDATE source_notices SET tender_id = ? WHERE ocid = ?').run(id, ocid);
      }
    } catch {
      // Non-fatal
    }

    const saved = await TendersRepository.getById(id);
    if (!saved) throw new Error('Failed to retrieve saved tender');
    return saved;
  }

  static async setBidDecision(id: string, decision: BidDecisionType, reasoning?: string): Promise<boolean> {
    const db = getDb();
    const now = new Date().toISOString();

    const info = db.prepare(`
      UPDATE tenders SET bid_decision_state = ?, updated_at = ? WHERE id = ?
    `).run(decision, now, id);

    if (info.changes === 0) return false;

    db.prepare(`
      INSERT INTO bid_decisions (id, tender_id, decision, reasoning, decided_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(tender_id) DO UPDATE SET
        decision = excluded.decision,
        reasoning = excluded.reasoning,
        decided_at = excluded.decided_at
    `).run(randomUUID(), id, decision, reasoning || null, now);

    return true;
  }

  static async countByTab(): Promise<Record<string, number>> {
    const db = getDb();
    const counts = {
      ALL: 0,
      STRONG: 0,
      POSSIBLE: 0,
      BID: 0,
      WATCH: 0,
      PASSED: 0,
      ARCHIVED: 0,
    };

    const rows = db.prepare(`
      SELECT
        is_archived,
        qualification,
        lifecycle_status,
        bid_decision_state
      FROM tenders
    `).all() as any[];

    for (const r of rows) {
      const isArchived = r.is_archived === 1 || r.lifecycle_status === 'EXPIRED' || r.lifecycle_status === 'REJECTED' || r.qualification === 'REJECT';

      if (isArchived) {
        counts.ARCHIVED++;
      } else {
        counts.ALL++;
        if (r.qualification === 'STRONG') counts.STRONG++;
        if (r.qualification === 'POSSIBLE') counts.POSSIBLE++;
        if (r.bid_decision_state === 'BID') counts.BID++;
        if (r.bid_decision_state === 'WATCH') counts.WATCH++;
        if (r.bid_decision_state === 'PASS') counts.PASSED++;
      }
    }

    return counts;
  }
}

function mapRowToTender(row: any): TenderSummary {
  let daysRemaining: number | null = null;
  if (row.submission_deadline) {
    const deadline = new Date(row.submission_deadline).getTime();
    if (!isNaN(deadline)) {
      daysRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    id: row.id,
    canonicalReference: row.canonical_reference,
    latestNoticeId: row.latest_notice_id || undefined,
    ocid: row.ocid || undefined,
    title: row.title || null,
    plainEnglishSummary: row.plain_english_summary || '',
    buyerName: row.buyer_name || null,
    buyerId: row.buyer_id || undefined,
    buyerType: 'Public Body',
    valueAmount: row.value_amount !== null && row.value_amount !== undefined ? Number(row.value_amount) : undefined,
    valueCurrency: row.value_currency || null,
    valueDescription: row.value_description || undefined,
    publishedAt: row.published_at || null,
    submissionDeadline: row.submission_deadline || null,
    clarificationDeadline: row.clarification_deadline || null,
    daysRemaining,
    qualification: row.qualification as Qualification,
    deterministicResult: row.deterministic_result || undefined,
    aiResult: row.ai_result || undefined,
    finalQualification: row.final_qualification || undefined,
    lifecycleStatus: row.lifecycle_status || 'ACTIVE',
    verificationGrade: row.verification_grade as VerificationGrade,
    officialNoticeUrl: row.official_notice_url,
    applicationPortalUrl: row.application_portal_url || undefined,
    serviceTags: row.service_tags ? JSON.parse(row.service_tags) : [],
    sourceId: 'find_a_tender',
    isArchived: Boolean(row.is_archived),
    archivedReason: row.archived_reason || (row.is_archived && row.final_qualification === 'REJECT' ? 'AI_REJECTED' : (row.is_archived && row.lifecycle_status === 'EXPIRED' ? 'EXPIRED' : undefined)),
    discoveredAt: row.discovered_at,
    lastVerifiedAt: row.last_verified_at,
    bidDecisionState: row.bid_decision_state || 'UNDECIDED',
    evaluationCriteria: row.evaluation_criteria ? JSON.parse(row.evaluation_criteria) : [],
    requirements: row.requirements ? JSON.parse(row.requirements) : [],
    documents: row.documents ? JSON.parse(row.documents) : [],
  };
}
