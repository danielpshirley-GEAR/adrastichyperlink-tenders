// src/modules/public-tenders/connectors/contracts-finder.ts
import { ProcurementConnector, RawNoticeRecord, RawDocumentLink, ScanResult, VerificationResult } from './types';
import { UrlVerifier } from '../services/url-verifier';

export interface ContractsFinderScanOptions {
  maxPages?: number;
  safetyLimitNotices?: number;
  cursorUrl?: string | null;
  stage?: 'tender' | 'planning' | 'both';
  limit?: number;
  publishedFrom?: string | null;
  publishedTo?: string | null;
  overlapHours?: number;
}

/**
 * Extracts clean UUID from a Contracts Finder release ID or notice string.
 * Example: "392859ec-e188-4629-9a79-5e045efdf9bd-914058" -> "392859ec-e188-4629-9a79-5e045efdf9bd"
 */
export function extractNoticeUuid(id: string): string {
  if (!id || typeof id !== 'string') return '';
  const match = id.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (match) {
    return match[1].toLowerCase();
  }
  return id.replace(/[^a-zA-Z0-9-]/g, '').trim();
}

/**
 * Ensures Contracts Finder official notice URL strictly matches https://www.contractsfinder.service.gov.uk/Notice/[UUID]
 */
export function formatContractsFinderNoticeUrl(noticeId: string, rawUrl?: string | null): string {
  if (rawUrl) {
    const rawMatch = rawUrl.match(/contractsfinder\.service\.gov\.uk\/Notice\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (rawMatch) {
      return `https://www.contractsfinder.service.gov.uk/Notice/${rawMatch[1].toLowerCase()}`;
    }
  }
  const uuid = extractNoticeUuid(noticeId);
  if (uuid) {
    return `https://www.contractsfinder.service.gov.uk/Notice/${uuid}`;
  }
  return `https://www.contractsfinder.service.gov.uk/Notice/${encodeURIComponent(noticeId)}`;
}

export function assertValidContractsFinderNoticeUrl(url: string): boolean {
  return /^https:\/\/(www\.)?contractsfinder\.service\.gov\.uk\/Notice\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url);
}

export class ContractsFinderConnector implements ProcurementConnector {
  readonly id = 'contracts_finder';
  readonly name = 'Contracts Finder';
  readonly baseUrl = 'https://www.contractsfinder.service.gov.uk';
  readonly portalType = 'England & non-devolved (>£12k central, >£30k local)';

  private readonly ocdsSearchEndpoint = 'https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search';
  private readonly ocdsReleaseEndpoint = 'https://www.contractsfinder.service.gov.uk/Published/OCDS/Release';
  private readonly legacyNoticeReleaseEndpoint = 'https://www.contractsfinder.service.gov.uk/Published/Notice/releases';
  private readonly legacyNoticeRecordEndpoint = 'https://www.contractsfinder.service.gov.uk/Published/Notice/records';

  // Polite browser User-Agent prevents edge WAF 403 blocks while identifying our bot
  private readonly userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (Adrastichyperlink Procurement Engine; contact@adrastichyperlink.com)';

  /**
   * Scans notices published or updated since the given date with cursor pagination.
   * Default overlap of 6 hours prevents late amendments from being missed.
   */
  async scanNewNotices(since?: Date, options: ContractsFinderScanOptions = {}): Promise<ScanResult> {
    if (options.cursorUrl) {
      return this.executeOcdsPagedFetch(options.cursorUrl, options);
    }

    const limit = options.limit || 100;
    const stages = options.stage === 'planning' ? 'planning' : (options.stage === 'tender' ? 'tender' : 'planning,tender');

    const params = new URLSearchParams();
    params.set('stages', stages);
    params.set('limit', String(limit));

    if (since instanceof Date && !isNaN(since.getTime())) {
      const overlapHours = options.overlapHours ?? 6;
      const effectiveSince = new Date(since.getTime() - overlapHours * 3600 * 1000);
      params.set('publishedFrom', effectiveSince.toISOString().slice(0, 19) + 'Z');
    } else if (options.publishedFrom) {
      params.set('publishedFrom', options.publishedFrom);
    }

    if (options.publishedTo) {
      params.set('publishedTo', options.publishedTo);
    }

    const initialUrl = `${this.ocdsSearchEndpoint}?${params.toString()}`;
    return this.executeOcdsPagedFetch(initialUrl, options);
  }

