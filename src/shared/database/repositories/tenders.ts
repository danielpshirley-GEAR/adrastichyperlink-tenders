// src/shared/database/repositories/tenders.ts
import { TenderSummary, Qualification, BidDecisionType } from '@/modules/public-tenders/types/tender';
import { getDb } from '../db';
import { randomUUID } from 'crypto';

export class TendersRepository {
  static async getAll(filter?: {
    qualification?: Qualification;
    isArchived?: boolean;
    tab?: string;
  }): Promise<TenderSummary[]> {
    const db = getDb();
    let query = 'SELECT * FROM tenders WHERE 1=1';
    const params: any[] = [];

    if (filter?.tab) {
      const tab = filter.tab.toUpperCase();
      if (tab === 'STRONG') {
        query += ' AND qualification = ? AND is_archived = 0';
        params.push('STRONG');
      } else if (tab === 'POSSIBLE') {
        query += ' AND qualification = ? AND is_archived = 0';
        params.push('POSSIBLE');
      } else if (tab === 'BID') {
        query += ' AND bid_decision_state = ? AND is_archived = 0';
        params.push('BID');
      } else if (tab === 'WATCH') {
        query += ' AND bid_decision_state = ? AND is_archived = 0';
        params.push('WATCH');
      } else if (tab === 'PASSED') {
        query += ' AND bid_decision_state = ? AND is_archived = 0';
        params.push('PASS');
      } else if (tab === 'ARCHIVED') {
        query += ' AND is_archived = 1';
      } else {
        // ALL tab
        query += ' AND is_archived = 0';
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

    query += ' ORDER BY published_at DESC, discovered_at DESC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(mapRowToTender);
  }

  static async getById(id: string): Promise<TenderSummary | null> {
    const db = getDb();
    const row = db.prepare('SELECT * FROM tenders WHERE id = ? OR canonical_reference = ?').get(id, id) as any;
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
    const existing = db.prepare('SELECT * FROM tenders WHERE canonical_reference = ?').get(tender.canonicalReference) as any;

    const id = existing?.id || tender.id || randomUUID();
    const now = new Date().toISOString();

    const ocid = tender.ocid || existing?.ocid || null;
    const title = tender.title || existing?.title || '';
    const plainEnglishSummary = tender.plainEnglishSummary || existing?.plain_english_summary || null;
    const buyerId = (tender as any).buyerId || existing?.buyer_id || null;
    const buyerName = tender.buyerName || existing?.buyer_name || 'Unknown Buyer';
    const valueAmount = tender.valueAmount !== undefined ? tender.valueAmount : (existing?.value_amount ?? null);
    const valueCurrency = tender.valueCurrency || existing?.value_currency || 'GBP';
    const valueDescription = tender.valueDescription || existing?.value_description || null;
    const publishedAt = tender.publishedAt || existing?.published_at || now;
    const submissionDeadline = tender.submissionDeadline || existing?.submission_deadline || now;
    const clarificationDeadline = tender.clarificationDeadline || existing?.clarification_deadline || null;
    const contractStartAt = (tender as any).contractStartAt || existing?.contract_start_at || null;
    const contractEndAt = (tender as any).contractEndAt || existing?.contract_end_at || null;
    const qualification = tender.qualification || existing?.qualification || 'POSSIBLE';
    const verificationGrade = tender.verificationGrade || existing?.verification_grade || 'D';
    const officialNoticeUrl = tender.officialNoticeUrl || existing?.official_notice_url || '';
    const applicationPortalUrl = (tender as any).applicationPortalUrl || existing?.application_portal_url || null;
    const serviceTags = JSON.stringify(tender.serviceTags || (existing?.service_tags ? JSON.parse(existing.service_tags) : []));
    const isArchived = tender.isArchived !== undefined ? (tender.isArchived ? 1 : 0) : (existing?.is_archived ?? 0);
    const bidDecisionState = tender.bidDecisionState || existing?.bid_decision_state || 'UNDECIDED';
    const evaluationCriteria = JSON.stringify(tender.evaluationCriteria || (existing?.evaluation_criteria ? JSON.parse(existing.evaluation_criteria) : []));
    const requirements = JSON.stringify((tender as any).requirements || (existing?.requirements ? JSON.parse(existing.requirements) : []));
    const documents = JSON.stringify((tender as any).documents || (existing?.documents ? JSON.parse(existing.documents) : []));

    if (existing) {
      db.prepare(`
        UPDATE tenders SET
          ocid = ?, title = ?, plain_english_summary = ?, buyer_id = ?, buyer_name = ?,
          value_amount = ?, value_currency = ?, value_description = ?, published_at = ?,
          submission_deadline = ?, clarification_deadline = ?, contract_start_at = ?, contract_end_at = ?,
          last_verified_at = ?, qualification = ?, verification_grade = ?, official_notice_url = ?,
          application_portal_url = ?, service_tags = ?, is_archived = ?, bid_decision_state = ?,
          evaluation_criteria = ?, requirements = ?, documents = ?, updated_at = ?
        WHERE id = ?
      `).run(
        ocid, title, plainEnglishSummary, buyerId, buyerName,
        valueAmount, valueCurrency, valueDescription, publishedAt,
        submissionDeadline, clarificationDeadline, contractStartAt, contractEndAt,
        now, qualification, verificationGrade, officialNoticeUrl,
        applicationPortalUrl, serviceTags, isArchived, bidDecisionState,
        evaluationCriteria, requirements, documents, now,
        id
      );
    } else {
      db.prepare(`
        INSERT INTO tenders (
          id, canonical_reference, ocid, title, plain_english_summary, buyer_id, buyer_name,
          value_amount, value_currency, value_description, published_at, submission_deadline,
          clarification_deadline, contract_start_at, contract_end_at, discovered_at, last_verified_at,
          qualification, verification_grade, official_notice_url, application_portal_url,
          service_tags, is_archived, bid_decision_state, evaluation_criteria, requirements, documents,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?
        )
      `).run(
        id, tender.canonicalReference, ocid, title, plainEnglishSummary, buyerId, buyerName,
        valueAmount, valueCurrency, valueDescription, publishedAt, submissionDeadline,
        clarificationDeadline, contractStartAt, contractEndAt, now, now,
        qualification, verificationGrade, officialNoticeUrl, applicationPortalUrl,
        serviceTags, isArchived, bidDecisionState, evaluationCriteria, requirements, documents,
        now, now
      );
    }

    const saved = await this.getById(id);
    return saved!;
  }

  static async setBidDecision(id: string, decision: BidDecisionType, reasoning?: string): Promise<TenderSummary | null> {
    const db = getDb();
    const tender = await this.getById(id);
    if (!tender) return null;

    const now = new Date().toISOString();
    db.prepare('UPDATE tenders SET bid_decision_state = ?, updated_at = ? WHERE id = ?').run(decision, now, tender.id);

    // Record decision row
    const decId = randomUUID();
    db.prepare(`
      INSERT INTO bid_decisions (id, tender_id, decision, reasoning, decided_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(tender_id) DO UPDATE SET
        decision = excluded.decision,
        reasoning = excluded.reasoning,
        decided_at = excluded.decided_at
    `).run(decId, tender.id, decision, reasoning || null, now);

    return await this.getById(tender.id);
  }

  static async countByTab(): Promise<Record<string, number>> {
    const db = getDb();
    const allCount = (db.prepare('SELECT COUNT(*) as c FROM tenders WHERE is_archived = 0').get() as any).c;
    const strongCount = (db.prepare("SELECT COUNT(*) as c FROM tenders WHERE qualification = 'STRONG' AND is_archived = 0").get() as any).c;
    const possibleCount = (db.prepare("SELECT COUNT(*) as c FROM tenders WHERE qualification = 'POSSIBLE' AND is_archived = 0").get() as any).c;
    const bidCount = (db.prepare("SELECT COUNT(*) as c FROM tenders WHERE bid_decision_state = 'BID' AND is_archived = 0").get() as any).c;
    const watchCount = (db.prepare("SELECT COUNT(*) as c FROM tenders WHERE bid_decision_state = 'WATCH' AND is_archived = 0").get() as any).c;
    const passedCount = (db.prepare("SELECT COUNT(*) as c FROM tenders WHERE bid_decision_state = 'PASS' AND is_archived = 0").get() as any).c;
    const archivedCount = (db.prepare('SELECT COUNT(*) as c FROM tenders WHERE is_archived = 1').get() as any).c;

    return {
      ALL: allCount,
      STRONG: strongCount,
      POSSIBLE: possibleCount,
      BID: bidCount,
      WATCH: watchCount,
      PASSED: passedCount,
      ARCHIVED: archivedCount,
    };
  }

  static async clearAll(): Promise<void> {
    const db = getDb();
    db.prepare('DELETE FROM tenders').run();
    db.prepare('DELETE FROM bid_decisions').run();
    db.prepare('DELETE FROM source_notices').run();
    db.prepare('DELETE FROM tender_source_links').run();
  }
}

function mapRowToTender(row: any): TenderSummary {
  const daysRemaining = row.submission_deadline
    ? Math.max(0, Math.ceil((new Date(row.submission_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    id: row.id,
    canonicalReference: row.canonical_reference,
    ocid: row.ocid || undefined,
    title: row.title,
    plainEnglishSummary: row.plain_english_summary || undefined,
    description: row.plain_english_summary || row.title,
    buyerName: row.buyer_name,
    buyerType: 'Public Body',
    valueAmount: row.value_amount || undefined,
    valueCurrency: row.value_currency || 'GBP',
    valueDescription: row.value_description || (row.value_amount ? `£${row.value_amount.toLocaleString()}` : undefined),
    publishedAt: row.published_at,
    submissionDeadline: row.submission_deadline,
    clarificationDeadline: row.clarification_deadline || undefined,
    daysRemaining,
    qualification: row.qualification as Qualification,
    verificationGrade: row.verification_grade as any,
    officialNoticeUrl: row.official_notice_url,
    serviceTags: row.service_tags ? JSON.parse(row.service_tags) : [],
    sourceId: 'find_a_tender',
    isArchived: Boolean(row.is_archived),
    discoveredAt: row.discovered_at,
    lastVerifiedAt: row.last_verified_at,
    bidDecisionState: row.bid_decision_state as any,
    evaluationCriteria: row.evaluation_criteria ? JSON.parse(row.evaluation_criteria) : [],
    requirements: row.requirements ? JSON.parse(row.requirements) : [],
    documents: row.documents ? JSON.parse(row.documents) : [],
  };
}
