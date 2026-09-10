// src/shared/database/sqlite.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'adrastichyperlink.db');

let dbInstance: Database.Database | null = null;

export function getSqliteDb(): Database.Database {
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
      health_status TEXT NOT NULL DEFAULT 'not_implemented',
      last_successful_scan_at TEXT,
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
      ocid TEXT,
      title TEXT NOT NULL,
      plain_english_summary TEXT,
      buyer_id TEXT REFERENCES buyers(id),
      buyer_name TEXT NOT NULL,
      value_amount REAL,
      value_currency TEXT DEFAULT 'GBP',
      value_description TEXT,
      published_at TEXT NOT NULL,
      submission_deadline TEXT NOT NULL,
      clarification_deadline TEXT,
      contract_start_at TEXT,
      contract_end_at TEXT,
      discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      qualification TEXT NOT NULL DEFAULT 'POSSIBLE',
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

    CREATE TABLE IF NOT EXISTS source_notices (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES sources(id),
      notice_id TEXT NOT NULL,
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
      decided_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL UNIQUE REFERENCES tenders(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'in_progress',
      progress_percentage INTEGER NOT NULL DEFAULT 0,
      submission_deadline TEXT NOT NULL,
      portal_submission_url TEXT,
      submitted_at TEXT,
      submission_reference TEXT,
      submission_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_questions (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      question_number TEXT NOT NULL,
      section_name TEXT,
      exact_wording TEXT NOT NULL,
      word_limit INTEGER,
      character_limit INTEGER,
      weight REAL,
      scoring_criteria TEXT,
      evaluator_intent TEXT,
      mandatory INTEGER NOT NULL DEFAULT 1,
      source_document TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS application_answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL UNIQUE REFERENCES application_questions(id) ON DELETE CASCADE,
      answer_plan TEXT,
      current_draft TEXT,
      word_count INTEGER DEFAULT 0,
      approval_status TEXT NOT NULL DEFAULT 'draft',
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_items (
      id TEXT PRIMARY KEY,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      is_verified INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS company_credentials (
      id TEXT PRIMARY KEY,
      credential_type TEXT NOT NULL,
      held_level TEXT NOT NULL,
      policy_number TEXT,
      expiry_date TEXT,
      evidence_document_path TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_runs (
      id TEXT PRIMARY KEY,
      specialist_function TEXT NOT NULL,
      tier INTEGER NOT NULL DEFAULT 1,
      input_hash TEXT NOT NULL,
      output_json TEXT NOT NULL,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(submission_deadline);
    CREATE INDEX IF NOT EXISTS idx_tenders_canonical_ref ON tenders(canonical_reference);
    CREATE INDEX IF NOT EXISTS idx_tenders_qualification ON tenders(qualification);
    CREATE INDEX IF NOT EXISTS idx_source_notices_lookup ON source_notices(source_id, notice_id);
  `);

  // Seed default sources if empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM sources').get() as { count: number };
  if (countRow.count === 0) {
    const insertSource = db.prepare(`
      INSERT INTO sources (id, name, portal_type, base_url, api_endpoint, health_status, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sources = [
      {
        id: 'find_a_tender',
        name: 'Find a Tender (FTS)',
        portal_type: 'primary_ocds',
        base_url: 'https://www.find-tender.service.gov.uk',
        api_endpoint: 'https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages',
        health_status: 'healthy',
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
        id: 'sell2wales',
        name: 'Sell2Wales',
        portal_type: 'devolved_wales',
        base_url: 'https://www.sell2wales.gov.wales',
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
        id: 'public_contracts_scotland',
        name: 'Public Contracts Scotland (PCS)',
        portal_type: 'devolved_scotland',
        base_url: 'https://www.publiccontractsscotland.gov.uk',
        api_endpoint: null,
        health_status: 'not_implemented',
        is_active: 0,
      },
      {
        id: 'crown_commercial_service',
        name: 'Crown Commercial Service (CCS)',
        portal_type: 'frameworks',
        base_url: 'https://www.crowncommercial.gov.uk',
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

    insertMany(sources);
  }
}
