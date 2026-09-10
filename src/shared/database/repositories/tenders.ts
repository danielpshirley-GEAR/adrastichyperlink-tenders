// src/shared/database/repositories/tenders.ts
import { TenderSummary, Qualification, BidDecisionType } from '@/modules/public-tenders/types/tender';

// Live production state starts empty
let inMemoryTenders: TenderSummary[] = [];

export class TendersRepository {
  static async getAll(filter?: {
    qualification?: Qualification;
    isArchived?: boolean;
    tab?: string;
  }): Promise<TenderSummary[]> {
    let list = inMemoryTenders;

    if (filter?.isArchived !== undefined) {
      list = list.filter((t) => t.isArchived === filter.isArchived);
    }

    if (filter?.qualification) {
      list = list.filter((t) => t.qualification === filter.qualification);
    }

    return list;
  }

  static async getById(id: string): Promise<TenderSummary | null> {
    const found = inMemoryTenders.find((t) => t.id === id);
    return found || null;
  }

  static async save(tender: TenderSummary): Promise<TenderSummary> {
    const existingIndex = inMemoryTenders.findIndex((t) => t.id === tender.id || t.canonicalReference === tender.canonicalReference);
    if (existingIndex >= 0) {
      inMemoryTenders[existingIndex] = { ...inMemoryTenders[existingIndex], ...tender };
      return inMemoryTenders[existingIndex];
    }
    inMemoryTenders.push(tender);
    return tender;
  }

  static async setBidDecision(id: string, decision: BidDecisionType): Promise<TenderSummary | null> {
    const tender = inMemoryTenders.find((t) => t.id === id);
    if (!tender) return null;
    return tender;
  }

  static async clearAll(): Promise<void> {
    inMemoryTenders = [];
  }
}
