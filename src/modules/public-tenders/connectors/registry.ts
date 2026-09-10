// src/modules/public-tenders/connectors/registry.ts
import { ProcurementConnector } from './types';
import { FindATenderConnector } from './find-a-tender';
import { ContractsFinderConnector } from './contracts-finder';
import { PublicContractsScotlandConnector } from './public-contracts-scotland';
import { Sell2WalesConnector } from './sell2wales';
import { NhsAtamisConnector } from './nhs-atamis';
import { ETendersNIConnector } from './etendersni';
import { ModDspConnector } from './mod-dsp';

export interface SourceMeta {
  id: string;
  name: string;
  baseUrl: string;
  portalType: string;
  health: 'healthy' | 'degraded' | 'error';
  lastScanAt: string | null;
  noticesChecked: number;
  relevantFound: number;
  scanFrequency: string;
}

export class SourceRegistry {
  private static instance: SourceRegistry;
  private connectors: Map<string, ProcurementConnector> = new Map();

  private constructor() {
    this.register(new FindATenderConnector());
    this.register(new ContractsFinderConnector());
    this.register(new PublicContractsScotlandConnector());
    this.register(new Sell2WalesConnector());
    this.register(new NhsAtamisConnector());
    this.register(new ETendersNIConnector());
    this.register(new ModDspConnector());
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
    return this.getAll().map((c) => ({
      id: c.id,
      name: c.name,
      baseUrl: c.baseUrl,
      portalType: c.portalType,
      health: 'healthy',
      lastScanAt: null,
      noticesChecked: 0,
      relevantFound: 0,
      scanFrequency: 'Mon, Wed, Fri 07:00',
    }));
  }
}
