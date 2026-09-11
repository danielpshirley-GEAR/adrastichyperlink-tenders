// src/shared/database/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ITendersRepository, ISourcesRepository, IBuyersRepository, IApplicationsRepository } from './interfaces';
import { TenderSummary, Qualification, VerificationGrade, BidDecisionType } from '@/modules/public-tenders/types/tender';
import { TenderApplication, ApplicationStatus } from '@/modules/public-tenders/types/application';
import { SourceRecord, ScanRunRecord } from './repositories/sources';
import crypto from 'crypto';

let supabaseClientInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  if (process.env.NODE_ENV === 'production') {
    // Production backend MUST require SUPABASE_SERVICE_ROLE_KEY. Never substitute with anon key.
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClientInstance) {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.NODE_ENV === 'production'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)!;
    supabaseClientInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
    // Auto-heal legacy rejected records to ensure database-level consistency
    healLegacyRejectedTenders(supabaseClientInstance);
  }
  return supabaseClientInstance;
}

async function healLegacyRejectedTenders(client: SupabaseClient) {
  try {
    await client
      .from('tenders')
      .update({
        lifecycle_status: 'REJECTED',
        is_archived: true,
      })
      .or('qualification.eq.REJECT,final_qualification.eq.REJECT')
      .eq('is_archived', false);
  } catch {
    // Non-blocking background heal
  }
}

export class SupabaseTendersRepository implements ITendersRepository {
  private get client(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not configured');
    return client;
  }

