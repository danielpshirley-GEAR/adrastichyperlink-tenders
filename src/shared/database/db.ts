// src/shared/database/db.ts
// Database interface supporting PostgreSQL, Supabase, and resilient in-memory state

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
  return Boolean(config.databaseUrl || (config.supabaseUrl && config.supabaseKey));
};
