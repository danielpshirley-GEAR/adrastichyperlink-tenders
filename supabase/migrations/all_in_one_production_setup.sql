-- ==============================================================================
-- ALL-IN-ONE PRODUCTION DATABASE SCHEMA & SECURITY SETUP
-- Adrastichyperlink Public Tender Engine
-- Safe & idempotent: can be run repeatedly without errors.
-- ==============================================================================

-- 1. SOURCES TABLE
CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(8) NOT NULL DEFAULT 'UK',
    jurisdiction VARCHAR(64) NOT NULL DEFAULT 'United Kingdom',
    source_tier VARCHAR(16) NOT NULL DEFAULT 'TIER_1',
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    health_status VARCHAR(32) NOT NULL DEFAULT 'untested',
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
    notice_type VARCHAR(64),
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_source_notice_version UNIQUE(source_id, notice_id, version),
    CONSTRAINT uq_source_notice_hash UNIQUE(source_id, notice_id, content_hash)
);

-- 6. TENDER SOURCE LINKS TABLE
CREATE TABLE IF NOT EXISTS tender_source_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
    source_id VARCHAR(64) REFERENCES sources(id) NOT NULL,
    source_url TEXT NOT NULL,
    url_type VARCHAR(32) NOT NULL DEFAULT 'NOTICE',
    verification_grade VARCHAR(8) NOT NULL DEFAULT 'D',
    http_status INTEGER,
    final_redirect_url TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. BID DECISIONS TABLE
CREATE TABLE IF NOT EXISTS bid_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    decision VARCHAR(32) NOT NULL DEFAULT 'UNDECIDED',
    confidence_score NUMERIC(5, 2),
    win_probability NUMERIC(5, 2),
    strategic_fit VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
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
    overall_suitability_score INTEGER,
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

-- 10. SEED THE 7 OFFICIAL PROCUREMENT SOURCES
INSERT INTO sources (id, name, country, jurisdiction, source_tier, base_url, api_endpoint, health_status, scan_frequency_cron, is_active)
VALUES
    ('find_a_tender', 'Find a Tender (FTS)', 'UK', 'UK Central Government', 'TIER_1', 'https://www.find-tender.service.gov.uk', 'https://www.find-tender.service.gov.uk/api/1.0/ocdsReleasePackages', 'untested', '0 7,12,17 * * 1-5', true),
    ('contracts_finder', 'Contracts Finder', 'UK', 'England & Wales', 'TIER_1', 'https://www.contractsfinder.service.gov.uk', NULL, 'not_implemented', '0 7 * * 1,3,5', false),
    ('public_contracts_scotland', 'Public Contracts Scotland', 'UK', 'Scotland', 'TIER_1', 'https://www.publiccontractsscotland.gov.uk', NULL, 'not_implemented', '0 7 * * 1,3,5', false),
    ('sell2wales', 'Sell2Wales', 'UK', 'Wales', 'TIER_1', 'https://www.sell2wales.gov.wales', NULL, 'not_implemented', '0 7 * * 1,3,5', false),
    ('etenders_ni', 'eTendersNI', 'UK', 'Northern Ireland', 'TIER_1', 'https://etendersni.gov.uk', NULL, 'not_implemented', '0 7 * * 1,3,5', false),
    ('nhs_atamis', 'NHS Atamis e-Sourcing', 'UK', 'NHS Health', 'TIER_2', 'https://health-family.force.com', NULL, 'not_implemented', '0 8 * * 1,3,5', false),
    ('mod_dsp', 'MOD Defence Sourcing Portal', 'UK', 'Defence', 'TIER_2', 'https://contracts.mod.uk', NULL, 'not_implemented', '0 8 * * 1,3,5', false)
ON CONFLICT (id) DO NOTHING;

-- 11. ENSURE PROPER COLUMN TYPES AND UNIQUE INDEXES
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS latest_notice_id TEXT;
ALTER TABLE tenders ALTER COLUMN buyer_name DROP NOT NULL;
ALTER TABLE tenders ALTER COLUMN title DROP NOT NULL;
ALTER TABLE tenders ALTER COLUMN value_currency DROP NOT NULL;
ALTER TABLE applications ALTER COLUMN overall_suitability_score DROP NOT NULL;
ALTER TABLE applications ALTER COLUMN submission_deadline DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenders_ocid_unique ON tenders (ocid) WHERE ocid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_latest_notice_id ON tenders (latest_notice_id);
CREATE INDEX IF NOT EXISTS idx_tenders_canonical_ref ON tenders (canonical_reference);
CREATE INDEX IF NOT EXISTS idx_source_notices_notice_id ON source_notices (notice_id);
CREATE INDEX IF NOT EXISTS idx_source_notices_ocid ON source_notices (ocid);

-- 12. ENABLE ROW LEVEL SECURITY (RLS) ON ALL PRODUCTION TABLES
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_source_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE db_health_probes ENABLE ROW LEVEL SECURITY;

-- 13. PRIVILEGES & PERMISSIONS
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;
GRANT SELECT ON sources, tenders, source_notices, buyers TO anon, authenticated;
REVOKE SELECT ON scan_runs, bid_decisions, applications, db_health_probes FROM anon;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 14. RLS POLICIES FOR SERVICE_ROLE
DROP POLICY IF EXISTS "Service role has full access to sources" ON sources;
CREATE POLICY "Service role has full access to sources" ON sources FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to scan_runs" ON scan_runs;
CREATE POLICY "Service role has full access to scan_runs" ON scan_runs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to buyers" ON buyers;
CREATE POLICY "Service role has full access to buyers" ON buyers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to tenders" ON tenders;
CREATE POLICY "Service role has full access to tenders" ON tenders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to source_notices" ON source_notices;
CREATE POLICY "Service role has full access to source_notices" ON source_notices FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to tender_source_links" ON tender_source_links;
CREATE POLICY "Service role has full access to tender_source_links" ON tender_source_links FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to bid_decisions" ON bid_decisions;
CREATE POLICY "Service role has full access to bid_decisions" ON bid_decisions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to applications" ON applications;
CREATE POLICY "Service role has full access to applications" ON applications FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to db_health_probes" ON db_health_probes;
CREATE POLICY "Service role has full access to db_health_probes" ON db_health_probes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 15. ATOMIC SOURCE COUNTERS STORED PROCEDURE
CREATE OR REPLACE FUNCTION increment_source_counters(
    p_source_id TEXT,
    p_scanned_delta INT DEFAULT 0,
    p_relevant_delta INT DEFAULT 0,
    p_status TEXT DEFAULT 'healthy',
    p_last_scan_error TEXT DEFAULT NULL,
    p_successful BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
    UPDATE sources
    SET
        total_notices_scanned = total_notices_scanned + COALESCE(p_scanned_delta, 0),
        total_relevant_found = total_relevant_found + COALESCE(p_relevant_delta, 0),
        health_status = p_status,
        last_attempt_at = NOW(),
        updated_at = NOW(),
        last_successful_scan_at = CASE WHEN p_successful THEN NOW() ELSE last_successful_scan_at END,
        last_scan_error = CASE
            WHEN p_status = 'healthy' AND p_successful THEN NULL
            WHEN p_last_scan_error IS NOT NULL THEN p_last_scan_error
            ELSE last_scan_error
        END
    WHERE id = p_source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_source_counters(TEXT, INT, INT, TEXT, TEXT, BOOLEAN) TO service_role;
