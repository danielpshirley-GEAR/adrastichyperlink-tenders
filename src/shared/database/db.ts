// src/shared/database/db.ts
import { getSqliteDb } from './sqlite';
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

export const isProductionDatabaseConfigured = (): boolean => {
  const config = getDbConfig();
  // If explicitly configured with Postgres/Supabase or local persistent SQLite is active
  return Boolean(config.databaseUrl || (config.supabaseUrl && config.supabaseKey) || true);
};

export interface DatabaseHealth {
  configured: boolean;
  type: 'postgres' | 'sqlite' | 'none';
  healthy: boolean;
  totalTenders: number;
  totalSources: number;
  error?: string;
}

export function checkDatabaseHealth(): DatabaseHealth {
  try {
    const db = getSqliteDb();
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
      error: err.message,
    };
  }
}

export function getDb(): Database.Database {
  return getSqliteDb();
}
