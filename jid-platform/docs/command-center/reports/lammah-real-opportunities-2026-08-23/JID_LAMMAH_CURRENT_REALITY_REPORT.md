# JID Lammah — Current Reality Report

Research run: `lammah-real-opportunities-2026-08-23`  
Timezone: `Asia/Riyadh`  
Checked at: `2026-08-23T03:45:00+03:00`

## Reality lock

| Item | Value |
|---|---|
| Isolated worktree | `C:\Users\saada\Downloads\Desktop\JID-1-wt-lammah-real-opportunities` |
| Work branch | `cursor/jid-lammah-real-opportunities-v1` |
| Base branch / SHA | `cursor/jid-interview-final-integration-v1` @ `7d78fbb4d7b4f961fa25a84c9b84d67a4d95352e` |
| Original workspace | left on Catalog branch `cursor/jid-directory-data-reality-v2` — not edited |
| Production Supabase | `znfhladafpajyjwcfzvv` — forbidden, not touched |
| Known nonprod | `hmjuijmaefajdjrjdsxu` — inspect-only; **not mutated**; counts not queried in this worktree (no `.env.local`) |

Current repository schema wins over historical pack contracts.

## Current Lammah pipeline

Existing path:

`lammah_sources` → `lammah_sync_runs` → `lammah_raw_evidence` → `lammah_import_candidates` → staff review → `publish_lammah_candidate` → `lammah_opportunities`

Staff surfaces already exist under `/[locale]/staff/lammah` (overview, review, mapping, dead-letters, runs).

Public feed is entitlement-gated (`lammah_feed`) in `src/lib/lammah/server.ts`. Unentitled sessions never construct the inventory query.

## Current schema facts that override pack contracts

- Opportunity types: `job | co_op | internship | fellowship | scholarship`. There is **no** `graduate_program` enum.
- Published status: `active | hidden | superseded | expired`. Research lifecycle `open | upcoming | closed | unknown` is an evidence classification, not a published-row enum.
- `lammah_sources.source_type` check: `career_page | rss | api | official_program` only.
- Qualified source today: `eu_careers_cast` (EU Careers / EPSO), `approval_state=approved`, `auto_publication_enabled=false`.
- `ingest_lammah_candidate` record shape is a **closed JSON key allowlist**. Extra keys fail.
- `lammah_raw_evidence.content_type` allows `text/html | application/json | application/xml | text/csv` only.
- `sector` / `region` / `source_published_at` / `expires_at` on published opportunities are nullable after Phase 1.
- Directory mapping uses `companies.id`. This front never creates Directory rows, Profiles, or Verification.

## REALITY_DRIFT

1. **EU-only source URL hardcode.** Shipped `ingest_lammah_candidate` validates `source_page_url` against `ARRAY['europa.eu']`. Saudi official hosts cannot ingest until the unapplied forward-only migration `20260823120000_lammah_source_host_allowlist.sql` is applied.
2. **EU-only run starter.** `lammah_begin_run` selects `source_key = 'eu_careers_cast'` only. Additive `lammah_begin_source_run(p_source_key, ...)` is in the same unapplied migration. It still requires `approval_state='approved'` and `robots_ok`.
3. **Source approval is a Founder/qualification gate.** New Saudi sources in this manifest remain `candidate`. They cannot start a worker run until terms/robots/licence/parser fields are qualified. This run does **not** auto-approve them.
4. **Directory UUIDs are not locked in this front.** Aramco/SABIC/KSU/KAU exist as seed-domain anchors, but this workstream does not attach `directory_company_id`. Status is `mapped_pending_catalog_uuid` or `ORG_MAPPING_REQUIRED` plus `CATALOG_ORG_DEPENDENCY`.
5. **Public card already shows `آخر تحقق` from `last_confirmed_at`.** Pack says research `checked_at` must not automatically become a public last-verified claim unless the product contract supports it. That copy is owned by the Content/UI fronts, not this workstream.

## Gaps this front closed locally (not applied remotely)

- Per-source `allowed_source_hosts` + `lammah_resolved_source_hosts`.
- `lammah_begin_source_run` without weakening EU Careers `lammah_begin_run`.
- Research → normalize → lifecycle → dedup → org-map → closed-shape ingest record → dry-run manifest.
- Tests for URL, lifecycle, missing optionals, malformed, Tier C, org mapping, same-title different requisition, identical apply URL, checksum idempotency, zero side effects.

## Gaps that remain Founder/import gates

- Apply the new migration to nonprod.
- Qualify robots/terms/licence for each Saudi source before `approved`.
- Catalog UUID attachment for Aramco and unresolved orgs (KAUST, Elm, ACWA Power, HRDF).
- Staff review then publish. Auto-publication stays off.
- No remote nonprod import in this command.
