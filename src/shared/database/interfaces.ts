// src/shared/database/interfaces.ts
import { TenderSummary, Qualification, VerificationGrade, BidDecisionType } from '@/modules/public-tenders/types/tender';
import { SourceRecord, ScanRunRecord } from './repositories/sources';

export interface ITendersRepository {
  getAll(tab?: string, options?: { limit?: number; offset?: number }): Promise<TenderSummary[]>;
  getById(id: string): Promise<TenderSummary | null>;
  getByCanonicalReference(ref: string): Promise<TenderSummary | null>;
  getByOcid(ocid: string): Promise<TenderSummary | null>;
  save(tender: Partial<TenderSummary> & { canonicalReference: string; title: string; buyerName: string }): Promise<TenderSummary>;
  setBidDecision(id: string, decision: BidDecisionType, reasoning?: string): Promise<boolean>;
  countByTab(): Promise<Record<string, number>>;
}

export interface ISourcesRepository {
  getAll(): Promise<SourceRecord[]>;
  getById(id: string): Promise<SourceRecord | null>;
  updateHealth(
    id: string,
    status: string,
    stats?: {
      lastScanError?: string | null;
      noticesScannedDelta?: number;
      relevantFoundDelta?: number;
      successful?: boolean;
    }
  ): Promise<void>;
  recordScanRun(run: Omit<ScanRunRecord, 'id' | 'startedAt'> & { id?: string; startedAt?: string }): Promise<ScanRunRecord>;
  recordSourceNotice(
    sourceId: string,
    noticeId: string,
    rawJson: any,
    noticeUrl: string,
    tenderId?: string | null,
    publishedDate?: string | null,
    closingDate?: string | null,
    noticeType?: string | null,
    ocid?: string | null
  ): Promise<{ id: string; version: number; isDuplicate: boolean }>;
  recordSourceLink(
    tenderId: string,
    sourceId: string,
    sourceUrl: string,
    urlType: string,
    verificationGrade: string,
    httpStatus: number | null,
    finalRedirectUrl: string | null,
    notes: string | null
  ): Promise<void>;
  linkSourceNoticesToTender(tenderId: string, noticeId: string, ocid?: string): Promise<void>;
}

export interface IBuyersRepository {
  getOrCreate(name: string, data?: { buyerType?: string; website?: string }): Promise<{ id: string; name: string }>;
}

export interface IApplicationsRepository {
  getAll(): Promise<any[]>;
  getById(id: string): Promise<any | null>;
  createFromTender(tenderId: string): Promise<any>;
}
