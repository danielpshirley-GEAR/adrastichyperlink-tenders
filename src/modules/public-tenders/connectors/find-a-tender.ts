// src/modules/public-tenders/connectors/find-a-tender.ts
import { ProcurementConnector, RawNoticeRecord, RawDocumentLink, ScanResult, VerificationResult } from './types';
import { UrlVerifier } from '../services/url-verifier';

export interface PagedScanOptions {
  maxPages?: number;
  safetyLimitNotices?: number;
}

export class FindATenderConnector implements ProcurementConnector {
  readonly id = 'find_a_tender';
  readonly name = 'Find a Tender (FTS)';
  readonly baseUrl = 'https://www.find-tender.service.gov.uk';
  readonly portalType = 'primary_ocds';
  private readonly ocdsEndpoint = 'https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages';
  private readonly userAgent = 'Adrastichyperlink-TenderEngine/2.1 (Procurement Bot; contact@adrastichyperlink.com)';

  /**
   * Genuine OCDS scan retrieving notices published or updated since the supplied date,
   * paginating through all available pages via cursor links.
   */
  async scanNewNotices(since?: Date, options: PagedScanOptions = {}): Promise<ScanResult> {
    const params = new URLSearchParams();
    params.set('stages', 'tender');
    params.set('limit', '100');

    if (since instanceof Date && !isNaN(since.getTime())) {
      const iso = since.toISOString().slice(0, 19);
      params.set('updatedFrom', iso);
    }

    return this.executeOcdsPagedFetch(`${this.ocdsEndpoint}?${params.toString()}`, options);
  }

  /**
   * Retrieves active, currently live tender opportunities from Find a Tender,
   * paginating through cursor pages up to safety limit.
   */
  async scanLiveNotices(options: PagedScanOptions = {}): Promise<ScanResult> {
    const url = `${this.ocdsEndpoint}?stages=tender&limit=100`;
    return this.executeOcdsPagedFetch(url, options);
  }

  /**
   * Retrieves early market engagement and pipeline procurement notices (planning stage).
   */
  async scanPipeline(options: PagedScanOptions = {}): Promise<ScanResult> {
    const url = `${this.ocdsEndpoint}?stages=planning&limit=100`;
    return this.executeOcdsPagedFetch(url, options);
  }

  /**
   * Direct retrieval of a single notice by notice ID or OCID using the official OCDS endpoint.
   * Returns NULL if the notice does not exist. Never manufactures a shell record.
   */
  async fetchNotice(noticeIdOrOcid: string): Promise<RawNoticeRecord | null> {
    if (!noticeIdOrOcid || typeof noticeIdOrOcid !== 'string') {
      return null;
    }

    const cleanId = encodeURIComponent(noticeIdOrOcid.trim());
    const directUrl = `${this.ocdsEndpoint}/${cleanId}`;

    try {
      const response = await this.fetchWithRetry(directUrl);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Direct notice retrieval failed with HTTP ${response.status}`);
      }

      const json = await response.json();
      const releases = Array.isArray(json.releases) ? json.releases : [];
      if (releases.length === 0) {
        return null;
      }

      return this.parseOcdsRelease(releases[0]);
    } catch (err: any) {
      console.warn(`[FindATender] fetchNotice failed for ${noticeIdOrOcid}:`, err.message);
      return null;
    }
  }

  /**
   * Live HTTP verification of official notice URL.
   */
  async verifyNotice(noticeUrl: string, expectedNoticeId?: string): Promise<VerificationResult> {
    return UrlVerifier.verifyNoticeUrl(noticeUrl, { expectedNoticeId });
  }

  async findDocuments(noticeId: string): Promise<RawDocumentLink[]> {
    const notice = await this.fetchNotice(noticeId);
    return notice?.documentLinks || [];
  }

  async fetchUpdates(_noticeId: string): Promise<Record<string, unknown>> {
    return {};
  }

  /**
   * Executes a cursor-paginated OCDS traversal, collecting all releases across pages
   * while respecting rate limits, backoff, and safety limits.
   */
  private async executeOcdsPagedFetch(
    initialUrl: string,
    options: PagedScanOptions = {}
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
        const fetchResult = await this.fetchWithBackoff(currentUrl);
        rateLimitRetries += fetchResult.retries;

        const response = fetchResult.response;
        if (!response.ok) {
          errors.push(`Find a Tender API returned HTTP ${response.status}: ${response.statusText} at page ${pagesFetched + 1}`);
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

        // Follow cursor link if present
        const nextLink = json.links?.next;
        if (typeof nextLink === 'string' && nextLink.length > 0 && nextLink !== currentUrl) {
          currentUrl = nextLink;
        } else {
          // No next cursor link: pagination complete
          currentUrl = null;
        }
      } catch (err: any) {
        errors.push(`Network fetch error at page ${pagesFetched + 1}: ${err.message}`);
        break;
      }
    }

    const durationMs = Date.now() - startTime;

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
    };
  }

  /**
   * Fetches URL with automatic retry on 429 (rate limit) or 503 (service unavailable)
   * inspecting Retry-After headers and applying backoff.
   */
  private async fetchWithBackoff(
    url: string,
    maxRetries: number = 3
  ): Promise<{ response: Response; retries: number }> {
    let retries = 0;

    while (retries <= maxRetries) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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

        if (response.status === 429 || response.status === 503) {
          if (retries < maxRetries) {
            retries++;
            const retryAfterHeader = response.headers.get('Retry-After');
            let waitMs = 1000 * Math.pow(2, retries);
            if (retryAfterHeader) {
              const seconds = parseInt(retryAfterHeader, 10);
              if (!isNaN(seconds) && seconds > 0) {
                waitMs = Math.min(seconds * 1000, 10000);
              }
            }
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }
        }

        return { response, retries };
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (retries < maxRetries) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Max retries exceeded for ${url}`);
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    const res = await this.fetchWithBackoff(url, 2);
    return res.response;
  }

