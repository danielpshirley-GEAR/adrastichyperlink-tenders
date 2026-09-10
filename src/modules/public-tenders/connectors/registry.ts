// src/modules/public-tenders/connectors/registry.ts
import { ProcurementConnector } from './types';
import { FindATenderConnector } from './find-a-tender';
import { SourcesRepository, SourceHealthStatus } from '@/shared/database/repositories/sources';

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

  public getSourcesMeta(): SourceMeta[] {
    try {
      const records = SourcesRepository.getAll();
      if (records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          name: r.name,
          baseUrl: r.baseUrl,
          portalType: r.portalType,
          health: r.healthStatus,
          lastScanAt: r.lastSuccessfulScanAt,
          noticesChecked: r.totalNoticesScanned,
          relevantFound: r.totalRelevantFound,
          scanFrequency: r.scanFrequency,
        }));
      }
    } catch {
      // fallback
    }

    return [
      {
        id: 'find_a_tender',
        name: 'Find a Tender (FTS)',
        baseUrl: 'https://www.find-tender.service.gov.uk',
        portalType: 'primary_ocds',
        health: 'healthy',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Mon, Wed, Fri 07:00',
      },
      {
        id: 'contracts_finder',
        name: 'Contracts Finder',
        baseUrl: 'https://www.contractsfinder.service.gov.uk',
        portalType: 'low_value',
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
        portalType: 'devolved_scotland',
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
        portalType: 'devolved_wales',
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
        portalType: 'healthcare',
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
        portalType: 'devolved_ni',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Daily 07:00',
      },
      {
        id: 'crown_commercial_service',
        name: 'Crown Commercial Service (CCS)',
        baseUrl: 'https://www.crowncommercial.gov.uk',
        portalType: 'frameworks',
        health: 'not_implemented',
        lastScanAt: null,
        noticesChecked: 0,
        relevantFound: 0,
        scanFrequency: 'Weekly',
      },
    ];
  }
}