  /**
   * Retrieves active, currently live tender opportunities (stages=tender).
   */
  async scanLiveNotices(options: ContractsFinderScanOptions = {}): Promise<ScanResult> {
    return this.scanNewNotices(undefined, { ...options, stage: 'tender' });
  }

  /**
   * Retrieves early pipeline and market engagement notices (stages=planning).
   */
  async scanPipeline(options: ContractsFinderScanOptions = {}): Promise<ScanResult> {
    return this.scanNewNotices(undefined, { ...options, stage: 'planning' });
  }

  /**
   * Direct retrieval of a single notice by notice UUID, release ID, or OCID.
   * Never manufactures a fake shell record on missing notices.
   */
  async fetchNotice(noticeIdOrOcid: string): Promise<RawNoticeRecord | null> {
    if (!noticeIdOrOcid || typeof noticeIdOrOcid !== 'string') {
      return null;
    }

    const rawInput = noticeIdOrOcid.trim();

    // 1. Try direct OCDS Release if input looks like a full release ID (UUID + -number)
    if (rawInput.includes('-') && rawInput.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-\d+/i)) {
      try {
        const url = `${this.ocdsReleaseEndpoint}/${encodeURIComponent(rawInput)}`;
        const res = await this.fetchWithRetry(url);
        if (res.ok) {
          const json = await res.json();
          const releases = Array.isArray(json.releases) ? json.releases : (json.release ? [json.release] : []);
          if (releases.length > 0) {
            return this.parseOcdsRelease(releases[0]);
          }
        }
      } catch (err: any) {
        // Fall through to legacy endpoint
      }
    }

    // 2. Try legacy releases endpoint by notice UUID
    const uuid = extractNoticeUuid(rawInput);
    if (uuid) {
      try {
        const url = `${this.legacyNoticeReleaseEndpoint}/${encodeURIComponent(uuid)}.json`;
        const res = await this.fetchWithRetry(url);
        if (res.ok) {
          const json = await res.json();
          const releases = Array.isArray(json.releases) ? json.releases : (json.release ? [json.release] : []);
          if (releases.length > 0) {
            return this.parseOcdsRelease(releases[0]);
          }
        }
      } catch (err: any) {
        // Fall through to OCID search
      }
    }

    // 3. Try legacy records endpoint by OCID
    if (rawInput.startsWith('ocds-')) {
      try {
        const url = `${this.legacyNoticeRecordEndpoint}/${encodeURIComponent(rawInput)}.json`;
        const res = await this.fetchWithRetry(url);
        if (res.ok) {
          const json = await res.json();
          const record = json.records?.[0] || json;
          const compiledRelease = record.compiledRelease;
          if (compiledRelease) {
            return this.parseOcdsRelease(compiledRelease);
          }
          if (Array.isArray(record.releases) && record.releases.length > 0) {
            return this.parseOcdsRelease(record.releases[0]);
          }
        }
      } catch (err: any) {
        // Fall through
      }
    }