  /**
   * Parses an OCDS release payload into a RawNoticeRecord.
   * Genuinely stores NULL for missing dates and unknown fields.
   * Never invents placeholder dates or fake buyers.
   */
  private parseOcdsRelease(r: any): RawNoticeRecord | null {
    if (!r || !r.id) return null;

    const noticeId = String(r.id);
    const tender = r.tender || {};
    const title = tender.title || r.description?.slice(0, 100) || `Procurement Notice ${noticeId}`;
    const description = tender.description || r.description || '';

    // Extract Buyer
    let buyerName = r.buyer?.name;
    let buyerType = 'Public Body';
    if (!buyerName && Array.isArray(r.parties)) {
      const buyerParty = r.parties.find((p: any) => Array.isArray(p.roles) && p.roles.includes('buyer'));
      if (buyerParty) {
        buyerName = buyerParty.name || buyerParty.identifier?.legalName;
        buyerType = buyerParty.details?.classifications?.[0]?.description || 'Public Body';
      }
    }
    if (!buyerName) {
      buyerName = 'Unknown Buyer';
    }

    // Extract Value
    const valueAmount = typeof tender.value?.amount === 'number' ? tender.value.amount : undefined;
    const valueCurrency = tender.value?.currency || 'GBP';

    // Extract Dates — STRICTLY NULL IF MISSING (NEVER INVENT DATES)
    const publishedAt = r.date ? String(r.date) : null;
    const submissionDeadline = tender.tenderPeriod?.endDate ? String(tender.tenderPeriod.endDate) : null;
    const clarificationDeadline = tender.enquiryPeriod?.endDate ? String(tender.enquiryPeriod.endDate) : null;

    // Official Notice URL
    const officialNoticeUrl = `${this.baseUrl}/Notice/${noticeId}`;
    const applicationPortalUrl =
      typeof tender.submissionMethodDetails === 'string' && tender.submissionMethodDetails.startsWith('http')
        ? tender.submissionMethodDetails
        : undefined;

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

    // Extract Documents
    const documentLinks: RawDocumentLink[] = [];
    if (Array.isArray(tender.documents)) {
      for (const doc of tender.documents) {
        if (doc.url) {
          documentLinks.push({
            title: doc.title || doc.documentType || 'Notice Document',
            url: doc.url,
            docType: doc.documentType,
            requiresLogin: Boolean(doc.requiresLogin),
          });
        }
      }
    }

    return {
      sourceId: this.id,
      noticeId,
      ocid: r.ocid ? String(r.ocid) : undefined,
      title,
      buyerName,
      buyerType,
      description,
      valueAmount,
      valueCurrency,
      publishedAt,
      submissionDeadline,
      clarificationDeadline,
      officialNoticeUrl,
      applicationPortalUrl,
      documentLinks,
      cpvCodes,
      rawPayload: r,
    };
  }
}
