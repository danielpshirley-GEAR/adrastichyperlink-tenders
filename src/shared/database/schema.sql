-- ==============================================================================
-- ADRASTICHYPERLINK PUBLIC TENDER ENGINE — MASTER POSTGRESQL / SUPABASE SCHEMA
-- V1 Standalone Procurement Workstation (25 Core Normalized Tables)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. SOURCING DOMAIN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(64) PRIMARY KEY, -- 'find_a_tender', 'contracts_finder', etc.
    name VARCHAR(255) NOT NULL,
    portal_type VARCHAR(64) NOT NULL, -- 'primary_ocds', 'low_value', 'regional', etc.
    base_url TEXT NOT NULL,
    api_endpoint TEXT,
    health_status VARCHAR(32) NOT NULL DEFAULT 'healthy', -- 'healthy', 'degraded', 'error'
    last_successful_scan_at TIMESTAMPTZ,
    last_scan_error TEXT,
    total_notices_scanned INTEGER NOT NULL DEFAULT 0,
    total_relevant_found INTEGER NOT NULL DEFAULT 0,
    scan_frequency_cron VARCHAR(64) DEFAULT '0 7 * * 1,3,5', -- Mon/Wed/Fri 07:00
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_type VARCHAR(32) NOT NULL, -- 'quick', 'full', 'deep', 'single_source', 'url_analysis'
    source_id VARCHAR(64) REFERENCES sources(id),
    status VARCHAR(32) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
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
    log_details JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    buyer_type VARCHAR(64) NOT NULL, -- 'central_gov', 'local_council', 'nhs', 'university', 'transport', 'police', 'mod', 'other'
    website TEXT,
    contact_email VARCHAR(255),
    procurement_portal VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_reference VARCHAR(128) UNIQUE NOT NULL,
    ocid VARCHAR(128),
    title TEXT NOT NULL,
    plain_english_summary TEXT,
    buyer_id UUID REFERENCES buyers(id),
    buyer_name VARCHAR(255) NOT NULL,
    value_amount NUMERIC(14, 2),
    value_currency VARCHAR(8) DEFAULT 'GBP',
    value_description TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    submission_deadline TIMESTAMPTZ NOT NULL,
    clarification_deadline TIMESTAMPTZ,
    contract_start_at TIMESTAMPTZ,
    contract_end_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qualification VARCHAR(32) NOT NULL DEFAULT 'POSSIBLE', -- 'STRONG', 'POSSIBLE', 'WEAK', 'REJECT'
    verification_grade VARCHAR(8) NOT NULL DEFAULT 'D', -- 'A', 'B', 'C', 'D', 'X'
    official_notice_url TEXT NOT NULL,
    application_portal_url TEXT,
    service_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(64) REFERENCES sources(id) NOT NULL,
    notice_id VARCHAR(128) NOT NULL,
    tender_id UUID REFERENCES tenders(id),
    raw_notice_json JSONB NOT NULL,
    notice_url TEXT NOT NULL,
    published_date TIMESTAMPTZ,
    closing_date TIMESTAMPTZ,
    notice_type VARCHAR(64), -- 'tender', 'pipeline', 'award', 'pin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tender_source_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
    source_id VARCHAR(64) REFERENCES sources(id) NOT NULL,
    source_url TEXT NOT NULL,
    url_type VARCHAR(32) NOT NULL, -- 'official_notice', 'portal_submission', 'secondary'
    verification_grade VARCHAR(8) NOT NULL, -- 'A', 'B', 'C', 'D', 'X'
    http_status INTEGER,
    final_redirect_url TEXT,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_notes TEXT
);

