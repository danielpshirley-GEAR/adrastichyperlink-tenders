-- ==============================================================================
-- PHASE 2.3: SECURITY, ROW LEVEL SECURITY (RLS), PERMISSIONS & ATOMIC COUNTERS
-- Migration: 20260911_security_and_rls.sql
-- Description:
--   1. Ensures canonical identity integrity (OCID unique index & latest_notice_id).
--   2. Enables Row Level Security (RLS) on all public tables.
--   3. Restricts anon and authenticated roles from mutating tables.
--   4. Grants service_role full administrative access.
--   5. Creates atomic source counter update RPC function.
-- ==============================================================================

-- 1. CANONICAL PROCUREMENT IDENTITY HARDENING
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS latest_notice_id TEXT;
ALTER TABLE tenders ALTER COLUMN buyer_name DROP NOT NULL;
ALTER TABLE tenders ALTER COLUMN title DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenders_ocid_unique ON tenders (ocid) WHERE ocid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_latest_notice_id ON tenders (latest_notice_id);

-- 2. ENABLE ROW LEVEL SECURITY ON ALL PRODUCTION TABLES
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_source_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE db_health_probes ENABLE ROW LEVEL SECURITY;

-- 3. REVOKE UNTRUSTED BROWSER/ANON MUTATION PRIVILEGES
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grant read-only access to public feeds if required by frontend clients
GRANT SELECT ON sources, tenders, source_notices, buyers TO anon, authenticated;

-- Revoke select on sensitive internal operational tables from anon
REVOKE SELECT ON scan_runs, bid_decisions, applications, db_health_probes FROM anon;

-- 4. GRANT SERVICE_ROLE FULL PRIVILEGES FOR TRUSTED SERVER OPERATIONS
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 5. RLS POLICIES FOR SERVICE_ROLE
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

-- 6. ATOMIC SOURCE COUNTER INCREMENT FUNCTION (CONCURRENCY SAFE)
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
