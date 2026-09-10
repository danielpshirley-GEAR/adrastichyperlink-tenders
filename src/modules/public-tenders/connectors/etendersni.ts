// src/modules/public-tenders/connectors/etendersni.ts
import { ProcurementConnector, RawNoticeRecord, RawDocumentLink, ScanResult, VerificationResult } from './types';

export class ETendersNIConnector implements ProcurementConnector {
  readonly id = 'etenders_ni';
  readonly name = 'eTendersNI';
  readonly baseUrl = 'https://etendersni.gov.uk';
  readonly portalType = 'regional_northern_ireland';

  async scanNewNotices(): Promise<ScanResult> {
    return {
      sourceId: this.id,
      scannedAt: new Date().toISOString(),
      noticesChecked: 0,
      pagesFetched: 0,
      apiRequestsMade: 0,
      rateLimitRetries: 0,
      durationMs: 0,
      relevantCandidates: [],
      errors: ['Connector not implemented in Phase 2.1'],
    };
  }

  async scanLiveNotices(): Promise<ScanResult> {
    return this.scanNewNotices();
  }

  async scanPipeline(): Promise<ScanResult> {
    return this.scanNewNotices();
  }

  async fetchNotice(_noticeId: string): Promise<RawNoticeRecord | null> {
    return null;
  }

  async verifyNotice(_noticeUrl: string): Promise<VerificationResult> {
    return {
      grade: 'D',
      isValid: false,
      httpStatus: 0,
      titleMatches: false,
      buyerMatches: false,
      datesMatch: false,
      routeCorrect: false,
      notes: 'eTendersNI connector pending implementation in Phase 3.',
      verifiedAt: new Date().toISOString(),
    };
  }

  async findDocuments(): Promise<RawDocumentLink[]> {
    return [];
  }

  async fetchUpdates(): Promise<Record<string, unknown>> {
    return {};
  }
}
