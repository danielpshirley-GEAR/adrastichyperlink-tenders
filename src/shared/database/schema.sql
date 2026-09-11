-- ==============================================================================
-- ADRASTICHYPERLINK PUBLIC TENDER ENGINE — CANONICAL POSTGRESQL / SUPABASE SCHEMA
-- Master Production Schema (Synchronized with supabase/migrations/20260910_initial_production_schema.sql)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SOURCES TABLE
CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    portal_type VARCHAR(64) NOT NULL,
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    health_status VARCHAR(32) NOT NULL DEFAULT 'untested', -- 'untested', 'healthy', 'degraded', 'error', 'not_implemented'
    last_attempt_at TIMESTAMPTZ,
    last_successful_scan_at TIMESTAMPTZ,
    last_scan_error TEXT,
    total_notices_scanned INTEGER NOT NULL DEFAULT 0,
    total_relevant_found INTEGER NOT NULL DEFAULT 0,
    scan_frequency_cron VARCHAR(64) DEFAULT '0 7 * * 1,3,5',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SCAN RUNS TABLE
CREATE TABLE IF NOT EXISTS scan_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_type VARCHAR(32) NOT NULL,
    source_id VARCHAR(64) REFERENCES sources(id),
    status VARCHAR(32) NOT NULL DEFAULT 'running',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notices_checked INTEGER NOT NULL DEFAULT 0,
    initial_candidates INTEGER NOT NULL DEFAULT 0,
    ai_relevant INTEGER NOT NULL DEFAULT 0,
    strong_count INTEGER NOT NULL DEFAULT 0,
    possible_count INTEGER NOT NULL DEFAULT 0,
    weak_count INTEGER NOT NULL DEFAULT 0,
    duplicates_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    log_details JSONB DEFAULT '{}'::jsonb
);

-- 3. BUYERS TABLE
CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    buyer_type VARCHAR(64) NOT NULL DEFAULT 'other',
    website TEXT,
    contact_email VARCHAR(255),
    procurement_portal VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TENDERS TABLE (Canonical procurement process)
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_reference VARCHAR(128) UNIQUE NOT NULL,
    latest_notice_id VARCHAR(128),
    ocid VARCHAR(128),
    title TEXT,
    plain_english_summary TEXT,
    buyer_id UUID REFERENCES buyers(id),
    buyer_name VARCHAR(255),
    value_amount NUMERIC(14, 2),
    value_currency VARCHAR(8),
    value_description TEXT,
    published_at TIMESTAMPTZ,
    submission_deadline TIMESTAMPTZ,
    clarification_deadline TIMESTAMPTZ,
    contract_start_at TIMESTAMPTZ,
    contract_end_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qualification VARCHAR(32) NOT NULL DEFAULT 'POSSIBLE',
    deterministic_result VARCHAR(32),
    ai_result VARCHAR(32),
    final_qualification VARCHAR(32),
    lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    verification_grade VARCHAR(8) NOT NULL DEFAULT 'D',
    official_notice_url TEXT NOT NULL,
    application_portal_url TEXT,
    service_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_archived BOOLEAN NOT NULL DEFAULT false,
    archived_reason VARCHAR(64),
    bid_decision_state VARCHAR(32) NOT NULL DEFAULT 'UNDECIDED',
    evaluation_criteria JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SOURCE NOTICES TABLE (Raw releases & historical versions)
CREATE TABLE IF NOT EXISTS source_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(64) REFERENCES sources(id) NOT NULL,
    notice_id VARCHAR(128) NOT NULL,
    ocid VARCHAR(128),
    content_hash VARCHAR(64),
    version INTEGER NOT NULL DEFAULT 1,
    tender_id UUID REFERENCES tenders(id) ON DELETE SET NULL,
    raw_notice_json JSONB NOT NULL,
    notice_url TEXT NOT NULL,
    published_date TIMESTAMPTZ,
    closing_date TIMESTAMPTZ,
    notice_type VARCHAR(64) DEFAULT 'tender',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TENDER SOURCE LINKS TABLE
