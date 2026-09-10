// src/shared/database/repositories/sources.ts
import { ISourcesRepository } from '../interfaces';
import { getDb } from '../db';
import { randomUUID, createHash } from 'crypto';

export type SourceHealthStatus = 'untested' | 'healthy' | 'degraded' | 'error' | 'disabled' | 'not_implemented';

export interface SourceRecord {
  id: string;
  name: string;
  portalType: string;
  baseUrl: string;
  apiEndpoint?: string | null;
  healthStatus: SourceHealthStatus;
  lastSuccessfulScanAt: string | null;
  lastAttemptAt?: string | null;
  lastScanError: string | null;
  totalNoticesScanned: number;
  totalRelevantFound: number;
  scanFrequency: string;
  isActive: boolean;
}

export interface ScanRunRecord {
  id: string;
  scanType: string;
  sourceId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string | null;
  noticesChecked: number;
  initialCandidates: number;
  aiRelevant: number;
  strongCount: number;
  possibleCount: number;
  weakCount: number;
  duplicatesCount: number;
  errorMessage?: string | null;
  durationMs?: number;
}

export class SqliteSourcesRepository implements ISourcesRepository {
  async getAll(): Promise<SourceRecord[]> {
    return SourcesRepository.getAll();
  }

  async getById(id: string): Promise<SourceRecord | null> {
    return SourcesRepository.getById(id);
  }

  async updateHealth(
    id: string,
    status: string,
    stats?: {
      lastScanError?: string | null;
      noticesScannedDelta?: number;
      relevantFoundDelta?: number;
      successful?: boolean;
    }
  ): Promise<void> {
    SourcesRepository.updateHealth(id, status as SourceHealthStatus, stats);
  }

  async recordScanRun(run: Omit<ScanRunRecord, 'id' | 'startedAt'> & { id?: string; startedAt?: string }): Promise<ScanRunRecord> {
    return SourcesRepository.recordScanRun(run);
  }

  async recordSourceNotice(
    sourceId: string,
    noticeId: string,
    rawJson: any,
    noticeUrl: string,
    tenderId?: string | null,
    publishedDate?: string | null,
    closingDate?: string | null,
    noticeType?: string | null,
    ocid?: string | null
  ): Promise<{ id: string; version: number; isDuplicate: boolean }> {
    return SourcesRepository.recordSourceNotice(
      sourceId,
      noticeId,
      rawJson,
      noticeUrl,
      tenderId,
      publishedDate,
      closingDate,
      noticeType,
      ocid
    );
  }

  async recordSourceLink(
    tenderId: string,
    sourceId: string,
    sourceUrl: string,
    urlType: string,
    verificationGrade: string,
    httpStatus: number | null,
    finalRedirectUrl: string | null,
    notes: string | null
  ): Promise<void> {
    SourcesRepository.recordSourceLink(
      tenderId,
      sourceId,
      sourceUrl,
      urlType,
      verificationGrade,
      httpStatus,
      finalRedirectUrl,
      notes
    );
  }

  async linkSourceNoticesToTender(sourceId: string, tenderId: string, noticeId: string, ocid?: string): Promise<void> {
    SourcesRepository.linkSourceNoticesToTender(sourceId, tenderId, noticeId, ocid);
  }
}

