// src/shared/database/repositories/sources.ts
import { SourceRegistry, SourceMeta } from '@/modules/public-tenders/connectors/registry';

export class SourcesRepository {
  static getSources(): SourceMeta[] {
    return SourceRegistry.getInstance().getSourcesMeta();
  }

  static getSourceCount(): number {
    return SourceRegistry.getInstance().getAll().length;
  }
}
