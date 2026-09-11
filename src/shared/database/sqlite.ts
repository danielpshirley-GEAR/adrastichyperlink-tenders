// src/shared/database/sqlite.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'adrastichyperlink.db');

let dbInstance: Database.Database | null = null;

export function getSqliteDb(): Database.Database {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PRODUCTION DATABASE NOT CONFIGURED: SQLite is strictly forbidden in production. Supabase / PostgreSQL must be configured.');
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  initializeTables(dbInstance);
  runMigrations(dbInstance);
  seedSources(dbInstance);

  return dbInstance;
}

function initializeTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      portal_type TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_endpoint TEXT,
      health_status TEXT NOT NULL DEFAULT 'untested',
      last_successful_scan_at TEXT,
      last_attempt_at TEXT,
      last_scan_error TEXT,
      total_notices_scanned INTEGER NOT NULL DEFAULT 0,
      total_relevant_found INTEGER NOT NULL DEFAULT 0,
      scan_frequency_cron TEXT DEFAULT '0 7 * * 1,3,5',
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scan_runs (
      id TEXT PRIMARY KEY,
      scan_type TEXT NOT NULL,
      source_id TEXT REFERENCES sources(id),
      status TEXT NOT NULL DEFAULT 'running',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      notices_checked INTEGER NOT NULL DEFAULT 0,
      initial_candidates INTEGER NOT NULL DEFAULT 0,
      ai_relevant INTEGER NOT NULL DEFAULT 0,
      strong_count INTEGER NOT NULL DEFAULT 0,
      possible_count INTEGER NOT NULL DEFAULT 0,
      weak_count INTEGER NOT NULL DEFAULT 0,
      duplicates_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      log_details TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS buyers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      buyer_type TEXT NOT NULL DEFAULT 'other',
      website TEXT,
      contact_email TEXT,
      procurement_portal TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tenders (
      id TEXT PRIMARY KEY,
      canonical_reference TEXT UNIQUE NOT NULL,
      latest_notice_id TEXT,
      ocid TEXT,
      title TEXT,
      plain_english_summary TEXT,
      buyer_id TEXT REFERENCES buyers(id),
      buyer_name TEXT,
      value_amount REAL,
      value_currency TEXT,
      value_description TEXT,
      published_at TEXT,
      submission_deadline TEXT,
      clarification_deadline TEXT,
      contract_start_at TEXT,
      contract_end_at TEXT,
      discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      qualification TEXT NOT NULL DEFAULT 'POSSIBLE',
      deterministic_result TEXT,
      ai_result TEXT,
      final_qualification TEXT,
      lifecycle_status TEXT NOT NULL DEFAULT 'ACTIVE',
      verification_grade TEXT NOT NULL DEFAULT 'D',
      official_notice_url TEXT NOT NULL,
      application_portal_url TEXT,
      service_tags TEXT DEFAULT '[]',
      is_archived INTEGER NOT NULL DEFAULT 0,
      archived_reason TEXT,
      bid_decision_state TEXT NOT NULL DEFAULT 'UNDECIDED',
      evaluation_criteria TEXT DEFAULT '[]',
      requirements TEXT DEFAULT '[]',
      documents TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS source_notices (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES sources(id),
      notice_id TEXT NOT NULL,
      ocid TEXT,
      content_hash TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      tender_id TEXT REFERENCES tenders(id),
      raw_notice_json TEXT NOT NULL,
      notice_url TEXT NOT NULL,
      published_date TEXT,
      closing_date TEXT,
      notice_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tender_source_links (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
      source_id TEXT NOT NULL REFERENCES sources(id),
      source_url TEXT NOT NULL,
      url_type TEXT NOT NULL,
      verification_grade TEXT NOT NULL,
      http_status INTEGER,
      final_redirect_url TEXT,
      verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      verification_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS bid_decisions (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL UNIQUE REFERENCES tenders(id) ON DELETE CASCADE,
      decision TEXT NOT NULL,
      reasoning TEXT,
      decided_at TEXT NOT NULL DEFAULT (datetime('now')),
      gemini_recommendation TEXT,
      gemini_reasoning TEXT,
      capability_fit_score REAL,
      bid_effort TEXT DEFAULT 'MEDIUM',
      commercial_value_assessment TEXT,
      decision_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_source_notices_unique_release ON source_notices (source_id, notice_id, content_hash);
    CREATE INDEX IF NOT EXISTS idx_source_notices_ocid ON source_notices (ocid);
    CREATE INDEX IF NOT EXISTS idx_tenders_ocid ON tenders (ocid);
    CREATE INDEX IF NOT EXISTS idx_tenders_canonical_ref ON tenders (canonical_reference);

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL UNIQUE REFERENCES tenders(id) ON DELETE CASCADE,
      tender_title TEXT NOT NULL,
      canonical_reference TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      submission_deadline TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      bid_decision TEXT NOT NULL DEFAULT 'BID',
      overall_suitability_score INTEGER NOT NULL DEFAULT 0,
      win_themes TEXT DEFAULT '[]',
      questions_count INTEGER NOT NULL DEFAULT 0,
      facts_required_count INTEGER NOT NULL DEFAULT 0,
      questions TEXT DEFAULT '[]',
      last_updated TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_sections (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      weighting_percentage REAL,
      word_limit INTEGER,
      status TEXT NOT NULL DEFAULT 'draft',
      assigned_to TEXT,
      version_number INTEGER NOT NULL DEFAULT 1,
      response_content TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_facts (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      fact_type TEXT NOT NULL,
      fact_key TEXT NOT NULL,
      fact_value TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'unverified',
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_blockers (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      resolution TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS db_health_probes (
      id TEXT PRIMARY KEY,
      probed_at TEXT NOT NULL
    );
  `);
}

function runMigrations(db: Database.Database): void {
  // Gracefully add missing columns if upgrading an existing SQLite database
  const columnsToAdd = [
    { table: 'sources', column: 'last_attempt_at', type: 'TEXT' },
    { table: 'tenders', column: 'deterministic_result', type: 'TEXT' },
    { table: 'tenders', column: 'ai_result', type: 'TEXT' },
    { table: 'tenders', column: 'final_qualification', type: 'TEXT' },
    { table: 'tenders', column: 'lifecycle_status', type: "TEXT DEFAULT 'ACTIVE'" },
    { table: 'tenders', column: 'latest_notice_id', type: 'TEXT' },
    { table: 'tenders', column: 'archived_reason', type: 'TEXT' },
    { table: 'source_notices', column: 'ocid', type: 'TEXT' },
    { table: 'source_notices', column: 'content_hash', type: 'TEXT' },
    { table: 'source_notices', column: 'version', type: 'INTEGER DEFAULT 1' },
    { table: 'applications', column: 'tender_title', type: 'TEXT' },
    { table: 'applications', column: 'canonical_reference', type: 'TEXT' },
    { table: 'applications', column: 'buyer_name', type: 'TEXT' },
    { table: 'applications', column: 'bid_decision', type: "TEXT DEFAULT 'BID'" },
    { table: 'applications', column: 'overall_suitability_score', type: 'INTEGER' },
    { table: 'applications', column: 'win_themes', type: "TEXT DEFAULT '[]'" },
    { table: 'applications', column: 'questions_count', type: 'INTEGER DEFAULT 0' },
    { table: 'applications', column: 'facts_required_count', type: 'INTEGER DEFAULT 0' },
    { table: 'applications', column: 'questions', type: "TEXT DEFAULT '[]'" },
    { table: 'applications', column: 'last_updated', type: 'TEXT' },
  ];

  for (const { table, column, type } of columnsToAdd) {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      const exists = tableInfo.some((col) => col.name === column);
      if (!exists) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      }
    } catch {
      // Ignore migration errors if table doesn't exist yet
    }
  }

  // Migrate tenders table to permit NULL in published_at, submission_deadline, and buyer_name
  try {
    const tendersInfo = db.prepare('PRAGMA table_info(tenders)').all() as any[];
    const publishedAtCol = tendersInfo.find((col) => col.name === 'published_at');
    const buyerNameCol = tendersInfo.find((col) => col.name === 'buyer_name');
    if ((publishedAtCol && publishedAtCol.notnull === 1) || (buyerNameCol && buyerNameCol.notnull === 1)) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE tenders_v2 (
          id TEXT PRIMARY KEY,
          canonical_reference TEXT UNIQUE NOT NULL,
          latest_notice_id TEXT,
          ocid TEXT,
          title TEXT,
          plain_english_summary TEXT,
          buyer_id TEXT REFERENCES buyers(id),
          buyer_name TEXT,
          value_amount REAL,
          value_currency TEXT,
          value_description TEXT,
          published_at TEXT,
          submission_deadline TEXT,
          clarification_deadline TEXT,
          contract_start_at TEXT,
          contract_end_at TEXT,
          discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
          last_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
          qualification TEXT NOT NULL DEFAULT 'POSSIBLE',
          deterministic_result TEXT,
          ai_result TEXT,
          final_qualification TEXT,
          lifecycle_status TEXT NOT NULL DEFAULT 'ACTIVE',
          verification_grade TEXT NOT NULL DEFAULT 'D',
          official_notice_url TEXT NOT NULL,
          application_portal_url TEXT,
          service_tags TEXT DEFAULT '[]',
          is_archived INTEGER NOT NULL DEFAULT 0,
          bid_decision_state TEXT NOT NULL DEFAULT 'UNDECIDED',
          evaluation_criteria TEXT DEFAULT '[]',
          requirements TEXT DEFAULT '[]',
          documents TEXT DEFAULT '[]',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO tenders_v2 (
          id, canonical_reference, latest_notice_id, ocid, title, plain_english_summary,
          buyer_id, buyer_name, value_amount, value_currency, value_description,
          published_at, submission_deadline, clarification_deadline,
          contract_start_at, contract_end_at, discovered_at, last_verified_at,
          qualification, deterministic_result, ai_result, final_qualification,
          lifecycle_status, verification_grade, official_notice_url, application_portal_url,
          service_tags, is_archived, bid_decision_state, evaluation_criteria,
          requirements, documents, created_at, updated_at
        ) SELECT
          id, canonical_reference, COALESCE(latest_notice_id, canonical_reference), ocid, title, plain_english_summary,
          buyer_id, buyer_name, value_amount, value_currency, value_description,
          published_at, submission_deadline, clarification_deadline,
          contract_start_at, contract_end_at, discovered_at, last_verified_at,
          qualification, deterministic_result, ai_result, final_qualification,
          COALESCE(lifecycle_status, 'ACTIVE'), verification_grade, official_notice_url, application_portal_url,
          service_tags, is_archived, bid_decision_state, evaluation_criteria,
          requirements, documents, created_at, updated_at
        FROM tenders;

        DROP TABLE tenders;
        ALTER TABLE tenders_v2 RENAME TO tenders;
      `);
      db.pragma('foreign_keys = ON');
    }
  } catch (err: any) {
    console.error('Failed to migrate tenders table to nullable columns:', err.message);
  }

  // Migrate applications table to permit NULL in submission_deadline if legacy notnull constraint exists
  try {
    const appsInfo = db.prepare('PRAGMA table_info(applications)').all() as any[];
    const deadlineCol = appsInfo.find((col) => col.name === 'submission_deadline');
    if (deadlineCol && deadlineCol.notnull === 1) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE applications_v2 (
          id TEXT PRIMARY KEY,
          tender_id TEXT NOT NULL UNIQUE REFERENCES tenders(id) ON DELETE CASCADE,
          tender_title TEXT NOT NULL,
          canonical_reference TEXT NOT NULL,
          buyer_name TEXT NOT NULL,
          submission_deadline TEXT,
          status TEXT NOT NULL DEFAULT 'DRAFT',
          bid_decision TEXT NOT NULL DEFAULT 'BID',
          overall_suitability_score INTEGER,
          win_themes TEXT DEFAULT '[]',
          questions_count INTEGER NOT NULL DEFAULT 0,
          facts_required_count INTEGER NOT NULL DEFAULT 0,
          questions TEXT DEFAULT '[]',
          last_updated TEXT NOT NULL DEFAULT (datetime('now')),
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO applications_v2 (
          id, tender_id, tender_title, canonical_reference, buyer_name,
          submission_deadline, status, bid_decision, overall_suitability_score,
          win_themes, questions_count, facts_required_count, questions,
          last_updated, created_at
        ) SELECT
          id, tender_id, COALESCE(tender_title, 'Untitled Opportunity'), COALESCE(canonical_reference, 'REF-TBC'),
          COALESCE(buyer_name, 'Public Body'), submission_deadline, status,
          COALESCE(bid_decision, 'BID'), overall_suitability_score,
          COALESCE(win_themes, '[]'), COALESCE(questions_count, 0),
          COALESCE(facts_required_count, 0), COALESCE(questions, '[]'),
          COALESCE(last_updated, datetime('now')), COALESCE(created_at, datetime('now'))
        FROM applications;

        DROP TABLE applications;
        ALTER TABLE applications_v2 RENAME TO applications;
      `);
      db.pragma('foreign_keys = ON');
    }
  } catch {
    // Ignore migration error
  }

  // Create indexes after ensuring columns exist
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tenders_canonical ON tenders(canonical_reference);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tenders_ocid_unique ON tenders(ocid);
      CREATE INDEX IF NOT EXISTS idx_tenders_ocid ON tenders(ocid);
      CREATE INDEX IF NOT EXISTS idx_tenders_latest_notice_id ON tenders(latest_notice_id);
      CREATE INDEX IF NOT EXISTS idx_source_notices_lookup ON source_notices(source_id, notice_id);
      CREATE INDEX IF NOT EXISTS idx_source_notices_hash ON source_notices(source_id, notice_id, content_hash);
      CREATE INDEX IF NOT EXISTS idx_source_notices_tender ON source_notices(tender_id);
    `);
  } catch {
    // Non-fatal index creation
  }

  // Remove legacy Crown Commercial Service if it was seeded into sources
  try {
    db.exec(`DELETE FROM sources WHERE id = 'crown_commercial_service'`);
  } catch {
    // Ignore
  }
}

function seedSources(db: Database.Database): void {
  const insertSource = db.prepare(`
    INSERT OR IGNORE INTO sources (
      id, name, portal_type, base_url, api_endpoint, health_status, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const initialSources = [
    {
      id: 'find_a_tender',
      name: 'Find a Tender (FTS)',
      portal_type: 'primary_ocds',
      base_url: 'https://www.find-tender.service.gov.uk',
      api_endpoint: 'https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages',
      health_status: 'untested',
      is_active: 1,
    },
    {
      id: 'contracts_finder',
      name: 'Contracts Finder',
      portal_type: 'low_value',
      base_url: 'https://www.contractsfinder.service.gov.uk',
      api_endpoint: null,
      health_status: 'not_implemented',
      is_active: 0,
    },
    {
      id: 'public_contracts_scotland',
      name: 'Public Contracts Scotland (PCS)',
      portal_type: 'devolved_scotland',
      base_url: 'https://www.publiccontractsscotland.gov.uk',
      api_endpoint: null,
      health_status: 'not_implemented',
      is_active: 0,
    },
    {
      id: 'sell2wales',
      name: 'Sell2Wales',
      portal_type: 'devolved_wales',
      base_url: 'https://www.sell2wales.gov.wales',
      api_endpoint: null,
      health_status: 'not_implemented',
      is_active: 0,
    },
    {
      id: 'nhs_atamis',
      name: 'Health Family e-Procurement (Atamis)',
      portal_type: 'healthcare',
      base_url: 'https://health-family.force.com/s/Welcome',
      api_endpoint: null,
      health_status: 'not_implemented',
      is_active: 0,
    },
    {
      id: 'etenders_ni',
      name: 'eTendersNI',
      portal_type: 'devolved_ni',
      base_url: 'https://etendersni.gov.uk',
      api_endpoint: null,
      health_status: 'not_implemented',
      is_active: 0,
    },
    {
      id: 'mod_dsp',
      name: 'MOD Defence Sourcing Portal (DSP)',
      portal_type: 'defence',
      base_url: 'https://www.contracts.mod.uk',
      api_endpoint: null,
      health_status: 'not_implemented',
      is_active: 0,
    },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insertSource.run(
        item.id,
        item.name,
        item.portal_type,
        item.base_url,
        item.api_endpoint,
        item.health_status,
        item.is_active
      );
    }
  });

  insertMany(initialSources);
}
