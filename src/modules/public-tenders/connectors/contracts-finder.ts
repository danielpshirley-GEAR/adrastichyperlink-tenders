// src/modules/public-tenders/connectors/contracts-finder.ts
import { ProcurementConnector, RawNoticeRecord, RawDocumentLink, ScanResult, VerificationResult } from './types';

export class ContractsFinderConnector implements ProcurementConnector {
  readonly id = 'contracts_finder';
  readonly name = 'Contracts Finder';
  readonly baseUrl = 'https://www.contractsfinder.service.gov.uk';
  readonly portalType = 'low_value_and_central_gov';

  async scanNewNotices(_since?: Date): Promise<ScanResult> {
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
      notes: 'Contracts Finder connector pending implementation in Phase 3.',
      verifiedAt: new Date().toISOString(),
    };
  }

  async findDocuments(_noticeId: string): Promise<RawDocumentLink[]> {
    return [];
  }

  async fetchUpdates(_noticeId: string): Promise<Record<string, unknown>> {
    return {};
  }
}
