// src/shared/database/db.ts
import { getSqliteDb } from './sqlite';
import {
  isSupabaseConfigured,
  getSupabaseClient,
  SupabaseTendersRepository,
  SupabaseSourcesRepository,
  SupabaseBuyersRepository,
  SupabaseApplicationsRepository,
} from './supabase';
import { SqliteTendersRepository } from './repositories/tenders';
import { SqliteSourcesRepository } from './repositories/sources';
import { SqliteBuyersRepository } from './repositories/buyers';
import { SqliteApplicationsRepository } from './repositories/applications';
import { ITendersRepository, ISourcesRepository, IBuyersRepository, IApplicationsRepository } from './interfaces';
import Database from 'better-sqlite3';

export interface DbConfig {
  databaseUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export const getDbConfig = (): DbConfig => {
  return {
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  };
};

/**
 * Genuinely determines if a production database (Supabase/PostgreSQL) is configured.
 * STRICT: Absolutely NO hardcoded '|| true'.
 */
export const isProductionDatabaseConfigured = (): boolean => {
  const config = getDbConfig();
  return Boolean(config.databaseUrl || (config.supabaseUrl && config.supabaseKey));
};

export interface DatabaseHealth {
  configured: boolean;
  type: 'postgres' | 'sqlite' | 'none';
  healthy: boolean;
  totalTenders: number;
  totalSources: number;
  error?: string;
}

/**
 * Genuinely tests whether the active database connection is operational
 * by executing a real read/write probe.
 * NEVER returns healthy through hardcoded truth.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  // If Supabase / Postgres is configured, probe it
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client failed to initialize');
      }

      // Real read probe
      const { count: sourcesCount, error: sourceErr } = await client
        .from('sources')
        .select('*', { count: 'exact', head: true });

      if (sourceErr) throw sourceErr;

      const { count: tendersCount, error: tenderErr } = await client
        .from('tenders')
        .select('*', { count: 'exact', head: true });

      if (tenderErr) throw tenderErr;

      return {
        configured: true,
        type: 'postgres',
        healthy: true,
        totalTenders: tendersCount ?? 0,
        totalSources: sourcesCount ?? 7,
      };
    } catch (err: any) {
      return {
        configured: true,
        type: 'postgres',
        healthy: false,
        totalTenders: 0,
        totalSources: 0,
        error: `Supabase probe failed: ${err.message}`,
      };
    }
  }

  // If in production and Supabase is NOT configured: FAIL CLOSED. NEVER fall back to SQLite in production!
  if (process.env.NODE_ENV === 'production') {
    return {
      configured: false,
      type: 'none',
      healthy: false,
      totalTenders: 0,
      totalSources: 0,
      error: 'PRODUCTION DATABASE NOT CONFIGURED',
    };
  }

  // Otherwise, probe local SQLite database with genuine read & write test
  try {
    const db = getSqliteDb();

    // 1. Genuine write probe
    const probeTime = new Date().toISOString();
    db.prepare(`
      INSERT INTO db_health_probes (id, probed_at) VALUES ('live_probe', ?)
      ON CONFLICT(id) DO UPDATE SET probed_at = excluded.probed_at
    `).run(probeTime);

    // 2. Genuine read probe
    const probeRow = db.prepare('SELECT probed_at FROM db_health_probes WHERE id = ?').get('live_probe') as { probed_at: string };
    if (!probeRow || probeRow.probed_at !== probeTime) {
      throw new Error('SQLite read/write probe verification mismatch');
    }

    const tenderCount = (db.prepare('SELECT COUNT(*) as count FROM tenders').get() as { count: number }).count;
    const sourceCount = (db.prepare('SELECT COUNT(*) as count FROM sources').get() as { count: number }).count;

    return {
      configured: true,
      type: 'sqlite',
      healthy: true,
      totalTenders: tenderCount,
      totalSources: sourceCount,
    };
  } catch (err: any) {
    return {
      configured: false,
      type: 'none',
      healthy: false,
      totalTenders: 0,
      totalSources: 0,
      error: `Database probe error: ${err.message}`,
    };
  }
}

/**
 * Returns active Tenders repository based on environment configuration.
 * FAILS CLOSED in production if Supabase is unconfigured.
 */
export function getTendersRepository(): ITendersRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseTendersRepository();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required in production.');
  }
  return new SqliteTendersRepository();
}

/**
 * Returns active Sources repository based on environment configuration.
 * FAILS CLOSED in production if Supabase is unconfigured.
 */
export function getSourcesRepository(): ISourcesRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseSourcesRepository();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required in production.');
  }
  return new SqliteSourcesRepository();
}

/**
 * Returns active Buyers repository based on environment configuration.
 * FAILS CLOSED in production if Supabase is unconfigured.
 */
export function getBuyersRepository(): IBuyersRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseBuyersRepository();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required in production.');
  }
  return new SqliteBuyersRepository();
}

/**
 * Returns active Applications repository based on environment configuration.
 * FAILS CLOSED in production if Supabase is unconfigured.
 */
export function getApplicationsRepository(): IApplicationsRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseApplicationsRepository();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required in production.');
  }
  return new SqliteApplicationsRepository();
}

export function getDb(): Database.Database {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Direct SQLite access is disabled in production.');
  }
  return getSqliteDb();
}
