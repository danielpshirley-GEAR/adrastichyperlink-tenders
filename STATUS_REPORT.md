# Adrastichyperlink Public Tender Engine — Verification & Architecture Report

## 1. Executive Summary & Git Identity
- **Repository**: `danielpshirley-GEAR/adrastichyperlink-tenders`
- **Active Branch**: `preview` (PR #1 against `main`)
- **Verified Commits**: `62a318f` (Core resilient data contract & multi-key lookup), `c6ac630` (Render blueprint & fail-closed detection), `b49f609` (Source #2 Contracts Finder implementation)
- **Persistent Live Preview**: Hosted Render Web Service (`https://adrastichyperlink-tenders-preview.onrender.com`)
- **Safety Commitments**: 
  - `main` branch: NOT modified (0 commits).
  - Production deployment: NOT modified / untouched.
  - Source #1 (Find a Tender): STRICTLY LOCKED (zero regressions).
  - Source #2 (Contracts Finder): Fully implemented and validated.
  - Source #3: NOT started.
- **Automated Test Results**: **82 / 82 tests passing** (34 unit & offline tests + 24 authentication & security tests + 24 Contracts Finder tests).

---

## 2. Real Notice Provenance & Enrichment Truth

### Aberdeen City Council (`068074-2026`)
- **Canonical OCID**: `ocds-h6vhtk-06ce78` (strictly extracted from source release; zero substitution or inference)
- **Market Engagement Form Referenced**: **YES**
- **Form Access Status**: `ACCESS NOT YET VERIFIED` (requires authority portal authentication)
- **Form Evidence Citation**: *"Interested parties are asked to complete the market engagement Submission Form and return to markbremner@aberdeencity.gov.uk by the deadline stated in the submission form"* (Find a Tender / PCS Notice Section VI.3)
- **PCS Switch Link**: `https://www.publiccontractsscotland.gov.uk/Search/Search_Switch.aspx?ID=837836`
- **Deadline Status**: `null` (unspecified in notice text; stated in submission form)
- **Evaluation Criteria FactType**: `DERIVED_ABSENCE` (truthful declaration of absence; never presented as an explicit buyer fact)

### Glasgow City Council (`067718-2026`)
- **Canonical OCID**: `ocds-h6vhtk-06cdb9` (strictly extracted from source release; zero substitution or inference)
- **Market Engagement Form Discovered**: **YES**
- **Exact Form URL**: `https://forms.office.com/e/vW0k03HeVY` (Microsoft Forms)
- **Form Verification Status**: **HTTP 200 / `accessState = 'PUBLIC'`** (verified via real GET request)
- **Deadline Status**: `null` (no submission deadline published in preliminary market engagement notice)
- **Evaluation Criteria FactType**: `DERIVED_ABSENCE`

---

## 3. Five Critical UI & Contract Fixes (Commit `62a318f`)

### Bug 1: Database Label Bug
- **Issue**: `/scan` said `Persistent SQLite` when connected to Supabase PostgreSQL because code compared `type === 'postgres'`, but the health endpoint returned human-readable `type: 'Supabase PostgreSQL'`.
- **Fix**: `/api/health` now explicitly returns `database.engine: "postgres" | "sqlite" | "none"`. `ScanView.tsx` switches strictly on `database.engine`:
  - `postgres` → `Supabase / PostgreSQL`
  - `sqlite` → `Persistent SQLite`
  - `none` → `Database Offline`

### Bug 2: Source Data Contract Mismatch
- **Issue**: `/scan` displayed `0 / 7 Active` and all 7 sources as `NOT IMPLEMENTED`.
- **Fix**: `/api/sources` was updated to call `SourceRegistry.getInstance().getSourcesMeta()`. Returns normalized `SourceMeta` objects with `health`, `lastScanAt`, `noticesChecked`, `relevantFound`. The UI now correctly displays:
  - Find a Tender: `HEALTHY` (with real counters)
  - 6 Devolved/Sector Portals: `NOT IMPLEMENTED`
  - Summary: `1 / 7 Active`, `6 Not Implemented`

### Bug 3: Tender Links Using Unstable UUIDs
- **Issue**: `TenderRow` generated links using `/tenders/${tender.id}`, which broke with 404s when old UUIDs became stale.
- **Fix**: Changed links to `/tenders/${tender.canonicalReference || tender.id}` (e.g. `/tenders/067718-2026`).

### Bug 4: Fragile Detail Lookup in `/api/tenders/[id]`
- **Issue**: Looking up tenders by notice ID, OCID, or old UUID returned 404.
- **Fix**: Implemented `findResilient` in `ITendersRepository`, `SupabaseTendersRepository`, and `SqliteTendersRepository`. It checks:
  1. Database UUID
  2. Canonical Reference (`canonical_reference` or `latest_notice_id`)
  3. Canonical OCID (`ocid`)
  4. Mappings in `source_notices` table
  5. Mappings in `source_links` table
  6. Live fetch fallback from Find a Tender API if the ID matches notice pattern (`^\d{6}-\d{4}$`).

### Bug 5: Contradictory UI States
- **Issue**: Header said `"Find a Tender — Healthy"` while counters said `0 / 7 Active`.
- **Fix**: All summary metrics and header badges derive dynamically from the same normalized `sources` array.

---

## 4. Test Suite Summary (82 / 82 Tests Passed)
- 34 Unit & Offline Adapter Tests (Keywords, Hashing, Fail-Closed Provenance, Form Detection, Multi-Key Lookup)
- 24 Route-Level Authentication Tests (Strict 401s, Bearer Token Validation, HMAC Session Cookies, No Token in URL/DOM)
- 24 Comprehensive Contracts Finder Tests (OCDS Parsing, Stage Filtering, 403/429 Backoff, Provenance, False Positives)

---

## 5. Source #2 Contracts Finder Verification (Commit `b49f609`)

### Ingestion & Endpoints
- **Official OCDS Search**: `GET https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search`
- **Notice Web Route**: `https://www.contractsfinder.service.gov.uk/Notice/{uuid}`
- **Cursor-based pagination**: Supported via `links.next` with `limit=100` and `stages=planning,tender`. Pure award-only and contract-only releases excluded from new bid discovery.
- **Rate-Limit Resilience**: Progressive backoff up to 300s on HTTP 403 / 429, capped at 5 retries. During live 60-day scan, cleanly handled HTTP 429 with 120s backoff and resumed ingestion.

### Live 60-Day Scan Metrics
- **Total Releases Fetched**: 442 bid releases across 6 pages
- **Deterministic Exclusions**: 229 false positives rejected (arboriculture, taxi routing, medical imaging, hardware, roofing)
- **Creative Candidates Analysed**: 213 notices evaluated
- **Expired Submissions**: 307 marked expired/archived
- **Active Creative Opportunities Saved**: 4 (`POSSIBLE` qualifications)
- **Supabase Database Writes**: 213 records written with SHA-256 raw JSON integrity

### Verified Real Notice Opportunities
1. **Newry, Mourne and Down District Council** (`0b75532b-8448-4ce1-bc1d-f54027d14a57`):
   - Title: *CA18403 - RFQ 2026/32 - PR Agent for DTFF Celebration Event*
   - Value: £29,500 GBP | Deadline: 2026-09-15 | Verification: Grade B
   - Link: https://www.contractsfinder.service.gov.uk/Notice/0b75532b-8448-4ce1-bc1d-f54027d14a57
2. **PKAT** (`9e6075b9-419a-4770-a98e-05fa579ca43d`):
   - Title: *CA18366 - Request for Tender - Brand, Media and Communications Engagement Strategy*
   - Deadline: 2026-09-15 | Verification: Grade A (HTTP 200)
   - Link: https://www.contractsfinder.service.gov.uk/Notice/9e6075b9-419a-4770-a98e-05fa579ca43d
3. **Newry, Mourne and Down District Council** (`3b871e25-88b7-494f-80a1-bbeafa379fcb`):
   - Title: *CA18364 - Tender 56/2026 - NMANDD PEACEPLUS Thriving Together Community Justice - Youth Intervention Programme Impact: Choices and Consequences*
   - Value: £91,052 GBP | Deadline: 2026-09-30 | Verification: Grade B
   - Link: https://www.contractsfinder.service.gov.uk/Notice/3b871e25-88b7-494f-80a1-bbeafa379fcb
4. **Gassco AS UK** (`9aedcf6c-93ed-48dd-b82c-a069f1a30bef`):
   - Title: *Video Wall & Software Control Room Display*
   - Value: £250,000 GBP | Deadline: 2026-09-15 | Verification: Grade A (HTTP 200)
   - Link: https://www.contractsfinder.service.gov.uk/Notice/9aedcf6c-93ed-48dd-b82c-a069f1a30bef

### Active Source Registry & Health
- **Active Connectors**: **2 / 7 Active** (Find a Tender: `HEALTHY`, Contracts Finder: Registered & Active)
- **Not Implemented**: **5 Not Implemented** (Public Contracts Scotland, Sell2Wales, NHS Atamis, MOD DSP, eTendersNI)
- **Live Preview Runtime**: Render Web Service (`b49f609`) with Supabase PostgreSQL and Gemini connected.
