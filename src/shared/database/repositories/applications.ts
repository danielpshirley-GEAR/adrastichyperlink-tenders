// src/shared/database/repositories/applications.ts
import { IApplicationsRepository } from '../interfaces';
import { getDb } from '../db';
import { randomUUID } from 'crypto';
import { TenderApplication, ApplicationStatus } from '@/modules/public-tenders/types/application';

export class SqliteApplicationsRepository implements IApplicationsRepository {
  async getAll(): Promise<TenderApplication[]> {
    return ApplicationsRepository.getAll();
  }

  async getById(id: string): Promise<TenderApplication | null> {
    return ApplicationsRepository.getById(id);
  }

  async getByTenderId(tenderId: string): Promise<TenderApplication | null> {
    return ApplicationsRepository.getByTenderId(tenderId);
  }

  async createShellForTender(tenderId: string): Promise<TenderApplication> {
    return ApplicationsRepository.createShellForTender(tenderId);
  }

  async createFromTender(tenderId: string): Promise<TenderApplication> {
    return ApplicationsRepository.createShellForTender(tenderId);
  }
}

export class ApplicationsRepository {
  static async getAll(): Promise<TenderApplication[]> {
    const db = getDb();
    const rows = db.prepare(`
      SELECT a.*, t.title as tender_title, t.buyer_name, t.canonical_reference, t.official_notice_url
      FROM applications a
      JOIN tenders t ON a.tender_id = t.id
      ORDER BY a.submission_deadline ASC
    `).all() as any[];

    return rows.map(mapRowToApplication);
  }

  static async getById(id: string): Promise<TenderApplication | null> {
    const db = getDb();
    const row = db.prepare(`
      SELECT a.*, t.title as tender_title, t.buyer_name, t.canonical_reference, t.official_notice_url
      FROM applications a
      JOIN tenders t ON a.tender_id = t.id
      WHERE a.id = ?
    `).get(id) as any;

    if (!row) return null;
    return mapRowToApplication(row);
  }

  static async getByTenderId(tenderId: string): Promise<TenderApplication | null> {
    const db = getDb();
    const row = db.prepare(`
      SELECT a.*, t.title as tender_title, t.buyer_name, t.canonical_reference, t.official_notice_url
      FROM applications a
      JOIN tenders t ON a.tender_id = t.id
      WHERE a.tender_id = ?
    `).get(tenderId) as any;

    if (!row) return null;
    return mapRowToApplication(row);
  }

  static async createShellForTender(tenderId: string): Promise<TenderApplication> {
    const existing = await this.getByTenderId(tenderId);
    if (existing) {
      return existing;
    }

    const db = getDb();
    const tender = db.prepare('SELECT * FROM tenders WHERE id = ?').get(tenderId) as any;
    if (!tender) {
      throw new Error(`Tender with ID ${tenderId} not found`);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO applications (
        id, tender_id, status, submission_deadline,
        tender_title, canonical_reference, buyer_name,
        created_at, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tenderId,
      'DRAFT',
      tender.submission_deadline || null,
      tender.title,
      tender.canonical_reference,
      tender.buyer_name,
      now,
      now
    );

    const created = await this.getById(id);
    return created!;
  }
}

function mapRowToApplication(row: any): TenderApplication {
  let daysRemaining: number | null = null;
  if (row.submission_deadline) {
    const deadline = new Date(row.submission_deadline).getTime();
    if (!isNaN(deadline)) {
      daysRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    id: row.id,
    tenderId: row.tender_id,
    tenderTitle: row.tender_title || 'Untitled Opportunity',
    canonicalReference: row.canonical_reference || 'REF-TBC',
    buyerName: row.buyer_name || 'Public Body',
    submissionDeadline: row.submission_deadline || null,
    daysRemaining,
    status: (row.status?.toUpperCase() === 'SUBMITTED' ? 'SUBMITTED' : row.status?.toUpperCase() === 'READY_FOR_REVIEW' ? 'READY_FOR_REVIEW' : 'DRAFT') as ApplicationStatus,
    bidDecision: 'BID',
    overallSuitabilityScore: typeof row.overall_suitability_score === 'number' ? row.overall_suitability_score : null,
    winThemes: Array.isArray(row.win_themes) ? row.win_themes : (typeof row.win_themes === 'string' ? JSON.parse(row.win_themes) : []),
    questionsCount: typeof row.questions_count === 'number' ? row.questions_count : 0,
    factsRequiredCount: typeof row.facts_required_count === 'number' ? row.facts_required_count : 0,
    lastUpdated: row.last_updated || row.updated_at || new Date().toISOString(),
    questions: Array.isArray(row.questions) ? row.questions : [],
    factsRequired: [],
    AIAnalysisStatus: 'NOT_RUN',
  };
}
