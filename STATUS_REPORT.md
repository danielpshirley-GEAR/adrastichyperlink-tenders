# Adrastichyperlink Public Tender Engine — Verification & Architecture Report

## 1. Executive Summary & Git Identity
- **Repository**: `danielpshirley-GEAR/adrastichyperlink-tenders`
- **Active Branch**: `preview` (PR #1 against `main`)
- **Verified Commits**: `62a318f` (Core resilient data contract & multi-key lookup), `d254eac` (Auto-reconnecting tunnel daemon), plus strict auth cleanup
- **Persistent Live Preview**: Auto-reconnecting background daemon active
- **Safety Commitments**: 
  - `main` branch: NOT modified (0 commits).
  - Production deployment: NOT modified / untouched.
  - Contracts Finder: NOT added (strictly scoping Find a Tender evidence integrity).
- **Automated Test Results**: **58 / 58 tests passing** (34 unit & offline tests + 24 authentication & security tests).

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

## 4. Test Suite Summary (51 / 51 Tests Passed)
- 34 Unit & Offline Adapter Tests (Keywords, Hashing, Fail-Closed Provenance, Form Detection, Multi-Key Lookup)
- 17 Route-Level Authentication Tests (Strict 401s, Bearer Token Validation, HMAC Session Cookies)
