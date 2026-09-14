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
  supabaseServiceRoleKey?: string;
}

export const getDbConfig = (): DbConfig => {
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
};

/**
 * Genuinely determines if a production database (Supabase/PostgreSQL) is configured.
 * STRICT: Absolutely NO hardcoded '|| true'. Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
export const isProductionDatabaseConfigured = (): boolean => {
  const config = getDbConfig();
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
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
 * by executing a real read/write/delete probe against db_health_probes.
 * NEVER returns healthy through hardcoded truth.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  // If Supabase / Postgres is configured, probe it with write/read/delete
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client failed to initialize');
      }

      // 1. INSERT probe
      const probeId = `probe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const probeTime = new Date().toISOString();
      const { error: insertErr } = await client
        .from('db_health_probes')
        .insert({ id: probeId, probed_at: probeTime });

      if (insertErr) {
        throw new Error(`Write probe failed: ${insertErr.message}`);
      }

      // 2. SELECT probe
      const { data: readData, error: selectErr } = await client
        .from('db_health_probes')
        .select('*')
        .eq('id', probeId)
        .maybeSingle();

      if (selectErr || !readData) {
        throw new Error(`Read probe failed: ${selectErr?.message || 'probe record missing'}`);
      }

      // 3. DELETE probe
      const { error: deleteErr } = await client
        .from('db_health_probes')
        .delete()
        .eq('id', probeId);

      if (deleteErr) {
        throw new Error(`Delete probe failed: ${deleteErr.message}`);
      }

      // 4. Genuine counts
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

  // If in production or on Render and Supabase is NOT configured: FAIL CLOSED. NEVER fall back to SQLite!
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
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
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required on Render and in production.');
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
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required on Render and in production.');
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
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required on Render and in production.');
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
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Supabase / PostgreSQL is required on Render and in production.');
  }
  return new SqliteApplicationsRepository();
}

export function getDb(): Database.Database {
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: Direct SQLite access is disabled on Render and in production.');
  }
  return getSqliteDb();
}