  async getAll(tab?: string, options?: { limit?: number; offset?: number }): Promise<TenderSummary[]> {
    let query = this.client.from('tenders').select('*');

    const activeTab = (tab || 'ALL').toUpperCase();

    if (activeTab === 'ALL') {
      // CURRENT ACTIONABLE OPPORTUNITIES ONLY:
      // Excludes isArchived = true, lifecycle_status IN ('EXPIRED', 'REJECTED'), qualification = 'REJECT'
      query = query
        .eq('is_archived', false)
        .neq('qualification', 'REJECT')
        .neq('lifecycle_status', 'EXPIRED')
        .neq('lifecycle_status', 'REJECTED');
    } else if (activeTab === 'STRONG' || activeTab === 'POSSIBLE') {
      query = query
        .eq('qualification', activeTab)
        .eq('is_archived', false)
        .neq('lifecycle_status', 'EXPIRED')
        .neq('lifecycle_status', 'REJECTED');
    } else if (activeTab === 'BID' || activeTab === 'WATCH' || activeTab === 'PASSED') {
      const state = activeTab === 'PASSED' ? 'PASS' : activeTab;
      query = query
        .eq('bid_decision_state', state)
        .eq('is_archived', false)
        .neq('qualification', 'REJECT')
        .neq('lifecycle_status', 'EXPIRED')
        .neq('lifecycle_status', 'REJECTED');
    } else if (activeTab === 'ARCHIVED') {
      query = query.or('is_archived.eq.true,lifecycle_status.eq.EXPIRED,lifecycle_status.eq.REJECTED,qualification.eq.REJECT');
    }

    query = query.order('discovered_at', { ascending: false });
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get tenders: ${error.message}`);
    return (data || []).map((row) => this.mapRow(row));
  }

  async getById(id: string): Promise<TenderSummary | null> {
    const { data, error } = await this.client.from('tenders').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to get tender by id: ${error.message}`);
    if (!data) return null;
    return this.mapRow(data);
  }

  async getByCanonicalReference(ref: string): Promise<TenderSummary | null> {
    const { data, error } = await this.client.from('tenders').select('*').eq('canonical_reference', ref).maybeSingle();
    if (error) throw new Error(`Failed to get tender by reference: ${error.message}`);
    if (!data) return null;
    return this.mapRow(data);
  }

  async getByOcid(ocid: string): Promise<TenderSummary | null> {
    const { data, error } = await this.client.from('tenders').select('*').eq('ocid', ocid).maybeSingle();
    if (error) throw new Error(`Failed to get tender by ocid: ${error.message}`);
    if (!data) return null;
    return this.mapRow(data);
  }

  async save(
    tender: Partial<TenderSummary> & {
      canonicalReference: string;
      title?: string | null;
      buyerName?: string | null;
      latestNoticeId?: string | null;
      buyerId?: string | null;
    }
  ): Promise<TenderSummary> {
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

    const isRejected = tender.finalQualification !== undefined
      ? (tender.finalQualification === 'REJECT' || tender.qualification === 'REJECT')
      : (existing?.finalQualification === 'REJECT' || existing?.qualification === 'REJECT');

    let lifecycleStatus = 'ACTIVE';
    if (isPastDeadline) {
      lifecycleStatus = 'EXPIRED';
    } else if (isRejected) {
      lifecycleStatus = 'REJECTED';
    } else {
      lifecycleStatus = tender.lifecycleStatus || existing?.lifecycleStatus || 'ACTIVE';
    }

    const isArchived = (isPastDeadline || isRejected)
      ? true
      : (tender.isArchived !== undefined ? Boolean(tender.isArchived) : (existing?.isArchived ?? false));

    let archivedReason = (tender as any).archivedReason !== undefined ? (tender as any).archivedReason : ((existing as any)?.archivedReason ?? null);
    if (isPastDeadline && !archivedReason) {
      archivedReason = 'EXPIRED';
    } else if (isRejected && !archivedReason) {
      archivedReason = 'AI_REJECTED';
    }

    const qualification = isRejected ? 'REJECT' : (tender.qualification || existing?.qualification || 'POSSIBLE');
    const deterministicResult = tender.deterministicResult ?? existing?.deterministicResult ?? null;
    const aiResult = tender.aiResult ?? existing?.aiResult ?? null;
    const finalQualification = isRejected ? 'REJECT' : (tender.finalQualification ?? existing?.finalQualification ?? qualification);

    // Identity preservation: when found by OCID, preserve original canonical_reference
    const canonicalReference = existing ? existing.canonicalReference : tender.canonicalReference;
    const latestNoticeId = tender.latestNoticeId || tender.canonicalReference;
    const buyerId = tender.buyerId || (existing as any)?.buyerId || null;

    const rawUrl = tender.officialNoticeUrl || existing?.officialNoticeUrl || '';
    const cleanNoticeId = (latestNoticeId || canonicalReference || rawUrl).match(/(\d{6}-\d{4})/)?.[1];
    const officialNoticeUrl = cleanNoticeId
      ? `https://www.find-tender.service.gov.uk/Notice/${cleanNoticeId}`
      : rawUrl.replace(/svg.*$/i, '').trim();

    const payload: any = {
      id,
      canonical_reference: canonicalReference,
      latest_notice_id: latestNoticeId,
      ocid: tender.ocid || existing?.ocid || null,
      title: tender.title !== undefined ? tender.title : (existing?.title ?? null),
      plain_english_summary: tender.plainEnglishSummary ?? existing?.plainEnglishSummary ?? null,
      buyer_id: buyerId,
      buyer_name: tender.buyerName !== undefined ? tender.buyerName : (existing?.buyerName ?? null),
      value_amount: tender.valueAmount !== undefined ? tender.valueAmount : (existing?.valueAmount ?? null),
      value_currency: tender.valueCurrency || existing?.valueCurrency || null,
      value_description: tender.valueDescription ?? existing?.valueDescription ?? null,
      published_at: tender.publishedAt !== undefined ? tender.publishedAt : (existing?.publishedAt ?? null),
      submission_deadline: tender.submissionDeadline !== undefined ? tender.submissionDeadline : (existing?.submissionDeadline ?? null),
      clarification_deadline: tender.clarificationDeadline !== undefined ? tender.clarificationDeadline : (existing?.clarificationDeadline ?? null),
      qualification,
      deterministic_result: deterministicResult,
      ai_result: aiResult,
      final_qualification: finalQualification,
      lifecycle_status: lifecycleStatus,
      verification_grade: tender.verificationGrade || existing?.verificationGrade || 'D',
      official_notice_url: officialNoticeUrl,
      application_portal_url: tender.applicationPortalUrl ?? existing?.applicationPortalUrl ?? null,
      service_tags: tender.serviceTags || existing?.serviceTags || [],
      is_archived: isArchived,
      bid_decision_state: tender.bidDecisionState || existing?.bidDecisionState || 'UNDECIDED',
      updated_at: now,
    };

    if (archivedReason) {
      payload.archived_reason = archivedReason;
    }

    if (!existing) {
      payload.discovered_at = now;
      payload.last_verified_at = now;
      let res = await this.client.from('tenders').insert(payload).select().single();
      if (res.error && res.error.message.includes('archived_reason')) {
        delete payload.archived_reason;
        res = await this.client.from('tenders').insert(payload).select().single();
      }
      if (res.error) throw new Error(`Failed to insert tender: ${res.error.message}`);
      return this.mapRow(res.data);
    } else {
      payload.last_verified_at = now;
      let res = await this.client.from('tenders').update(payload).eq('id', id).select().single();
      if (res.error && res.error.message.includes('archived_reason')) {
        delete payload.archived_reason;
        res = await this.client.from('tenders').update(payload).eq('id', id).select().single();
      }
      if (res.error) throw new Error(`Failed to update tender: ${res.error.message}`);
      return this.mapRow(res.data);
    }
  }

  async setBidDecision(id: string, decision: BidDecisionType, reasoning?: string): Promise<boolean> {
    const { error: tenderErr } = await this.client
      .from('tenders')
      .update({ bid_decision_state: decision, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (tenderErr) {
      throw new Error(`Failed to update tender bid decision: ${tenderErr.message}`);
    }

    const { error: bidErr } = await this.client.from('bid_decisions').upsert(
      {
        id: crypto.randomUUID(),
        tender_id: id,
        decision,
        reasoning: reasoning || null,
        decided_at: new Date().toISOString(),
      },
      { onConflict: 'tender_id' }
    );

    if (bidErr) {
      throw new Error(`Failed to record bid decision: ${bidErr.message}`);
    }

    return true;
  }

  async countByTab(): Promise<Record<string, number>> {
    const { data, error } = await this.client.from('tenders').select('qualification, bid_decision_state, is_archived, lifecycle_status');
    if (error) {
      throw new Error(`Failed to count tenders: ${error.message}`);
    }

    const counts = { ALL: 0, STRONG: 0, POSSIBLE: 0, BID: 0, WATCH: 0, PASSED: 0, ARCHIVED: 0 };
    for (const r of data || []) {
      const isArchived = Boolean(r.is_archived) || r.lifecycle_status === 'EXPIRED' || r.lifecycle_status === 'REJECTED' || r.qualification === 'REJECT';

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
      latestNoticeId: row.latest_notice_id || undefined,
      ocid: row.ocid || undefined,
      title: row.title || null,
      plainEnglishSummary: row.plain_english_summary || '',
      buyerName: row.buyer_name || null,
      buyerId: row.buyer_id || undefined,
      buyerType: 'Public Body',
      valueAmount: row.value_amount ? Number(row.value_amount) : undefined,
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
      serviceTags: Array.isArray(row.service_tags) ? row.service_tags : [],
      sourceId: 'find_a_tender',
      isArchived: Boolean(row.is_archived),
      archivedReason: row.archived_reason || (row.is_archived && row.final_qualification === 'REJECT' ? 'AI_REJECTED' : (row.is_archived && row.lifecycle_status === 'EXPIRED' ? 'EXPIRED' : undefined)),
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
    if (error) throw new Error(`Failed to get sources: ${error.message}`);
    return (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      portalType: r.portal_type,
      baseUrl: r.base_url,
      apiEndpoint: r.api_endpoint,
      healthStatus: r.health_status,
      lastSuccessfulScanAt: r.last_successful_scan_at,
      lastAttemptAt: r.last_attempt_at,
      lastScanError: r.last_scan_error,
      totalNoticesScanned: r.total_notices_scanned,
      totalRelevantFound: r.total_relevant_found,
      scanFrequency: r.scan_frequency_cron || 'Mon, Wed, Fri 07:00',
      isActive: Boolean(r.is_active),
    }));
  }

  async getById(id: string): Promise<SourceRecord | null> {
    const { data, error } = await this.client.from('sources').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to get source ${id}: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      portalType: data.portal_type,
      baseUrl: data.base_url,
      apiEndpoint: data.api_endpoint,
      healthStatus: data.health_status,
      lastSuccessfulScanAt: data.last_successful_scan_at,
      lastAttemptAt: data.last_attempt_at,
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
    // If deltas are present, attempt atomic RPC increment
    if (stats?.noticesScannedDelta || stats?.relevantFoundDelta) {
      const { error: rpcErr } = await this.client.rpc('increment_source_counters', {
        p_source_id: id,
        p_scanned_delta: stats.noticesScannedDelta || 0,
        p_relevant_delta: stats.relevantFoundDelta || 0,
        p_status: status,
        p_last_scan_error: stats.lastScanError || null,
        p_successful: Boolean(stats.successful),
      });

      if (!rpcErr) return;
      // If RPC is missing, continue to fallback update below
    }

    const now = new Date().toISOString();
    const updatePayload: any = {
      health_status: status,
      last_attempt_at: now,
      updated_at: now,
    };

    if (status === 'healthy' && stats?.successful) {
      updatePayload.last_successful_scan_at = now;
      updatePayload.last_scan_error = null;
    } else if (status === 'degraded') {
      if (stats?.lastScanError !== undefined) {
        updatePayload.last_scan_error = stats.lastScanError;
      }
      if (stats?.successful) {
        updatePayload.last_successful_scan_at = now;
      }
    } else if (stats?.lastScanError !== undefined) {
      updatePayload.last_scan_error = stats.lastScanError;
    }

    const { error } = await this.client.from('sources').update(updatePayload).eq('id', id);
    if (error) {
      throw new Error(`Failed to update source health: ${error.message}`);
    }
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

    const { error } = await this.client.from('scan_runs').insert(payload);
    if (error) {
      throw new Error(`Failed to record scan run: ${error.message}`);
    }
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
    const { data: existing, error: selectErr } = await this.client
      .from('source_notices')
      .select('id, version, content_hash, tender_id')
      .eq('source_id', sourceId)
      .eq('notice_id', noticeId)
      .order('version', { ascending: false });

    if (selectErr) {
      throw new Error(`Failed to query source notices: ${selectErr.message}`);
    }

    if (existing && existing.length > 0) {
      const match = existing.find((r) => r.content_hash === contentHash);
      if (match) {
        if (tenderId && !match.tender_id) {
          const { error: updateErr } = await this.client.from('source_notices').update({ tender_id: tenderId }).eq('id', match.id);
          if (updateErr) throw new Error(`Failed to link notice to tender: ${updateErr.message}`);
        }
        return { id: match.id, version: match.version, isDuplicate: true };
      }
      const nextVersion = Math.max(...existing.map((r) => r.version || 1)) + 1;
      const id = crypto.randomUUID();
      const { error: insertErr } = await this.client.from('source_notices').insert({
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
      if (insertErr) throw new Error(`Failed to insert source notice version: ${insertErr.message}`);
      return { id, version: nextVersion, isDuplicate: false };
    }

    const id = crypto.randomUUID();
    const { error: insertErr } = await this.client.from('source_notices').insert({
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
    if (insertErr) throw new Error(`Failed to insert source notice: ${insertErr.message}`);
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
    const basePayload = {
      id: crypto.randomUUID(),
      tender_id: tenderId,
      source_id: sourceId,
      source_url: sourceUrl,
      url_type: urlType,
      verification_grade: verificationGrade,
      http_status: httpStatus,
      final_redirect_url: finalRedirectUrl,
    };

    let { error } = await this.client.from('tender_source_links').insert({
      ...basePayload,
      verification_notes: notes,
    });

    if (error && (error.message.includes('verification_notes') || error.message.includes('column'))) {
      const fallback = await this.client.from('tender_source_links').insert({
        ...basePayload,
        notes: notes,
      });
      error = fallback.error;
    }

    if (error) {
      throw new Error(`Failed to record source link: ${error.message}`);
    }
  }

  async linkSourceNoticesToTender(sourceId: string, tenderId: string, noticeId: string, ocid?: string): Promise<void> {
    const { error: err1 } = await this.client
      .from('source_notices')
      .update({ tender_id: tenderId })
      .eq('source_id', sourceId)
      .eq('notice_id', noticeId);
    if (err1) throw new Error(`Failed to link source notice to tender: ${err1.message}`);

    if (ocid) {
      const { error: err2 } = await this.client
        .from('source_notices')
        .update({ tender_id: tenderId })
        .eq('source_id', sourceId)
        .eq('ocid', ocid);
      if (err2) throw new Error(`Failed to link source notice ocid to tender: ${err2.message}`);
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
    const { data: existing, error: selectErr } = await this.client.from('buyers').select('id, name').eq('name', name).maybeSingle();
    if (selectErr) throw new Error(`Failed to lookup buyer: ${selectErr.message}`);
    if (existing) return existing;

    const id = crypto.randomUUID();
    const { data: created, error: insertErr } = await this.client
      .from('buyers')
      .insert({
        id,
        name,
        buyer_type: data?.buyerType || 'other',
        website: data?.website || null,
      })
      .select('id, name')
      .single();

    if (insertErr || !created) {
      throw new Error(`Failed to create buyer "${name}": ${insertErr?.message || 'Database insert failed'}`);
    }
    return created;
  }
}

function mapSupabaseApplicationRow(row: any): TenderApplication {
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
    lastUpdated: row.last_updated || row.updated_at || row.created_at || new Date().toISOString(),
    questions: Array.isArray(row.questions) ? row.questions : [],
    factsRequired: [],
    AIAnalysisStatus: 'NOT_RUN',
  };
}

export class SupabaseApplicationsRepository implements IApplicationsRepository {
  private get client(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client not configured');
    return client;
  }

  async getAll(): Promise<TenderApplication[]> {
    const { data, error } = await this.client.from('applications').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to get applications: ${error.message}`);
    return (data || []).map(mapSupabaseApplicationRow);
  }

  async getById(id: string): Promise<TenderApplication | null> {
    const { data, error } = await this.client.from('applications').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to get application: ${error.message}`);
    if (!data) return null;
    return mapSupabaseApplicationRow(data);
  }

  async getByTenderId(tenderId: string): Promise<TenderApplication | null> {
    const { data, error } = await this.client.from('applications').select('*').eq('tender_id', tenderId).maybeSingle();
    if (error) throw new Error(`Failed to get application by tender: ${error.message}`);
    if (!data) return null;
    return mapSupabaseApplicationRow(data);
  }

  async createShellForTender(tenderId: string): Promise<TenderApplication> {
    return this.createFromTender(tenderId);
  }

  async createFromTender(tenderId: string): Promise<TenderApplication> {
    const { data: tender, error: tenderErr } = await this.client.from('tenders').select('*').eq('id', tenderId).single();
    if (tenderErr || !tender) throw new Error(`Tender ${tenderId} not found: ${tenderErr?.message || 'Missing tender record'}`);

    const { data: existing, error: existErr } = await this.client.from('applications').select('*').eq('tender_id', tenderId).maybeSingle();
    if (existErr) throw new Error(`Failed to check existing application: ${existErr.message}`);
    if (existing) return mapSupabaseApplicationRow(existing);

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
      overall_suitability_score: null,
      win_themes: [],
      questions_count: 0,
      facts_required_count: 0,
      questions: [],
    };

    const { data: created, error } = await this.client.from('applications').insert(payload).select().single();
    if (error || !created) throw new Error(`Failed to create application shell: ${error?.message || 'Insert returned null'}`);
    return mapSupabaseApplicationRow(created);
  }
}