CREATE TABLE IF NOT EXISTS tender_source_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
    source_id VARCHAR(64) REFERENCES sources(id) NOT NULL,
    source_url TEXT NOT NULL,
    url_type VARCHAR(32) NOT NULL,
    verification_grade VARCHAR(8) NOT NULL,
    http_status INTEGER,
    final_redirect_url TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_notes TEXT
);

-- 7. BID DECISIONS TABLE (Unified model)
CREATE TABLE IF NOT EXISTS bid_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    decision VARCHAR(32) NOT NULL, -- 'BID', 'PASS', 'WATCH', 'PARTNER', 'UNDECIDED'
    reasoning TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    gemini_recommendation VARCHAR(32),
    gemini_reasoning TEXT,
    capability_fit_score NUMERIC(5,2),
    bid_effort VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    commercial_value_assessment TEXT,
    daniel_decision VARCHAR(32),
    decision_made_at TIMESTAMPTZ,
    decision_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    tender_title TEXT NOT NULL,
    canonical_reference TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    submission_deadline TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    bid_decision VARCHAR(32) NOT NULL DEFAULT 'BID',
    overall_suitability_score INTEGER NOT NULL DEFAULT 0,
    win_themes TEXT[] DEFAULT ARRAY[]::TEXT[],
    questions_count INTEGER NOT NULL DEFAULT 0,
    facts_required_count INTEGER NOT NULL DEFAULT 0,
    questions JSONB DEFAULT '[]'::jsonb,
    portal_submission_url TEXT,
    submitted_at TIMESTAMPTZ,
    submission_reference VARCHAR(128),
    submission_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. DEDICATED DATABASE HEALTH PROBES TABLE
CREATE TABLE IF NOT EXISTS db_health_probes (
    id VARCHAR(64) PRIMARY KEY,
    probed_at TIMESTAMPTZ NOT NULL
);

-- 10. CONSTRAINTS & PERFORMANCE INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_source_notices_unique_release 
ON source_notices (source_id, notice_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_source_notices_ocid ON source_notices (ocid);
CREATE INDEX IF NOT EXISTS idx_source_notices_tender_id ON source_notices (tender_id);
CREATE INDEX IF NOT EXISTS idx_source_notices_lookup ON source_notices (source_id, notice_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenders_ocid_unique ON tenders (ocid) WHERE ocid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_ocid ON tenders (ocid);
CREATE INDEX IF NOT EXISTS idx_tenders_latest_notice_id ON tenders (latest_notice_id);
CREATE INDEX IF NOT EXISTS idx_tenders_canonical_ref ON tenders (canonical_reference);
CREATE INDEX IF NOT EXISTS idx_tenders_qualification ON tenders (qualification);
CREATE INDEX IF NOT EXISTS idx_tenders_bid_decision_state ON tenders (bid_decision_state);
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders (submission_deadline);

-- 11. SEED INITIAL SEVEN SOURCES
INSERT INTO sources (id, name, portal_type, base_url, api_endpoint, health_status, is_active)
VALUES
    ('find_a_tender', 'Find a Tender (FTS)', 'primary_ocds', 'https://www.find-tender.service.gov.uk', 'https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages', 'untested', true),
    ('contracts_finder', 'Contracts Finder', 'low_value', 'https://www.contractsfinder.service.gov.uk', NULL, 'not_implemented', false),
    ('public_contracts_scotland', 'Public Contracts Scotland (PCS)', 'devolved_scotland', 'https://www.publiccontractsscotland.gov.uk', NULL, 'not_implemented', false),
    ('sell2wales', 'Sell2Wales', 'devolved_wales', 'https://www.sell2wales.gov.wales', NULL, 'not_implemented', false),
    ('nhs_atamis', 'Health Family e-Procurement (Atamis)', 'healthcare', 'https://health-family.force.com/s/Welcome', NULL, 'not_implemented', false),
    ('etenders_ni', 'eTendersNI', 'devolved_ni', 'https://etendersni.gov.uk', NULL, 'not_implemented', false),
    ('mod_dsp', 'MOD Defence Sourcing Portal (DSP)', 'defence', 'https://www.contracts.mod.uk', NULL, 'not_implemented', false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    portal_type = EXCLUDED.portal_type,
    base_url = EXCLUDED.base_url,
    api_endpoint = EXCLUDED.api_endpoint;
