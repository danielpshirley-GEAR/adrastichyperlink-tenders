// src/shared/database/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ITendersRepository, ISourcesRepository, IBuyersRepository, IApplicationsRepository } from './interfaces';
import { TenderSummary, Qualification, VerificationGrade, BidDecisionType } from '@/modules/public-tenders/types/tender';
import { SourceRecord, ScanRunRecord } from './repositories/sources';
import crypto from 'crypto';

let supabaseClientInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClientInstance) {
    const url = process.env.SUPABASE_URL!;
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)!;
    supabaseClientInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseClientInstance;
}

export class SupabaseTendersRepository implements ITendersRepository {
  private get client(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not configured');
    return client;
  }

  async getAll(tab?: string, options?: { limit?: number; offset?: number }): Promise<TenderSummary[]> {
    let query = this.client.from('tenders').select('*');

    if (tab && tab !== 'ALL') {
      if (tab === 'STRONG' || tab === 'POSSIBLE') {
        query = query.eq('qualification', tab).eq('is_archived', false);
      } else if (tab === 'BID' || tab === 'WATCH' || tab === 'PASSED') {
        const state = tab === 'PASSED' ? 'PASS' : tab;
        query = query.eq('bid_decision_state', state);
      } else if (tab === 'ARCHIVED') {
        query = query.eq('is_archived', true);
      }
    } else {
      query = query.eq('is_archived', false);
    }

    query = query.order('discovered_at', { ascending: false });
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row) => this.mapRow(row));
  }

  async getById(id: string): Promise<TenderSummary | null> {
    const { data, error } = await this.client.from('tenders').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async getByCanonicalReference(ref: string): Promise<TenderSummary | null> {
    const { data, error } = await this.client.from('tenders').select('*').eq('canonical_reference', ref).maybeSingle();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async getByOcid(ocid: string): Promise<TenderSummary | null> {
    const { data, error } = await this.client.from('tenders').select('*').eq('ocid', ocid).maybeSingle();
    if (error || !data) return null;
    return this.mapRow(data);
  }

  async save(tender: Partial<TenderSummary> & { canonicalReference: string; title: string; buyerName: string }): Promise<TenderSummary> {
    // Deduplicate: prioritize OCID, then canonicalReference
    let existing: TenderSummary | null = null;
    if (tender.ocid) {
      existing = await this.getByOcid(tender.ocid);
    }
    if (!existing) {
      existing = await this.getByCanonicalReference(tender.canonicalReference);
    }

    const now = new Date().toISOString();
    const id = existing?.id || crypto.randomUUID();

    const isPastDeadline =
      tender.submissionDeadline && !isNaN(new Date(tender.submissionDeadline).getTime())
        ? new Date(tender.submissionDeadline).getTime() < Date.now()
        : false;

    const lifecycleStatus = isPastDeadline ? 'EXPIRED' : (tender.lifecycleStatus || existing?.lifecycleStatus || 'ACTIVE');
    const isArchived = isPastDeadline || (tender.isArchived ?? existing?.isArchived ?? false);

    const payload: any = {
      id,
      canonical_reference: tender.canonicalReference,
      ocid: tender.ocid || existing?.ocid || null,
      title: tender.title,
      plain_english_summary: tender.plainEnglishSummary ?? existing?.plainEnglishSummary ?? null,
      buyer_name: tender.buyerName,
      value_amount: tender.valueAmount ?? existing?.valueAmount ?? null,
      value_currency: tender.valueCurrency || existing?.valueCurrency || 'GBP',
      value_description: tender.valueDescription ?? existing?.valueDescription ?? null,
      published_at: tender.publishedAt ?? existing?.publishedAt ?? null,
      submission_deadline: tender.submissionDeadline ?? existing?.submissionDeadline ?? null,
      clarification_deadline: tender.clarificationDeadline ?? existing?.clarificationDeadline ?? null,
      qualification: tender.qualification || existing?.qualification || 'POSSIBLE',
      deterministic_result: tender.deterministicResult ?? existing?.deterministicResult ?? null,
      ai_result: tender.aiResult ?? existing?.aiResult ?? null,
      final_qualification: tender.finalQualification ?? existing?.finalQualification ?? tender.qualification ?? 'POSSIBLE',
      lifecycle_status: lifecycleStatus,
      verification_grade: tender.verificationGrade || existing?.verificationGrade || 'D',
      official_notice_url: tender.officialNoticeUrl || existing?.officialNoticeUrl || '',
      application_portal_url: tender.applicationPortalUrl ?? existing?.applicationPortalUrl ?? null,
      service_tags: tender.serviceTags || existing?.serviceTags || [],
      is_archived: isArchived,
      bid_decision_state: tender.bidDecisionState || existing?.bidDecisionState || 'UNDECIDED',
      updated_at: now,
    };

    if (!existing) {
      payload.discovered_at = now;
      payload.last_verified_at = now;
      const { data, error } = await this.client.from('tenders').insert(payload).select().single();
      if (error) throw error;
      return this.mapRow(data);
    } else {
      payload.last_verified_at = now;
      const { data, error } = await this.client.from('tenders').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return this.mapRow(data);
    }
  }

  async setBidDecision(id: string, decision: BidDecisionType, reasoning?: string): Promise<boolean> {
    const { error: tenderErr } = await this.client
      .from('tenders')
      .update({ bid_decision_state: decision, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (tenderErr) return false;

    await this.client.from('bid_decisions').upsert(
      {
        id: crypto.randomUUID(),
        tender_id: id,
        decision,
        reasoning: reasoning || null,
        decided_at: new Date().toISOString(),
      },
      { onConflict: 'tender_id' }
    );

    return true;
  }

  async countByTab(): Promise<Record<string, number>> {
    const { data, error } = await this.client.from('tenders').select('qualification, bid_decision_state, is_archived');
    if (error || !data) {
      return { ALL: 0, STRONG: 0, POSSIBLE: 0, BID: 0, WATCH: 0, PASSED: 0, ARCHIVED: 0 };
    }

    const counts = { ALL: 0, STRONG: 0, POSSIBLE: 0, BID: 0, WATCH: 0, PASSED: 0, ARCHIVED: 0 };
    for (const r of data) {
      if (r.is_archived) {
        counts.ARCHIVED++;
      } else {
        counts.ALL++;
        if (r.qualification === 'STRONG') counts.STRONG++;
        if (r.qualification === 'POSSIBLE') counts.POSSIBLE++;
      }
      if (r.bid_decision_state === 'BID') counts.BID++;
      if (r.bid_decision_state === 'WATCH') counts.WATCH++;
      if (r.bid_decision_state === 'PASS') counts.PASSED++;
    }
    return counts;
  }

  private mapRow(row: any): TenderSummary {
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
      ocid: row.ocid || undefined,
      title: row.title,
      plainEnglishSummary: row.plain_english_summary || '',
      buyerName: row.buyer_name,
      buyerType: 'Public Body',
      valueAmount: row.value_amount ? Number(row.value_amount) : undefined,
      valueCurrency: row.value_currency || 'GBP',
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
      serviceTags: Array.isArray(row.service_tags) ? row.service_tags : [],
      sourceId: 'find_a_tender',
      isArchived: Boolean(row.is_archived),
      discoveredAt: row.discovered_at,
      lastVerifiedAt: row.last_verified_at,
      bidDecisionState: row.bid_decision_state || 'UNDECIDED',
      evaluationCriteria: [],
      requirements: [],
      documents: [],
    };
  }
}

export class SupabaseSourcesRepository implements ISourcesRepository {
  private get client(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not configured');
    return client;
  }

  async getAll(): Promise<SourceRecord[]> {
    const { data, error } = await this.client.from('sources').select('*').order('is_active', { ascending: false });
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      name: r.name,
      portalType: r.portal_type,
      baseUrl: r.base_url,
      apiEndpoint: r.api_endpoint,
      healthStatus: r.health_status,
      lastSuccessfulScanAt: r.last_successful_scan_at,
      lastScanError: r.last_scan_error,
      totalNoticesScanned: r.total_notices_scanned,
      totalRelevantFound: r.total_relevant_found,
      scanFrequency: r.scan_frequency_cron || 'Mon, Wed, Fri 07:00',
      isActive: Boolean(r.is_active),
    }));
  }

  async getById(id: string): Promise<SourceRecord | null> {
    const { data, error } = await this.client.from('sources').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      portalType: data.portal_type,
      baseUrl: data.base_url,
      apiEndpoint: data.api_endpoint,
      healthStatus: data.health_status,
      lastSuccessfulScanAt: data.last_successful_scan_at,
      lastScanError: data.last_scan_error,
      totalNoticesScanned: data.total_notices_scanned,
      totalRelevantFound: data.total_relevant_found,
      scanFrequency: data.scan_frequency_cron || 'Mon, Wed, Fri 07:00',
      isActive: Boolean(data.is_active),
    };
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
    const now = new Date().toISOString();
    const updatePayload: any = {
      health_status: status,
      last_attempt_at: now,
      updated_at: now,
    };

    if (stats?.successful) {
      updatePayload.last_successful_scan_at = now;
      updatePayload.last_scan_error = null;
    } else if (stats?.lastScanError !== undefined) {
      updatePayload.last_scan_error = stats.lastScanError;
    }

    await this.client.from('sources').update(updatePayload).eq('id', id);
  }

  async recordScanRun(run: Omit<ScanRunRecord, 'id' | 'startedAt'> & { id?: string; startedAt?: string }): Promise<ScanRunRecord> {
    const id = run.id || crypto.randomUUID();
    const startedAt = run.startedAt || new Date().toISOString();

    const payload = {
      id,
      scan_type: run.scanType,
      source_id: run.sourceId,
      status: run.status,
      started_at: startedAt,
      completed_at: run.completedAt || null,
      notices_checked: run.noticesChecked,
      initial_candidates: run.initialCandidates,
      ai_relevant: run.aiRelevant,
      strong_count: run.strongCount,
      possible_count: run.possibleCount,
      weak_count: run.weakCount,
      duplicates_count: run.duplicatesCount,
      error_message: run.errorMessage || null,
    };

    await this.client.from('scan_runs').insert(payload);
    return { ...run, id, startedAt };
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
    const contentHash = crypto.createHash('sha256').update(JSON.stringify(rawJson)).digest('hex');

    // Check if an identical unchanged release already exists
    const { data: existing } = await this.client
      .from('source_notices')
      .select('id, version, content_hash, tender_id')
      .eq('source_id', sourceId)
      .eq('notice_id', noticeId)
      .order('version', { ascending: false });

    if (existing && existing.length > 0) {
      const match = existing.find((r) => r.content_hash === contentHash);
      if (match) {
        if (tenderId && !match.tender_id) {
          await this.client.from('source_notices').update({ tender_id: tenderId }).eq('id', match.id);
        }
        return { id: match.id, version: match.version, isDuplicate: true };
      }
      const nextVersion = Math.max(...existing.map((r) => r.version || 1)) + 1;
      const id = crypto.randomUUID();
      await this.client.from('source_notices').insert({
        id,
        source_id: sourceId,
        notice_id: noticeId,
        ocid: ocid || null,
        tender_id: tenderId || null,
        raw_notice_json: rawJson,
        notice_url: noticeUrl,
        published_date: publishedDate || null,
        closing_date: closingDate || null,
        notice_type: noticeType || 'tender',
        content_hash: contentHash,
        version: nextVersion,
      });
      return { id, version: nextVersion, isDuplicate: false };
    }

    const id = crypto.randomUUID();
    await this.client.from('source_notices').insert({
      id,
      source_id: sourceId,
      notice_id: noticeId,
      ocid: ocid || null,
      tender_id: tenderId || null,
      raw_notice_json: rawJson,
      notice_url: noticeUrl,
      published_date: publishedDate || null,
      closing_date: closingDate || null,
      notice_type: noticeType || 'tender',
      content_hash: contentHash,
      version: 1,
    });
    return { id, version: 1, isDuplicate: false };
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
    await this.client.from('tender_source_links').insert({
      id: crypto.randomUUID(),
      tender_id: tenderId,
      source_id: sourceId,
      source_url: sourceUrl,
      url_type: urlType,
      verification_grade: verificationGrade,
      http_status: httpStatus,
      final_redirect_url: finalRedirectUrl,
      verification_notes: notes,
    });
  }

  async linkSourceNoticesToTender(tenderId: string, noticeId: string, ocid?: string): Promise<void> {
    let query = this.client.from('source_notices').update({ tender_id: tenderId }).eq('notice_id', noticeId);
    await query;
    if (ocid) {
      await this.client.from('source_notices').update({ tender_id: tenderId }).eq('ocid', ocid);
    }
  }
}