CREATE TABLE IF NOT EXISTS saved_search_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    keyword_groups JSONB NOT NULL,
    cpv_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    buyer_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    min_value NUMERIC(14, 2),
    max_value NUMERIC(14, 2),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_query_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(64) REFERENCES sources(id) NOT NULL,
    query_params JSONB NOT NULL,
    response_status INTEGER NOT NULL,
    results_count INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. TENDER INTELLIGENCE DOMAIN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tender_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    doc_type VARCHAR(64) NOT NULL, -- 'itt', 'specification', 'sq', 'pricing', 'social_value', 'clarifications', 'terms'
    file_size_bytes BIGINT,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256
    storage_path TEXT,
    requires_login BOOLEAN NOT NULL DEFAULT false,
    version_number INTEGER NOT NULL DEFAULT 1,
    analysis_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'analyzed', 'failed'
    extracted_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tender_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'insurance', 'experience', 'certification', 'turnover', 'security'
    requirement_name VARCHAR(255) NOT NULL,
    buyer_requirement_text TEXT NOT NULL,
    source_document_id UUID REFERENCES tender_documents(id),
    source_citation VARCHAR(255), -- 'Specification.pdf, Section 5.4'
    adrastic_capability_text TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN', -- 'PASS', 'ACTION_REQUIRED', 'PARTNER_REQUIRED', 'FAIL', 'UNKNOWN'
    mandatory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tender_evidence_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
    claim_text TEXT NOT NULL,
    source_type VARCHAR(64) NOT NULL, -- 'buyer_spec', 'adrastic_kb'
    evidence_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'SUPPORTED', 'UNSUPPORTED', 'PENDING'
    citation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tender_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    what_they_want TEXT,
    why_they_are_buying TEXT,
    deliverables JSONB DEFAULT '[]'::jsonb,
    target_audience TEXT,
    services_required TEXT[] DEFAULT ARRAY[]::TEXT[],
    evaluation_criteria JSONB DEFAULT '[]'::jsonb,
    mandatory_requirements JSONB DEFAULT '[]'::jsonb,
    desirable_requirements JSONB DEFAULT '[]'::jsonb,
    required_experience TEXT,
    major_risks JSONB DEFAULT '[]'::jsonb,
    clarification_points JSONB DEFAULT '[]'::jsonb,
    adrastic_fit_analysis TEXT,
    gemini_model_used VARCHAR(64),
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eligibility_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    overall_status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN', -- 'PASS', 'PASS_WITH_ACTION', 'PARTNER_REQUIRED', 'UNKNOWN', 'FAIL'
    turnover_check VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    years_trading_check VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    pi_insurance_check VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    pl_insurance_check VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    el_insurance_check VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    cyber_essentials_check VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    comparable_contracts_check VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS bid_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    gemini_recommendation VARCHAR(32) NOT NULL, -- 'BID', 'PASS', 'PARTNER', 'WATCH'
    gemini_reasoning TEXT,
    capability_fit_score NUMERIC(5,2),
    bid_effort VARCHAR(32) NOT NULL DEFAULT 'MEDIUM', -- 'LIGHT', 'MEDIUM', 'HEAVY', 'VERY_HEAVY'
    commercial_value_assessment TEXT,
    daniel_decision VARCHAR(32) DEFAULT NULL, -- 'BID', 'PASS', 'PARTNER', 'WATCH'
    decision_made_at TIMESTAMPTZ,
    decision_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. APPLICATION DOMAIN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'ready_for_review', 'submitted', 'abandoned'
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    submission_deadline TIMESTAMPTZ NOT NULL,
    portal_submission_url TEXT,
    submitted_at TIMESTAMPTZ,
    submission_reference VARCHAR(128),
    submission_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
    question_number VARCHAR(32) NOT NULL,
    section_name VARCHAR(128),
    exact_wording TEXT NOT NULL,
    word_limit INTEGER,
    character_limit INTEGER,
    weight NUMERIC(5,2),
    scoring_criteria TEXT,
    evaluator_intent TEXT,
    mandatory BOOLEAN NOT NULL DEFAULT true,
    source_document VARCHAR(255),
    page_section_reference VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES application_questions(id) ON DELETE CASCADE NOT NULL UNIQUE,
    answer_plan TEXT,
    current_draft TEXT,
    word_count INTEGER DEFAULT 0,
    approval_status VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'draft', 'in_review', 'approved'
    approved_by VARCHAR(128),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answer_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    answer_id UUID REFERENCES application_answers(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    draft_content TEXT NOT NULL,
    ai_generated BOOLEAN NOT NULL DEFAULT false,
    unsupported_claims_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. KNOWLEDGE BASE DOMAIN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section VARCHAR(64) NOT NULL, -- 'company', 'credentials', 'experience', 'policies', 'references', 'approved_answers', 'missing_information'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credential_type VARCHAR(64) NOT NULL, -- 'pi_insurance', 'pl_insurance', 'cyber_essentials', 'iso_9001', 'ico_registration'
    held_level VARCHAR(128) NOT NULL, -- '£2,000,000', 'Active Certification'
    policy_number VARCHAR(128),
    expiry_date DATE,
    evidence_document_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    classification VARCHAR(64) NOT NULL, -- 'REAL_CLIENT', 'PERSONAL_PROFESSIONAL_EXPERIENCE', 'CONCEPT', 'CONFIDENTIAL'
    summary TEXT NOT NULL,
    outcomes TEXT,
    creative_deliverables TEXT[] DEFAULT ARRAY[]::TEXT[],
    sector VARCHAR(64),
    date_completed DATE,
    can_be_cited_in_public_tenders BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_type VARCHAR(64) NOT NULL, -- 'social_value', 'gdpr_privacy', 'quality_assurance', 'environmental', 'health_safety', 'edi'
    title VARCHAR(255) NOT NULL,
    approved_text TEXT NOT NULL,
    last_reviewed_at DATE,
    version VARCHAR(32) DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. SYSTEM & AI DOMAIN
-- ==============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    due_date TIMESTAMPTZ,
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    priority VARCHAR(16) NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialist_function VARCHAR(64) NOT NULL, -- 'TenderClassifier', 'TenderAnalyst', 'EvidenceChecker', etc.
    tier INTEGER NOT NULL DEFAULT 1, -- 1, 2, 3, 4
    input_hash VARCHAR(64) NOT NULL,
    output_json JSONB NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missing_information (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    question_context TEXT NOT NULL,
    required_fact VARCHAR(255) NOT NULL,
    suggested_action TEXT,
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_text TEXT,
    saved_to_knowledge_base BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_tenders_deadline ON tenders(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_tenders_qualification ON tenders(qualification);
CREATE INDEX IF NOT EXISTS idx_tenders_canonical_ref ON tenders(canonical_reference);
CREATE INDEX IF NOT EXISTS idx_tenders_published_at ON tenders(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_source_notices_source ON source_notices(source_id, notice_id);
CREATE INDEX IF NOT EXISTS idx_requirements_tender ON tender_requirements(tender_id);
CREATE INDEX IF NOT EXISTS idx_questions_app ON application_questions(application_id);
