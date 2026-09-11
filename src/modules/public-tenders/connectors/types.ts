// src/modules/public-tenders/connectors/types.ts

export type VerificationGrade = 'A' | 'B' | 'C' | 'D' | 'X';

export interface VerificationResult {
  grade: VerificationGrade;
  isValid: boolean;
  httpStatus?: number;
  finalRedirectUrl?: string;
  titleMatches: boolean;
  buyerMatches: boolean;
  datesMatch: boolean;
  routeCorrect: boolean;
  notes: string;
  verifiedAt: string;
}

export interface RawDocumentLink {
  title: string;
  url: string;
  docType?: string;
  requiresLogin?: boolean;
}

export interface RawNoticeRecord {
  sourceId: string;
  noticeId: string;
  ocid?: string;
  title: string | null;
  buyerName: string | null;
  buyerType?: string;
  description: string;
  valueAmount?: number;
  valueCurrency?: string | null;
  publishedAt?: string | null;
  submissionDeadline?: string | null;
  clarificationDeadline?: string | null;
  officialNoticeUrl: string;
  applicationPortalUrl?: string;
  documentLinks: RawDocumentLink[];
  cpvCodes: string[];
  rawPayload: Record<string, unknown>;
}

export interface ScanResult {
  sourceId: string;
  scannedAt: string;
  noticesChecked: number;
  pagesFetched: number;
  apiRequestsMade: number;
  rateLimitRetries: number;
  durationMs: number;
  relevantCandidates: RawNoticeRecord[];
  errors: string[];
  paginationComplete?: boolean;
  truncatedBySafetyLimit?: boolean;
  nextCursorPresent?: boolean;
  nextCursorUrl?: string | null;
  earliestDate?: string | null;
  latestDate?: string | null;
}

export interface ProcurementConnector {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly portalType: string;

  scanNewNotices(since?: Date): Promise<ScanResult>;
  scanLiveNotices(): Promise<ScanResult>;
  scanPipeline(): Promise<ScanResult>;
  fetchNotice(noticeId: string): Promise<RawNoticeRecord | null>;
  verifyNotice(noticeUrl: string, expectedNoticeId?: string): Promise<VerificationResult>;
  findDocuments(noticeId: string): Promise<RawDocumentLink[]>;
  fetchUpdates(noticeId: string): Promise<Record<string, unknown>>;
}