export class SourcesRepository {
  static getAll(): SourceRecord[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM sources ORDER BY is_active DESC, name ASC').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      portalType: r.portal_type,
      baseUrl: r.base_url,
      apiEndpoint: r.api_endpoint,
      healthStatus: r.health_status as SourceHealthStatus,
      lastSuccessfulScanAt: r.last_successful_scan_at,
      lastAttemptAt: r.last_attempt_at,
      lastScanError: r.last_scan_error,
      totalNoticesScanned: r.total_notices_scanned,
      totalRelevantFound: r.total_relevant_found,
      scanFrequency: r.scan_frequency_cron || 'Mon, Wed, Fri 07:00',
      isActive: Boolean(r.is_active),
    }));
  }

  static getById(id: string): SourceRecord | null {
    const db = getDb();
    const r = db.prepare('SELECT * FROM sources WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      portalType: r.portal_type,
      baseUrl: r.base_url,
      apiEndpoint: r.api_endpoint,
      healthStatus: r.health_status as SourceHealthStatus,
      lastSuccessfulScanAt: r.last_successful_scan_at,
      lastAttemptAt: r.last_attempt_at,
      lastScanError: r.last_scan_error,
      totalNoticesScanned: r.total_notices_scanned,
      totalRelevantFound: r.total_relevant_found,
      scanFrequency: r.scan_frequency_cron || 'Mon, Wed, Fri 07:00',
      isActive: Boolean(r.is_active),
    };
  }

  static updateHealth(
    id: string,
    status: SourceHealthStatus,
    stats?: {
      lastScanError?: string | null;
      noticesScannedDelta?: number;
      relevantFoundDelta?: number;
      successful?: boolean;
    }
  ): void {
    const db = getDb();
    const now = new Date().toISOString();

    const params: any[] = [status, now, now];
    let query = `
      UPDATE sources SET
        health_status = ?,
        last_attempt_at = ?,
        updated_at = ?
    `;
    if (status === 'healthy' && stats?.successful) {
      query += `, last_successful_scan_at = ?, last_scan_error = NULL`;
      params.push(now);
    } else if (status === 'degraded') {
      if (stats?.lastScanError !== undefined) {
        query += `, last_scan_error = ?`;
        params.push(stats.lastScanError);
      }
      if (stats?.successful) {
        query += `, last_successful_scan_at = ?`;
        params.push(now);
      }
    } else if (stats?.lastScanError !== undefined) {
      query += `, last_scan_error = ?`;
      params.push(stats.lastScanError);
    }

    if (stats?.noticesScannedDelta) {
      query += `, total_notices_scanned = total_notices_scanned + ?`;
      params.push(stats.noticesScannedDelta);
    }

    if (stats?.relevantFoundDelta) {
      query += `, total_relevant_found = total_relevant_found + ?`;
      params.push(stats.relevantFoundDelta);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.prepare(query).run(...params);
  }

  static recordScanRun(run: Omit<ScanRunRecord, 'id' | 'startedAt'> & { id?: string; startedAt?: string }): ScanRunRecord {
    const db = getDb();
    const id = run.id || randomUUID();
    const startedAt = run.startedAt || new Date().toISOString();

    db.prepare(`
      INSERT INTO scan_runs (
        id, scan_type, source_id, status, started_at, completed_at,
        notices_checked, initial_candidates, ai_relevant,
        strong_count, possible_count, weak_count, duplicates_count,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, run.scanType, run.sourceId, run.status, startedAt, run.completedAt || null,
      run.noticesChecked, run.initialCandidates, run.aiRelevant,
      run.strongCount, run.possibleCount, run.weakCount, run.duplicatesCount,
      run.errorMessage || null
    );

    return {
      ...run,
      id,
      startedAt,
    };
  }

  static getRecentScanRuns(limit: number = 10): ScanRunRecord[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM scan_runs ORDER BY started_at DESC LIMIT ?').all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      scanType: r.scan_type,
      sourceId: r.source_id,
      status: r.status,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      noticesChecked: r.notices_checked,
      initialCandidates: r.initial_candidates,
      aiRelevant: r.ai_relevant,
      strongCount: r.strong_count,
      possibleCount: r.possible_count,
      weakCount: r.weak_count,
      duplicatesCount: r.duplicates_count,
      errorMessage: r.error_message,
    }));
  }

  static recordSourceNotice(
    sourceId: string,
    noticeId: string,
    rawJson: any,
    noticeUrl: string,
    tenderId?: string | null,
    publishedDate?: string | null,
    closingDate?: string | null,
    noticeType?: string | null,
    ocid?: string | null
  ): { id: string; version: number; isDuplicate: boolean } {
    const db = getDb();
    const contentHash = createHash('sha256').update(JSON.stringify(rawJson)).digest('hex');

    // Check for existing releases of this notice
    const existing = db
      .prepare('SELECT id, version, content_hash, tender_id FROM source_notices WHERE source_id = ? AND notice_id = ? ORDER BY version DESC')
      .all(sourceId, noticeId) as any[];

    if (existing && existing.length > 0) {
      const match = existing.find((r) => r.content_hash === contentHash);
      if (match) {
        // Identical unchanged release: do not create another duplicate row
        if (tenderId && !match.tender_id) {
          db.prepare('UPDATE source_notices SET tender_id = ? WHERE id = ?').run(tenderId, match.id);
        }
        return { id: match.id, version: match.version, isDuplicate: true };
      }

      // Payload has changed: increment version and preserve history
      const nextVersion = (existing[0]?.version || 1) + 1;
      const id = randomUUID();
      db.prepare(`
        INSERT INTO source_notices (
          id, source_id, notice_id, ocid, tender_id, raw_notice_json,
          notice_url, published_date, closing_date, notice_type, content_hash, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, sourceId, noticeId, ocid || null, tenderId || null, JSON.stringify(rawJson),
        noticeUrl, publishedDate || null, closingDate || null, noticeType || null, contentHash, nextVersion
      );
      return { id, version: nextVersion, isDuplicate: false };
    }

    // First time seeing this release
    const id = randomUUID();
    db.prepare(`
      INSERT INTO source_notices (
        id, source_id, notice_id, ocid, tender_id, raw_notice_json,
        notice_url, published_date, closing_date, notice_type, content_hash, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, sourceId, noticeId, ocid || null, tenderId || null, JSON.stringify(rawJson),
      noticeUrl, publishedDate || null, closingDate || null, noticeType || null, contentHash, 1
    );

    return { id, version: 1, isDuplicate: false };
  }

  static recordSourceLink(
    tenderId: string,
    sourceId: string,
    sourceUrl: string,
    urlType: string,
    verificationGrade: string,
    httpStatus: number | null,
    finalRedirectUrl: string | null,
    notes: string | null
  ): void {
    const db = getDb();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO tender_source_links (
        id, tender_id, source_id, source_url, url_type,
        verification_grade, http_status, final_redirect_url, verification_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, tenderId, sourceId, sourceUrl, urlType,
      verificationGrade, httpStatus, finalRedirectUrl, notes
    );
  }

  static linkSourceNoticesToTender(sourceId: string, tenderId: string, noticeId: string, ocid?: string): void {
    const db = getDb();
    db.prepare('UPDATE source_notices SET tender_id = ? WHERE source_id = ? AND notice_id = ?').run(tenderId, sourceId, noticeId);
    if (ocid) {
      db.prepare('UPDATE source_notices SET tender_id = ? WHERE source_id = ? AND ocid = ?').run(tenderId, sourceId, ocid);
    }
  }
}
