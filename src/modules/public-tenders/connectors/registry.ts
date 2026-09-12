// src/modules/public-tenders/connectors/registry.ts
import { ProcurementConnector } from './types';
import { FindATenderConnector } from './find-a-tender';
import { getSourcesRepository } from '@/shared/database/db';
import { SourceHealthStatus } from '@/shared/database/repositories/sources';

export interface SourceMeta {
  id: string;
  name: string;
  baseUrl: string;
  portalType: string;
  health: SourceHealthStatus;
  lastScanAt: string | null;
  noticesChecked: number;
  relevantFound: number;
  scanFrequency: string;
}

export class SourceRegistry {
  private static instance: SourceRegistry;
  private connectors: Map<string, ProcurementConnector> = new Map();

  private constructor() {
    // In Phase 2, Find a Tender is the ONLY implemented connector.
    this.register(new FindATenderConnector());
  }

  public static getInstance(): SourceRegistry {
    if (!SourceRegistry.instance) {
      SourceRegistry.instance = new SourceRegistry();
    }
    return SourceRegistry.instance;
  }

  public register(connector: ProcurementConnector): void {
    this.connectors.set(connector.id, connector);
  }

  public get(sourceId: string): ProcurementConnector | undefined {
    return this.connectors.get(sourceId);
  }

  public getAll(): ProcurementConnector[] {
    return Array.from(this.connectors.values());
  }

  public async getSourcesMeta(): Promise<SourceMeta[]> {
    const canonicalSources: SourceMeta[] = [
      {
        id: 'find_a_tender',
        name: 'Find a Tender (FTS)',
        baseUrl: 'https://www.find-tender.service.gov.uk',
        portalType: 'High-value UK public sector (>£138k/£140k)',
        health: 'untested',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Mon, Wed, Fri 07:00',
      },
      {
        id: 'contracts_finder',
        name: 'Contracts Finder',
        baseUrl: 'https://www.contractsfinder.service.gov.uk',
        portalType: 'England & non-devolved (>£12k central, >£30k local)',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Daily 06:00',
      },
      {
        id: 'public_contracts_scotland',
        name: 'Public Contracts Scotland (PCS)',
        baseUrl: 'https://www.publiccontractsscotland.gov.uk',
        portalType: 'Scottish public procurement',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Daily 07:00',
      },
      {
        id: 'sell2wales',
        name: 'Sell2Wales',
        baseUrl: 'https://www.sell2wales.gov.wales',
        portalType: 'Welsh public procurement',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Daily 07:00',
      },
      {
        id: 'nhs_atamis',
        name: 'Health Family e-Procurement (Atamis)',
        baseUrl: 'https://health-family.force.com/s/Welcome',
        portalType: 'Healthcare & NHS commercial opportunities',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Daily 08:00',
      },
      {
        id: 'mod_dsp',
        name: 'MOD Defence Sourcing Portal (DSP)',
        baseUrl: 'https://www.contracts.mod.uk',
        portalType: 'Defence & security procurement',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Daily 08:00',
      },
      {
        id: 'etenders_ni',
        name: 'eTendersNI',
        baseUrl: 'https://etendersni.gov.uk',
        portalType: 'Northern Ireland public sector',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Daily 07:00',
      },
    ];

    try {
      const sourcesRepo = getSourcesRepository();
      const records = await sourcesRepo.getAll();
      if (records && records.length > 0) {
        const recordMap = new Map(records.map((r) => [r.id, r]));
        return canonicalSources.map((cs) => {
          const matched = recordMap.get(cs.id) || recordMap.get(cs.id.replace(/_/g, '-'));
          if (matched) {
            return {
              id: cs.id,
              name: matched.name || cs.name,
              baseUrl: matched.baseUrl || cs.baseUrl,
              portalType: cs.portalType || matched.portalType,
              health: matched.healthStatus as SourceHealthStatus,
              lastScanAt: matched.lastSuccessfulScanAt,
              noticesChecked: matched.totalNoticesScanned ?? 0,
              relevantFound: matched.totalRelevantFound ?? 0,
              scanFrequency: matched.scanFrequency || cs.scanFrequency,
            };
          }
          return cs;
        });
      }
    } catch {
      // fallback
    }

    return canonicalSources;
  }
}
