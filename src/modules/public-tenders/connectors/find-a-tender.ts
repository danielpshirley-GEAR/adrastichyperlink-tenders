// src/modules/public-tenders/connectors/find-a-tender.ts
import { ProcurementConnector, RawNoticeRecord, RawDocumentLink, ScanResult, VerificationResult } from './types';
import { UrlVerifier } from '../services/url-verifier';

export class FindATenderConnector implements ProcurementConnector {
  readonly id = 'find_a_tender';
  readonly name = 'Find a Tender (FTS)';
  readonly baseUrl = 'https://www.find-tender.service.gov.uk';
  readonly portalType = 'primary_ocds';
  private readonly ocdsEndpoint = 'https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages';

  /**
   * Genuine OCDS scan retrieving notices published or updated since the supplied date.
   */
  async scanNewNotices(since?: Date): Promise<ScanResult> {
    const params = new URLSearchParams();
    params.set('stages', 'tender');
    params.set('limit', '100');

    if (since instanceof Date && !isNaN(since.getTime())) {
      // Find a Tender accepts updatedFrom in ISO format (without milliseconds/timezone)
      const iso = since.toISOString().slice(0, 19);
      params.set('updatedFrom', iso);
    }

    return this.executeOcdsFetch(`${this.ocdsEndpoint}?${params.toString()}`);
  }

  /**
   * Retrieves active, currently live tender opportunities from Find a Tender.
   */
  async scanLiveNotices(): Promise<ScanResult> {
    const url = `${this.ocdsEndpoint}?stages=tender&limit=100`;
    return this.executeOcdsFetch(url);
  }

  /**
   * Retrieves early market engagement and pipeline procurement notices (planning stage).
   */
  async scanPipeline(): Promise<ScanResult> {
    const url = `${this.ocdsEndpoint}?stages=planning&limit=50`;
    return this.executeOcdsFetch(url);
  }

  /**
   * Fetches full details for a single notice.
   */
  async fetchNotice(noticeId: string): Promise<RawNoticeRecord | null> {
    const liveScan = await this.scanLiveNotices();
    const match = liveScan.relevantCandidates.find((c) => c.noticeId === noticeId);
    if (match) return match;

    const noticeUrl = `${this.baseUrl}/Notice/${noticeId}`;
    return {
      sourceId: this.id,
      noticeId,
      title: `Notice ${noticeId}`,
      buyerName: 'Unknown Buyer',
      description: '',
      publishedAt: '',
      submissionDeadline: '',
      officialNoticeUrl: noticeUrl,
      documentLinks: [],
      cpvCodes: [],
      rawPayload: {},
    };
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

  private async executeOcdsFetch(url: string): Promise<ScanResult> {
    const scannedAt = new Date().toISOString();
    const errors: string[] = [];

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Adrastichyperlink-TenderEngine/2.0 (Procurement Bot; contact@adrastichyperlink.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`Find a Tender API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const releases = Array.isArray(json.releases) ? json.releases : [];
      const candidates: RawNoticeRecord[] = [];

      for (const r of releases) {
        try {
          const parsed = this.parseOcdsRelease(r);
          if (parsed) {
            candidates.push(parsed);
          }
        } catch (err: any) {
          errors.push(`Notice parse error for release ${r.id}: ${err.message}`);
        }
      }

      return {
        sourceId: this.id,
        scannedAt,
        noticesChecked: releases.length,
        relevantCandidates: candidates,
        errors,
      };
    } catch (err: any) {
      return {
        sourceId: this.id,
        scannedAt,
        noticesChecked: 0,
        relevantCandidates: [],
        errors: [err.message],
      };
    }
  }

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

    // Extract Dates
    const publishedAt = r.date || '';
    const submissionDeadline = tender.tenderPeriod?.endDate || '';
    const clarificationDeadline = tender.enquiryPeriod?.endDate || undefined;

    // Official Notice URL
    const officialNoticeUrl = `${this.baseUrl}/Notice/${noticeId}`;
    const applicationPortalUrl = typeof tender.submissionMethodDetails === 'string' && tender.submissionMethodDetails.startsWith('http')
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
      ocid: r.ocid,
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