    return null;
  }

  /**
   * Live HTTP verification of official notice URL.
   */
  async verifyNotice(noticeUrl: string, expectedNoticeId?: string): Promise<VerificationResult> {
    return UrlVerifier.verifyNoticeUrl(noticeUrl, { expectedNoticeId });
  }

  /**
   * Retrieves documents attached to the notice.
   */
  async findDocuments(noticeId: string): Promise<RawDocumentLink[]> {
    const notice = await this.fetchNotice(noticeId);
    return notice?.documentLinks || [];
  }

  /**
   * Checks for subsequent OCDS releases or updates to an existing opportunity.
   */
  async fetchUpdates(noticeIdOrOcid: string): Promise<Record<string, unknown>> {
    const cleanId = noticeIdOrOcid.trim();
    const isOcid = cleanId.startsWith('ocds-');
    const url = isOcid
      ? `${this.legacyNoticeRecordEndpoint}/${encodeURIComponent(cleanId)}.json`
      : `${this.legacyNoticeReleaseEndpoint}/${encodeURIComponent(extractNoticeUuid(cleanId))}.json`;

    try {
      const res = await this.fetchWithRetry(url);
      if (!res.ok) return {};
      const json = await res.json();
      const releases = json.records?.[0]?.releases || json.releases || [];
      if (releases.length > 1) {
        const latest = releases[releases.length - 1];
        return {
          hasUpdates: true,
          totalReleases: releases.length,
          latestReleaseId: latest.id,
          latestDate: latest.date,
          latestTag: latest.tag,
        };
      }
      return { hasUpdates: false, totalReleases: releases.length };
    } catch {
      return {};
    }
  }

  /**
   * Executes a cursor-paginated traversal of the official Contracts Finder OCDS Search API.
   */
  private async executeOcdsPagedFetch(
    initialUrl: string,
    options: ContractsFinderScanOptions = {}
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const scannedAt = new Date().toISOString();
    const maxPages = options.maxPages ?? 10;
    const safetyLimitNotices = options.safetyLimitNotices ?? 1000;

    let currentUrl: string | null = initialUrl;
    let pagesFetched = 0;
    let apiRequestsMade = 0;
    let rateLimitRetries = 0;
    const errors: string[] = [];

    const seenNoticeIds = new Set<string>();
    const candidates: RawNoticeRecord[] = [];

    while (currentUrl && pagesFetched < maxPages && candidates.length < safetyLimitNotices) {
      try {
        apiRequestsMade++;

        // Gentle pacing between pages (250ms)
        if (pagesFetched > 0) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        const fetchResult = await this.fetchWithBackoff(currentUrl);
        rateLimitRetries += fetchResult.retries;

        const response = fetchResult.response;
        if (!response.ok) {
          errors.push(`Contracts Finder API returned HTTP ${response.status}: ${response.statusText} at page ${pagesFetched + 1}`);
          break;
        }

        const json = await response.json();
        pagesFetched++;

        const releases = Array.isArray(json.releases) ? json.releases : [];
        if (releases.length === 0) {
          // No more releases on this page
          break;
        }

        for (const r of releases) {
          try {
            // Rule: DO NOT treat award-only / contract-only notices as new bid opportunities
            const tags = Array.isArray(r.tag) ? r.tag : [];
            const isPureAward = tags.includes('award') || tags.includes('awardUpdate') || tags.includes('contract');
            const isBidOpportunity = tags.includes('tender') || tags.includes('planning') || !isPureAward;

            if (!isBidOpportunity) {
              // Skip purely awarded / past contract notices from new bid discovery
              continue;
            }

            const parsed = this.parseOcdsRelease(r);
            if (parsed) {
              if (!seenNoticeIds.has(parsed.noticeId)) {
                seenNoticeIds.add(parsed.noticeId);
                candidates.push(parsed);
              }
            }
          } catch (err: any) {
            errors.push(`Notice parse error for release ${r?.id}: ${err.message}`);
          }
        }

        // Follow cursor link if provided
        const nextLink = json.links?.next;
        if (typeof nextLink === 'string' && nextLink.length > 0 && nextLink !== currentUrl) {
          currentUrl = nextLink;
        } else {
          // Pagination complete
          currentUrl = null;
        }
      } catch (err: any) {
        errors.push(`Network fetch error at page ${pagesFetched + 1}: ${err.message}`);
        break;
      }
    }

    const durationMs = Date.now() - startTime;
    const nextCursorPresent = Boolean(currentUrl);
    const truncatedBySafetyLimit = Boolean(currentUrl && (pagesFetched >= maxPages || candidates.length >= safetyLimitNotices));
    const paginationComplete = !currentUrl;

    const dates = candidates.map((c) => c.publishedAt).filter(Boolean) as string[];
    const earliestDate = dates.length > 0 ? dates.reduce((min, d) => (d < min ? d : min), dates[0]) : null;
    const latestDate = dates.length > 0 ? dates.reduce((max, d) => (d > max ? d : max), dates[0]) : null;

    return {
      sourceId: this.id,
      scannedAt,
      noticesChecked: candidates.length,
      pagesFetched,
      apiRequestsMade,
      rateLimitRetries,
      durationMs,
      relevantCandidates: candidates,
      errors,
      paginationComplete,
      truncatedBySafetyLimit,
      nextCursorPresent,
      nextCursorUrl: currentUrl,
      earliestDate,
      latestDate,
    };
  }

  /**
   * Fetches URL with bounded retry on HTTP 403 (Contracts Finder explicit rate-limit response),
   * 429, and 503. Follows a 5-minute bounded retry policy on 403.
   */
  private async fetchWithBackoff(
    url: string,
    maxRetries: number = 5
  ): Promise<{ response: Response; retries: number }> {
    let retries = 0;

    while (retries <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': this.userAgent,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // HTTP 403 is Contracts Finder rate-limit / WAF response; 429 and 503 are standard rate/service limits
        if (response.status === 403 || response.status === 429 || response.status === 503) {
          if (retries < maxRetries) {
            retries++;
            const retryAfterHeader = response.headers.get('Retry-After');
            let waitMs = 2000 * Math.pow(2, retries); // 4s, 8s, 16s, 32s, 64s

            if (response.status === 403) {
              // Contracts Finder docs: on 403 rate limit, wait up to 5 minutes
              // In active execution, backoff progressively up to 300s
              waitMs = Math.min(30000 * retries, 300000);
            }

            if (retryAfterHeader) {
              const seconds = parseInt(retryAfterHeader, 10);
              if (!isNaN(seconds) && seconds > 0) {
                waitMs = Math.min(seconds * 1000, 300000);
              }
            }

            console.warn(`[ContractsFinder] Received HTTP ${response.status}. Retrying in ${Math.round(waitMs / 1000)}s (attempt ${retries}/${maxRetries})...`);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }
        }

        return { response, retries };
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (retries < maxRetries) {
          retries++;
          const waitMs = 1500 * Math.pow(2, retries);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Max retries (${maxRetries}) exceeded for ${url}`);
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    const res = await this.fetchWithBackoff(url, 3);
    return res.response;
  }

  /**
   * Parses an official OCDS release payload from Contracts Finder into a canonical RawNoticeRecord.
   * Missing source fields strictly remain null / undefined.
   */
  public parseOcdsRelease(r: any): RawNoticeRecord | null {
    if (!r || !r.id) return null;

    const rawReleaseId = String(r.id);
    const noticeUuid = extractNoticeUuid(rawReleaseId);
    // Use canonical notice UUID as noticeId so all releases of the same notice correlate cleanly
    const noticeId = noticeUuid || rawReleaseId;

    const tender = r.tender || {};
    const title = tender.title || r.description?.slice(0, 100) || null;

    const descParts: string[] = [];
    if (tender.description) descParts.push(tender.description);
    if (r.description && (!tender.description || !tender.description.includes(r.description))) {
      descParts.push(r.description);
    }
    const description = descParts.join('\n\n');

    // Extract Buyer Details
    let buyerName: string | null = r.buyer?.name || null;
    let buyerType = 'Public Body';
    let buyerLocation: string | undefined = undefined;

    if (Array.isArray(r.parties)) {
      const buyerParty = r.parties.find((p: any) => Array.isArray(p.roles) && p.roles.includes('buyer'));
      if (buyerParty) {
        buyerName = buyerParty.name || buyerParty.identifier?.legalName || buyerName;
        buyerType = buyerParty.details?.classifications?.[0]?.description || buyerType;
        if (buyerParty.address) {
          buyerLocation = [buyerParty.address.locality, buyerParty.address.region, buyerParty.address.postalCode]
            .filter(Boolean)
            .join(', ');
        }
      }
    }

    // Extract Contract Value
    const valueAmount = typeof tender.value?.amount === 'number' ? tender.value.amount : undefined;
    const valueCurrency = tender.value?.currency || (valueAmount !== undefined ? 'GBP' : null);
    const minValueAmount = typeof tender.minValue?.amount === 'number' ? tender.minValue.amount : undefined;

    // Extract Dates — Strictly null if missing (no invented dates)
    const publishedAt = tender.datePublished ? String(tender.datePublished) : (r.date ? String(r.date) : null);
    const submissionDeadline = tender.tenderPeriod?.endDate ? String(tender.tenderPeriod.endDate) : null;
    const clarificationDeadline = tender.enquiryPeriod?.endDate ? String(tender.enquiryPeriod.endDate) : null;

    // Extract Documents and URLs
    const documentLinks: RawDocumentLink[] = [];
    let officialNoticeUrl = formatContractsFinderNoticeUrl(noticeId);
    let applicationPortalUrl: string | undefined = undefined;

    if (Array.isArray(tender.documents)) {
      for (const doc of tender.documents) {
        if (doc.url && typeof doc.url === 'string') {
          const docUrl = doc.url.trim();

          // Check if document is the official Contracts Finder notice page
          if (doc.documentType === 'tenderNotice' || docUrl.includes('contractsfinder.service.gov.uk/Notice/')) {
            officialNoticeUrl = formatContractsFinderNoticeUrl(noticeId, docUrl);
          } else if (docUrl.startsWith('http') && !docUrl.includes('contractsfinder.service.gov.uk')) {
            // External submission / tender portal link (e.g. sproc.net, adamprocure, delta, proactis)
            if (!applicationPortalUrl) {
              applicationPortalUrl = docUrl;
            }
          }

          documentLinks.push({
            title: doc.description || doc.title || doc.documentType || 'Notice Document',
            url: docUrl,
            docType: doc.documentType || 'document',
            requiresLogin: Boolean(doc.requiresLogin),
          });
        }
      }
    }

    if (!applicationPortalUrl && typeof tender.submissionMethodDetails === 'string' && tender.submissionMethodDetails.startsWith('http')) {
      applicationPortalUrl = tender.submissionMethodDetails.trim();
    }

    // Extract CPV Codes
    const cpvCodes: string[] = [];
    if (tender.classification?.id) {
      cpvCodes.push(String(tender.classification.id));
    }
    if (Array.isArray(tender.items)) {
      for (const item of tender.items) {
        if (item.classification?.id && !cpvCodes.includes(item.classification.id)) {
          cpvCodes.push(String(item.classification.id));
        }
        if (Array.isArray(item.additionalClassifications)) {
          for (const ac of item.additionalClassifications) {
            if (ac.id && !cpvCodes.includes(ac.id)) {
              cpvCodes.push(String(ac.id));
            }
          }
        }
      }
    }

    // Extract Suitability Flags
    const smeSuitable = tender.suitability?.sme !== undefined ? Boolean(tender.suitability.sme) : undefined;
    const vcseSuitable = tender.suitability?.vcse !== undefined ? Boolean(tender.suitability.vcse) : undefined;

    return {
      sourceId: this.id,
      noticeId,
      ocid: r.ocid ? String(r.ocid) : undefined,
      title,
      buyerName,
      buyerType,
      buyerLocation,
      description,
      valueAmount,
      valueCurrency,
      minValueAmount,
      publishedAt,
      submissionDeadline,
      clarificationDeadline,
      officialNoticeUrl,
      applicationPortalUrl,
      documentLinks,
      cpvCodes,
      smeSuitable,
      vcseSuitable,
      rawPayload: r,
    };
  }
}