export class SupabaseBuyersRepository implements IBuyersRepository {
  private get client(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not configured');
    return client;
  }

  async getOrCreate(name: string, data?: { buyerType?: string; website?: string }): Promise<{ id: string; name: string }> {
    const { data: existing } = await this.client.from('buyers').select('id, name').eq('name', name).maybeSingle();
    if (existing) return existing;

    const id = crypto.randomUUID();
    const { data: created, error } = await this.client
      .from('buyers')
      .insert({
        id,
        name,
        buyer_type: data?.buyerType || 'other',
        website: data?.website || null,
      })
      .select('id, name')
      .single();

    if (error || !created) {
      return { id, name };
    }
    return created;
  }
}

export class SupabaseApplicationsRepository implements IApplicationsRepository {
  private get client(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not configured');
    return client;
  }

  async getAll(): Promise<any[]> {
    const { data, error } = await this.client.from('applications').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  }

  async getById(id: string): Promise<any | null> {
    const { data, error } = await this.client.from('applications').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data;
  }

  async createFromTender(tenderId: string): Promise<any> {
    const { data: tender } = await this.client.from('tenders').select('*').eq('id', tenderId).single();
    if (!tender) throw new Error(`Tender ${tenderId} not found`);

    const { data: existing } = await this.client.from('applications').select('*').eq('tender_id', tenderId).maybeSingle();
    if (existing) return existing;

    const id = crypto.randomUUID();
    const payload = {
      id,
      tender_id: tenderId,
      tender_title: tender.title,
      canonical_reference: tender.canonical_reference,
      buyer_name: tender.buyer_name,
      submission_deadline: tender.submission_deadline || null,
      status: 'DRAFT',
      bid_decision: 'BID',
      overall_suitability_score: 88,
      win_themes: ['Agile Motion Delivery', 'Verified Brand Compliance'],
      questions_count: 0,
      facts_required_count: 0,
      questions: [],
    };

    const { data: created, error } = await this.client.from('applications').insert(payload).select().single();
    if (error) throw error;
    return created;
  }
}
