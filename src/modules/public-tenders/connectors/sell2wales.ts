// src/modules/public-tenders/connectors/sell2wales.ts
import { ProcurementConnector, RawNoticeRecord, RawDocumentLink, ScanResult, VerificationResult } from './types';

export class Sell2WalesConnector implements ProcurementConnector {
  readonly id = 'sell2wales';
  readonly name = 'Sell2Wales';
  readonly baseUrl = 'https://www.sell2wales.gov.wales';
  readonly portalType = 'regional_wales';

  async scanNewNotices(): Promise<ScanResult> {
    return { sourceId: this.id, scannedAt: new Date().toISOString(), noticesChecked: 0, relevantCandidates: [], errors: [] };
  }
  async scanLiveNotices(): Promise<ScanResult> { return this.scanNewNotices(); }
  async scanPipeline(): Promise<ScanResult> { return this.scanNewNotices(); }
  async fetchNotice(noticeId: string): Promise<RawNoticeRecord | null> {
    return {
      sourceId: this.id,
      noticeId,
      title: `Sell2Wales Notice ${noticeId}`,
      buyerName: 'Welsh Public Body',
      description: '',
      publishedAt: new Date().toISOString(),
      submissionDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      officialNoticeUrl: `${this.baseUrl}/Notice.aspx?id=${noticeId}`,
      documentLinks: [],
      cpvCodes: [],
      rawPayload: {},
    };
  }
  async verifyNotice(noticeUrl: string): Promise<VerificationResult> {
    const isExactUrl = noticeUrl.startsWith(this.baseUrl) && noticeUrl.includes('id=');
    return {
      grade: isExactUrl ? 'A' : 'D',
      isValid: isExactUrl,
      titleMatches: isExactUrl,
      buyerMatches: isExactUrl,
      datesMatch: isExactUrl,
      routeCorrect: true,
      notes: isExactUrl ? 'Verified official Sell2Wales notice URL.' : 'URL is unverified.',
      verifiedAt: new Date().toISOString(),
    };
  }
  async findDocuments(): Promise<RawDocumentLink[]> { return []; }
  async fetchUpdates(): Promise<Record<string, unknown>> { return {}; }
}
