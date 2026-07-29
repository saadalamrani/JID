# JID Catalog — Session A Repository Reconciliation and Phase-1 Source Qualification

**Status:** `GO_WITH_BLOCKERS`
**Inspection date:** 2026-07-29 (`Asia/Riyadh`)
**Resolved base:** `68c656d7d01578a1eafb98a2f82d6819d3c63500`
**Source branch:** `agent/nonprod-signup-fix`
**Work branch:** `codex/jid-catalog-a-reconciliation`
**Database inspected:** connected non-production Supabase project `hmjuijmaefajdjrjdsxu`
**Scope:** investigation and reconciliation only; no Catalog implementation

## 1. Executive decision

Session A recommends a **GLEIF-only Phase-1 foundation with human review for every candidate**, after the pre-DDL blockers in §16 are resolved. The Ministry connector remains independently blocked because an exact, current, licensed, machine-readable higher-education artifact could not be confirmed. This does not invalidate GLEIF.

The implementation model is:

1. `companies` remains the sole published Directory Record store.
2. Catalog performs no DDL or DML against `business_profiles`, `university_profiles`, or `verification_requests`.
3. Candidate intake and staff publication are two distinct `SECURITY DEFINER` RPC capabilities.
4. A dedicated restricted `catalog_worker` role/JWT may execute candidate intake only. The built-in `service_role` is rejected as the connector identity.
5. Staff publication may write only an explicit Directory-owned allowlist in `companies`; it pins neutral ownership/Verification fields and cannot accept operational or Profile fields.
6. Existing manual staff CRUD continues to coexist. The protected-boundary claim applies to Catalog workers and Catalog review/publication, not to every platform write.
7. Existing `audit_logs`, staff authorization helpers, taxonomies, feature flags, `pg_cron`, `pg_net`, and Vault are reused. Ten proposed tables are deferred or folded into a smaller safe Phase-1 set; no parallel published-record table is introduced.

Evidence keys used throughout:

- **[GATE]** `git fetch origin --prune`; exact remote-tip resolution; ledger read with `git show <sha>:<path>`.
- **[REPO]** repository at base SHA, paths in §18.
- **[DB]** read-only `pg_catalog`, `information_schema`, policy, role, extension, storage, cron, and migration-history queries against non-production on 2026-07-29.
- **[SRC-GLEIF]** official GLEIF sources and the non-persisted API probes recorded in §12.
- **[SRC-MOE]** official Ministry sources recorded in §13.

## 2. Gate and authority evidence

The corrected standalone gate **passed**:

- `origin/agent/nonprod-signup-fix` resolved exactly to `68c656d7d01578a1eafb98a2f82d6819d3c63500` after fetching origin. [GATE]
- `docs/command-center/reports/JID_MASTER_EXECUTION_LEDGER.md` read at that exact Git object records Specification 04 as `SHIPPED`. [GATE]
- `JID_Catalog_Automated_Ingestion_and_Directory_Maintenance_Spec_v1.3.md` identifies itself as the standalone Catalog design authority and expressly preserves the shipped Directory/Profile/Verification model; it does not reopen JID_02–JID_09. [GATE]
- The worktree was created from the exact resolved SHA, not from a moving local branch. [GATE]

The earlier `STALE_BASELINE` result was caused by the superseded chat-token condition and is not evidence of repository staleness.

## 3. Reconciled architecture invariants

| Invariant | Current evidence | Catalog consequence |
|---|---|---|
| `companies` is the Directory store | Public Catalog and staff Directory queries select `companies`; Profiles reference it by `directory_id`. [REPO][DB] | Publish new or approved changed Directory facts only to `companies`. Never create `directory_records`. |
| Directory Record is not owned Profile | Both Profile tables have a required owner and a unique required `directory_id` FK with `ON DELETE RESTRICT`. [DB] | Ingestion cannot create, update, delete, or infer a Profile. |
| Verification proves representation | `verification_requests` is applicant-owned workflow state and may result in a Profile; its `directory_id` points to `companies`. [REPO][DB] | Catalog never writes Verification state and never treats source evidence as representation proof. |
| Exactly three external actors | Constitution: Individual, Business, University. [REPO] | Worker/staff DB roles are internal capabilities, not product actors. |
| Published company merge is unsafe | Fifteen live inbound FKs, views, functions, routes, and jobs depend on `companies`. [DB][REPO] | Candidate attachment is allowed; `companies`-to-`companies` merge/rekey/retire is deferred to a separate approved specification. |
| No fabricated metrics or claims | Constitution and Data-Truth rules. [REPO] | Run counts and confidence must derive from stored evidence/events; missing data remains missing. |

## 4. Exact live schema, RLS, and grant inventory

### 4.1 `companies`

**Table state:** RLS enabled, not forced; 8 rows at inspection time; no live non-internal table trigger. [DB]

**Columns, in physical order (a dropped historical ordinal exists before `university_short_code`):**

| Group | Exact columns and material properties |
|---|---|
| Identity | `id uuid PK DEFAULT gen_random_uuid()`; `name text NOT NULL DEFAULT 'Stub Company'`; `name_ar text`; `domains text[] NOT NULL DEFAULT '{stub.local}'`; `entity_type entity_type_enum NOT NULL DEFAULT 'business'` (`business`, `university`) |
| Deprecated ownership/Verification | `is_verified boolean DEFAULT false`; `claimed_by uuid NULL`; `university_short_code text`; `total_students_claimed integer DEFAULT 0`; `claim_requested_at timestamptz`; `entity_state text DEFAULT 'unclaimed'` |
| Profile-like display fields retained on Directory | `tagline_ar`, `tagline_en`, `about_long_ar`, `about_long_en`, `founded_year`, `employee_count_range`, `office_locations jsonb DEFAULT '[]'` |
| Operational/metrics | `subscription_tier text DEFAULT 'free'`; `avg_response_days`, `response_rate_pct`, `total_jobs_posted_12mo integer DEFAULT 0`, `last_activity_at`, `is_on_honor_roll boolean DEFAULT false` |
| Directory reference/display | `slug`; `ownership_type ownership_enum`; `sector_id`; `region_id`; `city`; `description_ar`; `description_en`; `logo_url`; `cover_url`; `career_page_url`; `website_url`; `linkedin_url`; `twitter_url` |
| Link/order/lifecycle | `link_status link_status_enum DEFAULT 'pending'` (`healthy`, `broken`, `pending`); `last_audit_at`; `broken_since`; `manual_order integer DEFAULT 0`; `is_active boolean DEFAULT true` |
| Timestamps/search | `created_at`; `updated_at`; generated `search_vector` |

**Constraints:** [DB]

- PK on `id`.
- `cardinality(domains) > 0`.
- `entity_state` limited to the shipped state list.
- `founded_year` between 1800 and 2100 when present.
- `total_students_claimed >= 0`.
- `claimed_by → profiles(id) ON DELETE SET NULL`.
- `region_id → regions(id) ON DELETE SET NULL`.
- `sector_id → sectors(id) ON DELETE SET NULL`.

The specification’s proposed empty domain array conflicts with the live `cardinality(domains) > 0` check. Publication must not use `stub.local`; Session B cannot silently choose between rejecting domainless candidates and changing the constraint. This is blocker **B2**. [DB][REPO]

**Indexes:** [DB]

- PK; ordinary indexes on `name`, `name_ar`, `entity_type`, `entity_state`, `claimed_by`, `city`, `ownership_type`, `region_id`, `sector_id`, `link_status`, `manual_order`, and `is_active`.
- Partial unique index on non-null `slug`.
- Partial unique index on non-null `university_short_code`.
- GIN on `search_vector`.
- Arabic and English full-text indexes.

**Policies:** [DB]

| Policy effect | Roles | Predicate/boundary |
|---|---|---|
| Public read | `anon`, `authenticated` | `is_active = true` |
| Staff read all | `authenticated` | `profiles.role IN ('staff','super_admin')` |
| Staff insert | `authenticated` | `WITH CHECK` staff or super admin |
| Staff update | `authenticated` | `USING` and `WITH CHECK` staff or super admin |
| Delete | `authenticated` | super admin only |

**Table grants:** `anon`, `authenticated`, `service_role`, and `postgres` each currently have table-level `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER`; RLS constrains `anon`/`authenticated`, while `service_role` has `rolbypassrls=true`. [DB] This is why a service-role connector would be globally over-privileged.

**Existing application write paths:** [REPO]

- `src/app/[locale]/(staff)/staff/directory/actions.ts`: manual staff insert/update.
- `src/app/[locale]/(staff)/staff/entities/actions.ts`: staff entity edits, using privileged server patterns and audit.
- `src/app/[locale]/(sys)/sys/entities/actions.ts`: super-admin operational edits.
- `src/lib/staff/directory-queries.ts` and `src/lib/staff/entities-queries.ts`: staff reads.
- `src/lib/entity/companies.ts`, `src/lib/onboarding/entity-actions.ts`, and `src/lib/profile/mutations.ts`: older organization paths that attempt Directory writes, but current RLS does not grant ordinary owners a valid direct company-write authority.
- `supabase/functions/link-auditor/index.ts`: service-role link-field update.
- `approve_correction_suggestion(...)`: live permission-checked correction RPC with row locking, field allowlisting, and audit.

`staff/directory/actions.ts` supplies `link_status='unknown'`, but the live enum has only `healthy`, `broken`, and `pending`. This is current application/database drift, outside Session A edits, and must be verified before relying on that CRUD path. [REPO][DB]

**Public reads:** [REPO][DB]

- `src/lib/queries/catalog.ts`: server Catalog list/detail queries; filters active rows and joins published Profiles under RLS.
- `src/lib/catalog/client.ts`, `src/lib/hooks/use-catalog-companies-infinite.ts`: `/api/catalog` client flow.
- `src/app/api/catalog/route.ts`, `src/app/api/catalog/[slug]/route.ts`: public API.
- `src/app/[locale]/(public)/catalog/**`: Catalog page and components.
- `src/app/[locale]/(public)/companies/[slug]/profile/page.tsx`: company public route.
- `src/lib/seo/build-sitemap.ts`, `src/lib/seo/sitemap-data.ts`: public discovery.

### 4.2 `business_profiles`

**State:** RLS enabled, not forced; 1 row; no live non-internal trigger. [DB]

**Columns:** `id`; `directory_id uuid NOT NULL UNIQUE`; `owner_user_id uuid NOT NULL`; `display_name_ar NOT NULL`; `display_name_en`; `tagline_ar`; `about_ar`; `about_en`; `founded_year`; `employee_count_range`; `cover_image_url`; `gallery jsonb DEFAULT '[]'`; `status text DEFAULT 'draft'`; `published_at`; `verified_badge boolean DEFAULT true`; `created_at`; `updated_at`; `verified_domains text[] DEFAULT '{}'`. [DB]

**Constraints/indexes:** status check `draft|published|suspended`; `directory_id → companies(id) ON DELETE RESTRICT`; owner FK to `auth.users`; PK; unique `directory_id`; owner index; partial published-status index; GIN on `verified_domains`. [DB]

**Policies:** public read published; owner read; staff/super-admin read; owner update only when the resulting row is not suspended. There is no direct INSERT or DELETE policy. Table grants are the same broad role-level grants described for `companies`, with RLS as the ordinary-role boundary. [DB]

**Catalog proof:** `directory_id` is a required one-to-one anchor and `owner_user_id` is required. Creating or modifying this row would assert an owned Profile, which source ingestion is forbidden to do. Neither RPC may have grants or SQL references permitting Profile DML. [DB][REPO]

### 4.3 `university_profiles`

**State:** RLS enabled, not forced; no live non-internal trigger. [DB]

**Columns:** `id`; required unique `directory_id`; required `owner_user_id`; Arabic/English display names and about fields; `university_type`; accreditation/student population/established year/partnership fields; cover; `status`; `published_at`; `verified_badge`; timestamps; `verified_domains`. [DB]

**Constraints/indexes:** `university_type` is `government|private`; Profile status boundary matches the business pattern; `directory_id → companies(id) ON DELETE RESTRICT`; owner FK to `auth.users`; unique directory anchor and owner/status/domain indexes. [DB]

**Policies/grants:** public read published; owner read; staff/super-admin read; owner update only outside suspended state; no INSERT or DELETE policy; broad table grants constrained by RLS for ordinary roles. [DB]

**Catalog proof:** the same required owner and one-to-one Directory anchor prove this is not an ingestion target. [DB][REPO]

### 4.4 `verification_requests`

**State:** RLS enabled, not forced; no live non-internal trigger in the inspected environment. [DB]

**Columns:** `id`; `applicant_user_id`; `directory_id`; `company_name`; `business_email`; `claimant_name`; `claimant_title`; `evidence_urls DEFAULT '[]'`; `status claim_status_enum DEFAULT 'pending'`; `verification_type claim_type_enum DEFAULT 'business'`; review actor/time/notes/rejection and reapply fields; `domain_verified`; timestamps; assignment/first-view/SLA fields; `resulting_profile_id`; `resulting_profile_type`; `verified_domains`. [DB]

**Constraints:** [DB]

- Historical PK name `claim_requests_pkey`.
- Historical email check name.
- `resulting_profile_type` limited to `business`, `university`, or null.
- `applicant_user_id → profiles(id) ON DELETE CASCADE`.
- `directory_id → companies(id) ON DELETE CASCADE`.
- reviewer/assignee/first-view FKs use `SET NULL`.

**Policies/grants:** applicant can insert own request and read own request; staff/super-admin can read; no direct UPDATE policy. Broad table grants remain present, with RLS as the ordinary-role boundary. [DB]

**Legacy internal names preserved:** [DB][REPO]

- Types: `claim_status_enum`, `claim_type_enum` and their array types.
- Functions: `assign_claim_to_self`, `claim_due_communication_batches`, `notify_claim_decision`, `review_claim`, `review_claim_request`, `viewer_has_approved_company_claim`.
- Constraints/indexes: `claim_requests_*`, `idx_claim_requests_*`, `idx_claims_assigned`, `companies_claimed_by_fkey`, `companies_total_students_claimed_nonnegative_chk`, `idx_companies_claimed_by`.

Catalog must neither rename these objects nor read/write this workflow. Source authority about legal existence is not evidence that a JID user represents the entity. [DB][REPO]

### 4.5 Repository-to-non-production migration drift

The live migration history contains relevant versions `030`, `105`, `107`, `108`, and `111`, but not repository migrations:

- `supabase/migrations/20260720072615_harden_verification_request_insert_boundary.sql`
- `supabase/migrations/127_verification_assigned_reviewer_authorization.sql`

The corresponding live trigger inventory is empty on all four reconciled tables. The repository therefore describes a newer Verification boundary than the connected non-production database. No Catalog DDL should be authored against an ambiguous target state. Resolve drift first (**B1**). [DB][REPO]

## 5. Complete `companies` dependency map

### 5.1 Inbound foreign keys

The live database has these 15 inbound FKs to `companies(id)`: [DB]

| Referencing table/column | Delete action |
|---|---|
| `applications.company_id` | CASCADE |
| `business_profiles.directory_id` | RESTRICT |
| `communication_batches.company_id` | CASCADE |
| `communication_templates.company_id` | CASCADE |
| `directory_correction_suggestions.directory_id` | CASCADE |
| `entity_team_invitations.company_id` | CASCADE |
| `jobs.company_id` | CASCADE |
| `lammah_opportunities.company_id` | SET NULL |
| `lammah_sources.company_id` | SET NULL |
| `link_audit_log.company_id` | CASCADE |
| `profile_views.viewer_company_id` | CASCADE |
| `ssis_screenings.company_id` | CASCADE |
| `subscriptions.company_id` | CASCADE |
| `university_profiles.directory_id` | RESTRICT |
| `verification_requests.directory_id` | CASCADE |

### 5.2 Views and database functions

Live views:

- `university_dashboard_view` references `companies`, including legacy `claimed_by` and `university_short_code`.
- `platform_metrics_snapshot` counts Directory coverage from `companies` separately from published Business/University Profiles. [DB]

Live function bodies containing `companies` references: [DB]

`approve_correction_suggestion`, `approve_verification_request`, `assemble_ssis_generation_context`, `expire_stale_applications`, `get_profile_view_stats`, `invite_ssis_applicants`, `notify_claim_decision`, `notify_radar_status_change`, `refresh_company_badges`, `run_mandate_matching_for_job`, `toggle_job_boost`, `user_can_manage_company_communication`, `user_can_manage_ssis`, `user_owns_job_for_communication`, and `user_owns_ssis_job`.

There is no live non-internal trigger directly on `companies`; application, RPC, and scheduled-function dependencies still make identity-changing merge operations unsafe. [DB]

### 5.3 Routes and server/background consumers

Repository reference scans found the following dependency groups: [REPO]

- Public Catalog/API/SEO: `src/app/api/catalog/**`, `src/app/[locale]/(public)/catalog/**`, `src/app/[locale]/(public)/companies/[slug]/profile/page.tsx`, `src/lib/queries/catalog.ts`, `src/lib/catalog/client.ts`, `src/lib/hooks/use-catalog-companies-infinite.ts`, `src/lib/seo/**`.
- Staff/system administration: `src/app/[locale]/(staff)/staff/directory/**`, `src/app/[locale]/(staff)/staff/entities/**`, `src/app/[locale]/(sys)/sys/entities/**`, and their `src/lib/staff/**` / `src/lib/sys/**` queries.
- Verification/onboarding/Profile: `src/app/[locale]/(company)/company/create-profile/**`, `src/app/[locale]/(university)/university/create-profile/**`, `src/app/[locale]/(staff)/staff/verification/**`, `src/lib/auth/verification.ts`, `src/lib/auth/organization-profile.ts`, `src/lib/entity/claims.ts`, `src/lib/onboarding/**`, `src/lib/profile/**`.
- Jobs/applications/communications/billing/SSIS/Lammah: `src/lib/jobs/**`, `src/lib/applications/**`, `src/lib/lammah/client.ts`, staff billing actions, and the relevant Edge Functions.
- Background functions: `supabase/functions/link-auditor/index.ts`, `process-communication-batches/index.ts`, `send-expiry-notification/index.ts`, `send-rejection-email/index.ts`, and `ssis-generate-screening/index.ts`.

Relevant active live cron entries:

- Job 10: every six hours, `refresh_company_badges()`.
- Job 11: daily link-auditor invocation through `pg_net`.
- Job 26: every six hours, Lammah crawler invocation through `pg_net`. [DB]

The connected project listed no deployed Edge Functions even though cron SQL refers to them, adding operational drift. `refresh_company_badges` also remains scheduled although commitment scoring was killed by the Constitution/migration 089; this pre-existing issue is outside Catalog scope and must not be “fixed” incidentally. [DB][REPO]

**Merge conclusion:** changing a published company identity or consolidating two rows would require dependency-aware decisions across Profiles, Verification, jobs, applications, communications, billing, SSIS, Lammah, analytics, and destructive FK actions. Phase 1 may attach a candidate to one deterministically matched existing `companies.id` and record a review-only company pair; it may not merge companies. [DB][REPO]

## 6. Existing-infrastructure reuse map

| Concern | Current evidence | Decision |
|---|---|---|
| Audit | `audit_logs` stores actor, action, entity type/id, old/new values, metadata, IP/user agent, timestamp; immutable update/delete triggers; `_write_audit_log` is a restricted definer function. [DB][REPO] | **Reuse.** Store source/run/worker/reason in metadata; allow null human actor for named system jobs. Do not create `directory_audit_events`. |
| Staff authorization | `requireStaffShellAccess` enforces session, role, MFA AAL2, and 8-hour session; DB helpers include `current_user_role`, `is_privileged_staff`, `is_admin_or_above`, `is_staff_or_super_admin`. [REPO][DB] | **Reuse.** Reviewer: existing `staff`/`super_admin`; publication-policy/retention: `super_admin`. Do not invent an external actor. Current Directory policy excludes `admin`; role expansion is a founder/security decision. |
| Cron/network | `pg_cron 1.6.4`, `pg_net 0.20.3` installed; five-plus live scheduled families. [DB] | **Reuse primitives** after secret/auth correction; use bounded schedules and jitter. |
| Secrets | Vault extension installed; Edge Functions use environment secrets; current cron reads `app.settings.service_role_key`. [DB][REPO] | **Reuse Vault/Edge Function secrets**, but never store secret values in Catalog rows and never reuse global service key for the worker. |
| Queue/retry/dead letter | No generic platform queue, job, or dead-letter table. `email_outbox` attempts/errors are email-specific. `lammah_*` is domain-specific. `pgmq` is not installed. [DB] | **Do not reuse domain tables.** Phase 1 needs `directory_dead_letters`; use `directory_sync_runs` plus bounded per-run work rather than add a generic queue before measured need. |
| Raw evidence storage | No live Storage bucket or storage policy. [DB] | **New private bucket required**, with metadata in `directory_raw_evidence`; no public URL. |
| Feature flags | Existing `feature_flags` table, RPC/cache path, and typed keys in `src/lib/feature-flags/keys.ts`. [DB][REPO] | **Reuse** for kill switch/scheduling/review visibility. A new typed key is Session B code scope, not Session A. |
| Taxonomies | `regions` (3 rows), `sectors` (6 rows), company enums for entity/ownership/link; `city` is free text. [DB] | **Reuse IDs/enums only after mapping review.** Do not create a city taxonomy in Phase 1. Unmapped source values remain source facts/review data. |
| University lookups | `universities_catalog` has 5 rows, `colleges_catalog` 8, `majors_catalog` 0. [DB] | **Not a Directory replacement** and not authoritative source evidence. May be a reviewer comparison only. |
| URL/domain handling | Utilities lower-case/strip `@` and test exact/subdomain relationships. [REPO] | **Insufficient for retrieval.** Add deterministic URL canonicalization, IDNA/punycode, eTLD+1, redirect/SSRF controls before connectors. |
| HTML/content sanitization | Lammah uses simplistic regex removal; no shared hostile-content sanitizer found. [REPO] | **Do not reuse as a security boundary.** Session B must specify a size-bounded non-executing parser and prompt-injection isolation. |
| CSV | Current export quoting handles delimiters/newlines but does not neutralize spreadsheet formulas. [REPO] | **Insufficient.** Import/export must defuse leading `=`, `+`, `-`, `@`, tab, and carriage-return payloads. |
| Name normalization/duplicates | No reusable Arabic/English organization normalizer or explainable duplicate engine found; `pg_trgm 1.6` is installed. [DB][REPO] | **Build deterministic versioned normalization.** Use trigram only as an explainable review signal; never as automatic identity. |
| Lammah crawler | Has cron, timeout, hash/idempotent patterns, but follows redirects, lacks an SSRF allowlist, uses service role, and is Lammah-specific. [REPO][DB] | Reuse only conceptual patterns; do not make it the Catalog connector or share its tables. |

Official Supabase evidence supports these choices: custom roles can be created for per-service access, while `service_role` bypasses RLS ([Database roles](https://supabase.com/docs/guides/database/postgres/roles)); scheduled Edge Function calls use `pg_cron`/`pg_net` and recommend Vault for secrets ([Schedule functions](https://supabase.com/docs/guides/functions/schedule-functions)); secret/admin keys are server-only and bypass ordinary RLS expectations ([Function authentication](https://supabase.com/docs/guides/functions/auth)).

## 7. Proposed-vs-existing table reconciliation

### 7.1 Exact minimal Phase-1 set

Create **11 adjacent tables**, all default-deny with RLS and no worker table grants:

| New table | Why it remains necessary |
|---|---|
| `directory_sources` | Govern exact source/artifact/API, licence state/version, authority tier, approved hosts, cadence/limits, parser/config version, secret names, and a versioned JSONB field-authority map. Folds proposed `directory_source_fields` into versioned config for two Phase-1 sources. |
| `directory_sync_runs` | Real run state/counts, source/config/parser versions, timestamps, cursor/checkpoint, outcome/error summary. |
| `directory_raw_evidence` | Immutable checksum, source/run/request identity, storage object pointer, media type/size, capture time, parser version, retention marker. |
| `directory_import_candidates` | One source-record/content-version candidate with classification, state, routing, idempotency key, and optional attached `companies.id`. |
| `directory_candidate_facts` | Typed extracted values with evidence link, source field, transformation history, authority, confidence reason, parser/model metadata. |
| `directory_record_identifiers` | Typed, validated published identifiers such as LEI, with source/evidence provenance and safe partial uniqueness. This is required for deterministic identity. |
| `directory_record_facts` | Active/superseded published facts and per-field evidence chain. Name aliases/historical names are represented as typed fact roles in Phase 1. |
| `directory_source_links` | Stable `companies.id ↔ source/source_record_id` binding, content/checksum state, last seen, disappearance/staleness evidence. |
| `directory_duplicate_candidates` | Candidate↔candidate, candidate↔company, and review-only company↔company propositions with signals/conflicts/threshold version/decision. |
| `directory_review_queue` | Assignment, decision, reasons, priority inputs, and links to candidates/changes/duplicates for mandatory human review. |
| `directory_dead_letters` | Exhausted work unit, evidence/payload reference, error class, attempt count, retry timestamps, and audited resolution. |

Plus one **new private Storage bucket** for evidence payloads. It is not a published data store. [DB][REPO]

### 7.2 Fold, reuse, or defer

| Specification proposal | Reconciliation |
|---|---|
| `directory_source_fields` | Fold into versioned `directory_sources.field_authority_config` JSONB in Phase 1; split later only if querying/governance requires it. |
| `directory_record_aliases` | Fold into typed `directory_record_facts` name roles for Phase 1. Split when public alias search is implemented. |
| `directory_candidate_merge_events` | Defer. Phase 1 uses idempotent same-source no-op and review queue; no candidate consolidation workflow beyond explicit attach/publication. |
| `directory_lifecycle_events` | Reuse immutable `audit_logs` plus state/history in candidates/facts/source links. A dedicated high-volume lifecycle stream may be added only with measured need. |
| `directory_audit_events` | Reuse `audit_logs`. |
| Generic job queue | Defer. Use a bounded connector invocation per `directory_sync_runs` row and `directory_dead_letters`. Add a queue only after throughput/backpressure evidence. |
| Published `directory_records` | Prohibited; `companies` is authoritative. |

This smaller set preserves source governance, evidence, provenance, deterministic identity, review, failure handling, and published change history without premature workflow tables. [DB][REPO]

## 8. Privileged boundaries

### 8.1 Candidate intake

Use a distinct `SECURITY DEFINER public.ingest_directory_candidate(...)` RPC. It must:

- be owned by a non-login owner; set an explicit safe `search_path`;
- revoke `PUBLIC`, `anon`, `authenticated`, and `service_role` execute unless a narrowly justified server mediator requires the last grant;
- grant execute to `catalog_worker` only;
- re-read the source registry and require approved licence/source/config state;
- accept structured values, evidence metadata, facts, and an idempotency key—not executable SQL or arbitrary table/column names;
- validate source identity, source record ID, checksum, media bounds, classification, allowed facts, and evidence chain;
- transactionally write only source/run/evidence/candidate/fact/review/dead-letter/audit domain rows;
- perform deterministic duplicate checks but never merge published companies;
- perform **zero** DML on `companies`, both Profile tables, and `verification_requests`.

Two RPCs are safer than one service with shared database authority because PostgreSQL grants can prove the worker lacks publication capability. [DB][REPO]

### 8.2 Staff publication

Use a separate `SECURITY DEFINER public.publish_directory_candidate(candidate_id, decision, reason, expected_version)` RPC. It must:

1. authenticate the current user and call the existing staff/MFA/role pattern;
2. require `staff` or `super_admin` for reviewed publication, reserving source/retention/policy administration to `super_admin`;
3. lock and re-read candidate, review, evidence, source approval, and target company;
4. reject unresolved deterministic conflicts, missing evidence chains, placeholders, stale expected versions, and unsupported entity types;
5. insert a new `companies` row only with explicit values; never rely on `Stub Company` or `stub.local`;
6. pin `is_verified=false`, `claimed_by=NULL`, and `entity_state='unclaimed'`, and reject these keys if supplied by source payload;
7. on update, modify only an approved Directory allowlist such as `name`, `name_ar`, `domains`, `entity_type`, `ownership_type`, `sector_id`, `region_id`, `city`, `founded_year`, public URLs/descriptions, and source-maintained lifecycle fields after individual field reconciliation;
8. never touch subscription, response/activity/job metrics, honor-roll state, Profile display ownership, Verification state, claimant fields, or any Profile/Verification table;
9. attach to an existing company only on a validated deterministic identifier/source link with no conflict;
10. write record facts, identifier/source link, review decision, and audit in the same transaction.

The exact allowlist must be frozen in Session B tests against the live column inventory. [DB][REPO]

### 8.3 Coexistence with manual staff CRUD

Current staff policies and actions still permit manual `companies` insert/update. Catalog therefore claims only:

- workers cannot publish;
- Catalog review publishes only through the publication RPC;
- Catalog-origin changes have source links, facts, evidence, and audit;
- existing manual staff CRUD remains a separate, auditable operational path.

A globally exclusive `companies` write boundary would require a separate RLS/grant/application migration and is not part of Catalog Phase 1. [DB][REPO]

## 9. Worker isolation recommendation

**Recommended:** a dedicated Postgres role/JWT named `catalog_worker`, not the built-in `service_role`.

Minimum proof:

- `NOLOGIN`, `NOBYPASSRLS`, no inheritance from privileged roles;
- no schema-create capability;
- no direct table privileges on `companies`, Profiles, Verification, source/evidence/candidate tables, Storage metadata, or `audit_logs`;
- `USAGE` on the RPC schema and `EXECUTE` on `ingest_directory_candidate` only;
- no execute on `publish_directory_candidate`, staff/source-policy RPCs, or unrelated definer functions;
- automated tests impersonate `catalog_worker` and prove every prohibited table DML and publication call fails.

The connector runtime may use a short-lived signed JWT carrying `role=catalog_worker`, issued/stored through a founder-approved server mechanism. Scheduler-to-function authentication and connector credentials must be named secrets in Vault/Edge Function secrets. If the platform cannot mint and validate that role safely, use an RPC-only mediator whose own database credential is equally restricted—not a service-role wrapper—and stop until the restriction is demonstrated. [DB][REPO]

The current environment has no `catalog_worker` role, while `service_role` and `postgres` bypass RLS. Worker identity is therefore blocker **B3**, not an implementation detail. [DB]

## 10. Security and privacy risks

| Risk | Required Phase-1 control |
|---|---|
| Over-privileged connector | Dedicated role/JWT; intake-only execute grant; negative permission tests. |
| SSRF/redirect abuse | Approved HTTPS host list; DNS/IP checks before and after redirect; block loopback/private/link-local/metadata; redirect cap; timeout/size/decompression caps. |
| Prompt/data injection | Non-executing parser; fetched content never controls destinations/tools; sanitize and bound model input; AI suggestions cannot become evidence. |
| Forged/homograph domains | IDNA canonicalization, punycode display, eTLD+1, shared-host exclusions, conflict review. |
| CSV/XLSX injection | Defuse formula-leading characters on import preview and export; retain raw immutable evidence privately. |
| Personal data | Extract organization fields only; do not extract personal emails/officer names; quarantine payloads dominated by personal data; retention review. |
| Evidence leakage | Private bucket, no signed URL in public APIs, metadata RLS, checksum rather than payload in audit logs. |
| Placeholder/fabrication | Explicit publication values; reject `Stub Company`, `stub.local`, unsupported facts, and evidence-free fields. |
| Duplicate damage | Deterministic identifiers beat name similarity; conflicts quarantine; company pairs review-only; no FK repointing. |
| Source disappearance | Mark source link/fact stale; never delete a company based on one disappearance. |
| Race/replay | Row locks, expected versions, partial unique idempotency indexes, checksum no-op, transactionally coupled publication/audit. |
| Grant regression | Post-migration privilege snapshots, RLS tests, Supabase security advisors, definer `search_path` tests. |

## 11. GLEIF source qualification — `QUALIFIED_WITH_LIMITATIONS`

**Official access and terms**

- GLEIF’s production API exposes Golden-Copy-backed LEI search/filter functionality ([GLEIF API](https://www.gleif.org/en/lei-data/gleif-api/); [API documentation](https://documenter.getpostman.com/view/7679680/SVYrrxuU)).
- Golden Copy Level-1 files are available as XML, CSV, and JSON; GLEIF publishes three sets daily and supplies 8-hour, 24-hour, 7-day, and 31-day delta files ([Golden Copy downloads](https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy); [Specification v2.2](https://www.gleif.org/media/pages/lei-data/gleif-golden-copy/adb04dfa47-1746444974/2022-02-23_gleif-golden-copy-and-delta-files_v2.2-final.pdf)).
- LEI data accessed by download or API is free and provided under CC0 1.0, subject to the non-endorsement and access-service conditions ([LEI Data Terms of Use](https://www.gleif.org/en/meta/lei-data-terms-of-use/)).

**Format/schema:** current Level-1 data is LEI-CDF 3.1. GLEIF publishes supporting XML schemas and XML/JSON/CSV samples ([Supporting documents](https://www.gleif.org/en/lei-data/access-and-use-lei-data/supporting-documents)). [SRC-GLEIF]

**Saudi filter semantics:** query `GET /api/v1/lei-records?filter[entity.jurisdiction]=SA`. The official fields endpoint identifies `entity.jurisdiction` as “Jurisdiction of Formation”, supporting `MATCH`, `NOT_MATCH`, and `IN`; the accepted value is an ISO 3166-1 alpha-2 or permitted ISO 3166-2 jurisdiction code ([Accepted legal jurisdictions](https://www.gleif.org/en/lei-data/code-lists/gleif-accepted-legal-jurisdictions-code-list)). It is **legal jurisdiction**, not address country, headquarters, nationality, or “does business in Saudi Arabia.” [SRC-GLEIF]

**Operational limits:** API page size is 1–200 and the documented rate limit is 60 requests/minute/user. Golden Copy is better for full/backfill and delta processing; API is appropriate for the small Phase-1 probe and targeted verification. Respect 429/backoff and use jitter around Golden Copy publication. [SRC-GLEIF]

**Available/authoritative Level-1 facts:** [SRC-GLEIF]

- LEI (stable source identity);
- official legal name, other/transliterated/historical names;
- legal and headquarters addresses;
- jurisdiction of formation;
- entity legal form/category/subcategory and entity status;
- registration authority and entity identifier when reported;
- entity creation/event/successor data;
- LEI registration status, initial registration, last update, next renewal, managing LOU, and validation source/authority.

GLEIF is Tier 1 for LEI identity and its validated LEI reference fields. It is not authoritative for JID ownership/Verification, hiring/operations, public marketing descriptions, or a claim that every Saudi company has an LEI.

**Lifecycle enumerations verified from the official fields endpoint:** `entity.status = ACTIVE|INACTIVE|NULL`; `registration.status = ISSUED|LAPSED|ANNULLED|PENDING_TRANSFER|PENDING_ARCHIVAL|DUPLICATE|RETIRED|MERGED`. [SRC-GLEIF]

**Approximate volume:** a lawful, one-record, non-persisted request on 2026-07-29 returned `meta.pagination.total = 5,887` for `entity.jurisdiction=SA`; the sample had jurisdiction `SA`, entity `ACTIVE`, registration `ISSUED`. Treat 5,887 as a point-in-time API count, not a product metric or comprehensive business population. No bulk data was downloaded or stored. [SRC-GLEIF]

**Identity/idempotency/evidence:**

- `source_record_id = LEI`.
- Evidence version = immutable response/file bytes SHA-256 plus GLEIF publication timestamp/last-update and retrieval URL.
- Candidate idempotency key = `source_id + LEI + evidence_sha256 + parser_version`.
- Same LEI/checksum/parser is a no-op; changed checksum produces a new evidence/fact version attached to the same source link.
- Backfill uses the Level-1 Golden Copy; refresh uses 8-hour or 24-hour delta files. Store headers, redirect-final URL, retrieval time, content type/length, file name/publication time, and checksum.

**Limitations:** LEI coverage is voluntary/regulatory-use driven and is not a comprehensive Saudi commercial registry. A lapsed LEI is not automatically a closed company; an inactive/merged status requires evidence-preserving human review. GLEIF’s own terms disclaim completeness/accuracy and prohibit implying endorsement. [SRC-GLEIF]

## 12. Ministry source qualification — `BLOCKED_SOURCE_QUALIFICATION`

The official Ministry [Open Data page](https://www.moe.gov.sa/en/knowledgecenter/dataandstats/Pages/opendata.aspx) now directs users to its publisher presence on the national [Open Data Platform](https://open.data.gov.sa/en/publishers/3910a763-1829-445f-97b1-2bd988249b7e). The official historical page titled [Geographic Distribution of Higher Education Institutions](https://www.moe.gov.sa/ar/knowledgecenter/dataandstats/edustatdata/DocLib/Table9-03_36-37.html) exposes an HTML table with region, city, university, and college/institute columns for academic year 1436–1437. [SRC-MOE]

That evidence is insufficient for the selected connector:

- no exact current downloadable CSV/XLSX/JSON artifact URL was confirmed;
- no artifact-specific licence/reuse version and publication/update date was confirmed;
- the historical HTML mixes university and college/institute rows and is not the required machine-readable artifact;
- an unambiguous stable institution-level source record identifier could not be demonstrated;
- therefore schema, separation rules for university/college/institute/branch/deanship, refresh cadence, checksum baseline, and disappearance semantics cannot be approved.

The connector is blocked rather than replaced with webpage scraping. Resolution requires a source steward to record the exact artifact URL, publisher/dataset IDs, licence/version, publication date, schema/data dictionary, stable row identity, institution-type separation rule, and checksum. After qualification, disappearance must mark source facts stale and queue review; it must never delete a Directory row. [SRC-MOE][REPO]

## 13. Phase-1 pilot samples

### GLEIF

Recommend **120 candidates**, all human reviewed:

- 60 deterministic stratified records: 30 `ACTIVE+ISSUED`, 15 `ACTIVE+LAPSED`, and 15 lifecycle/edge statuses where available.
- 30 name/language/address edge cases: Arabic-only/multilingual names, transliterations, missing domains, long names, and Saudi subdivision/address variations.
- 30 resolution cases: exact existing LEI/source link, probable name match without shared identifier, conflicting identifiers, and no existing company match.

Sampling is seeded and reproducible from sorted LEI values; it does not imply publication quotas. If a stratum has fewer than its allocation, include all and record the real count. The pilot tests parser and reviewer decisions; all 120 remain review-gated. [SRC-GLEIF][REPO]

### Ministry

**Zero candidates until qualification.** Once an approved artifact exists, propose 60 institution-level rows stratified across region, public/private type if the artifact authoritatively supplies it, Arabic/English name availability, and ambiguous institution-unit rows. Every row remains human reviewed. [SRC-MOE][REPO]

## 14. Open decisions and implementation blockers before DDL

| ID | Exact cause | Required resolution |
|---|---|---|
| **B1** | Connected non-production lacks repository Verification migrations/triggers and deployed Edge Functions referenced by cron. | Declare the authoritative disposable/local/non-production schema target and reconcile its migration history before authoring Catalog DDL. No production apply. |
| **B2** | `companies.domains` is `NOT NULL`, defaults to `stub.local`, and requires cardinality > 0; spec requires empty array when no validated domain. | Founder/schema decision: relax the check/default in a separately reviewed migration, or make a validated domain mandatory for Phase-1 publication. RPC must reject placeholders either way. |
| **B3** | No restricted worker role/JWT issuance path exists; `service_role` bypasses RLS and has broad table grants. | Approve and prove a dedicated `catalog_worker` role/JWT or equally narrow mediator credential, including negative permission tests. |
| **B4 / OD-3** | Evidence retention default and licence-expiry deletion behavior remain open. | Approve retention N (proposal 180 days after supersession while no active fact depends on payload) and whether expiry deletes automatically or queues steward confirmation. |
| **B5** | Current role granularity/policies differ (`admin` exists in staff shell but Directory write policies use staff/super-admin). | Confirm Phase-1 reviewer/steward role matrix; recommendation: staff reviews, super-admin governs sources/retention/policy, no `admin` expansion without explicit decision. |
| **B6** | Ministry artifact not qualified. | Non-blocking for GLEIF foundation; keep Ministry connector disabled until §12 evidence is complete. |

The `link_status='unknown'` application/live-enum mismatch and existing cron/function deployment drift are recorded risks. They do not authorize unrelated repairs in Session B.

## 15. Exact proposed Session B scope

Session B should be **Catalog foundation DDL/security only**, on an explicitly reconciled disposable local or approved non-production target:

1. close B1–B5 decisions in the task packet;
2. create the 11 adjacent tables and private evidence bucket/policies from §7;
3. add strict enums/checks/FKs (`RESTRICT` for evidence/history), idempotency indexes, immutable-history enforcement, and default-deny RLS;
4. add/reuse audited source-governance helpers;
5. implement `ingest_directory_candidate` and `publish_directory_candidate` with separate owners/grants and explicit safe `search_path`;
6. create and test the `catalog_worker` capability without exposing a secret or granting table DML;
7. add database tests for role denial, Profile/Verification zero-DML, placeholder rejection, neutral Verification pins, evidence chain, idempotency, concurrent replay, company-pair no-DML, audit immutability, and rollback;
8. run security/performance advisors and generate types if the approved task includes repository schema artifacts.

Session B must **not** implement a GLEIF connector, Ministry connector, review UI, public API, production SQL, production deployment, automatic publication, company merge, or changes to Profiles/Verification/manual staff CRUD.

## 16. Explicit deferred work

- GLEIF network connector, Golden Copy/delta downloader, parser, scheduler, and 120-record pilot.
- Ministry connector until source qualification completes.
- Staff review workspace and source-steward UI.
- Feature-flag UI and scheduled runtime enablement.
- Probabilistic/AI entity-resolution tuning; AI remains suggestion-only.
- Reversible candidate consolidation and `directory_candidate_merge_events`.
- Dedicated alias table/public alias search.
- Generic distributed queue or `pgmq`; add only with demonstrated throughput need.
- Lifecycle automation, source-health rollups, retention job, and parser shadow reprocessing.
- Automatic publication (Phase 3+ only after measured precision and founder policy).
- Public request-to-add flow.
- Any published `companies` merge/rekey/retire or FK repointing.
- Global hardening/removal of existing manual staff company CRUD.
- Repair of unrelated staff `link_status`, commitment-badge cron, Verification drift, or Edge Function deployment drift.
- Any production SQL, secrets, data import, deployment, merge, or target-branch promotion.

## 17. Validation

The unmodified baseline suite must be recorded after this report is finalized:

| Command | Result |
|---|---|
| `git diff --check` | PASS — exit 0, no output |
| `corepack pnpm install --frozen-lockfile` | PASS — exit 0; lockfile unchanged; 829 packages reused from cache; Husky reported the expected isolated-worktree `.git can't be found` prepare warning |
| `corepack pnpm lint` | PASS — exit 0; no ESLint warnings or errors |
| `corepack pnpm type-check` | PASS — exit 0; `tsc --noEmit` |
| `corepack pnpm test` | PASS — exit 0; 27 files / 254 tests passed; 7 files / 61 tests skipped |
| `corepack pnpm build` | PASS — exit 0; Next.js 14.2.15 compiled, checked types, generated 276 static pages, and completed optimization/tracing |

## 18. Exact repository paths inspected

Mandatory authority:

- `docs/JID_Agent_Operating_Constitution.md`
- `docs/command-center/CODEX_OPERATING_MODEL.md`
- `docs/command-center/MASTER_PLAN.md`
- `docs/command-center/reports/JID_MASTER_EXECUTION_LEDGER.md` at base SHA
- attached `JID_01_Current_State_and_Architecture_Baseline.md`
- attached `JID_Catalog_Automated_Ingestion_and_Directory_Maintenance_Spec_v1.3.md`

Schema/migrations:

- `supabase/config.toml`
- `supabase/migrations/032_audit_logs.sql`
- `supabase/migrations/035_security_definer_functions.sql`
- `supabase/migrations/036_rls_auth_policies.sql`
- `supabase/migrations/044_company_catalog_reconciliation.sql`
- `supabase/migrations/046_catalog_search_vector.sql`
- `supabase/migrations/047_catalog_claim_link_auditor.sql`
- `supabase/migrations/075_feature_flags_section7.sql`
- `supabase/migrations/081_notifications_schema.sql`
- `supabase/migrations/082_notification_dispatcher.sql`
- `supabase/migrations/083_notifications_realtime.sql`
- `supabase/migrations/084_notification_email_worker.sql`
- `supabase/migrations/085_digest_cron_engine.sql`
- `supabase/migrations/089_kill_commitment_score.sql`
- `supabase/migrations/095_lammah.sql`
- `supabase/migrations/102_cloud_feature_flags_infrastructure.sql`
- `supabase/migrations/103_business_profiles.sql`
- `supabase/migrations/104_university_profiles.sql`
- `supabase/migrations/105_verification_requests.sql`
- `supabase/migrations/106_directory_deprecations.sql`
- `supabase/migrations/107_verification_domain_capture.sql`
- `supabase/migrations/108_verification_service_functions.sql`
- `supabase/migrations/109_companies_directory_lockdown.sql`
- `supabase/migrations/110_profile_ownership_policies.sql`
- `supabase/migrations/111_verification_requests_lockdown.sql`
- `supabase/migrations/112_directory_correction_suggestions.sql`
- `supabase/migrations/114_jobs_business_profile_anchor.sql`
- `supabase/migrations/115_jobs_rls_reanchor.sql`
- `supabase/migrations/116_applications_rls_reanchor.sql`
- `supabase/migrations/127_verification_assigned_reviewer_authorization.sql`
- `supabase/migrations/20260720072615_harden_verification_request_insert_boundary.sql`
- `supabase/migrations/20260726183230_lammah_native_dedup_boundary.sql`
- `supabase/seed.sql`, `supabase/seed/companies.sql`, `supabase/seed/local-test-accounts.sql`, `supabase/seed/verify.sql`

Application/read/write/security infrastructure:

- `src/lib/supabase/types.ts`, `src/lib/supabase/admin.ts`, `src/lib/env.ts`
- `src/lib/queries/catalog.ts`, `src/lib/catalog/client.ts`, `src/lib/hooks/use-catalog-companies-infinite.ts`
- `src/app/api/catalog/route.ts`, `src/app/api/catalog/[slug]/route.ts`
- `src/app/[locale]/(public)/catalog/**`
- `src/app/[locale]/(public)/companies/[slug]/profile/page.tsx`
- `src/app/[locale]/(staff)/staff/directory/actions.ts`, `page.tsx`
- `src/app/[locale]/(staff)/staff/entities/actions.ts`, `page.tsx`
- `src/app/[locale]/(sys)/sys/entities/actions.ts`, `page.tsx`
- `src/app/[locale]/(staff)/staff/verification/**`
- `src/lib/staff/directory-queries.ts`, `entities-queries.ts`, `moderation-queries.ts`, `verification-review-queries.ts`
- `src/lib/staff/require-staff-access.ts`, staff audit helpers
- `src/lib/entity/companies.ts`, `src/lib/entity/claims.ts`
- `src/lib/onboarding/entity-actions.ts`, `entity-queries.ts`
- `src/lib/profile/mutations.ts`, `organization-directory-reference.ts`, `owner-business-profile.ts`, `owner-university-profile.ts`, `queries.ts`
- `src/lib/auth/organization-profile.ts`, `verification.ts`
- `src/lib/queries/business-profile-public.ts`
- `src/lib/feature-flags/keys.ts` and server feature-flag helpers
- `src/lib/seo/build-sitemap.ts`, `src/lib/seo/sitemap-data.ts`
- URL/domain and CSV export utilities found by repository reference searches
- `supabase/functions/link-auditor/index.ts`
- `supabase/functions/lammah-crawler/index.ts`
- `supabase/functions/process-communication-batches/index.ts`
- `supabase/functions/send-expiry-notification/index.ts`
- `supabase/functions/send-rejection-email/index.ts`
- `supabase/functions/ssis-generate-screening/index.ts`

The repository scans also enumerated every `src/` and `supabase/` file referencing `companies`, `business_profiles`, `university_profiles`, or `verification_requests`; §5 groups the resulting routes and operational domains.

## 19. Final recommendation

**`GO_WITH_BLOCKERS`**

The architecture is viable without reopening shipped product decisions: GLEIF is qualified for a Saudi Level-1, human-reviewed pilot; the Ministry source remains independently blocked; `companies` remains the sole published Directory store; and adjacent evidence/provenance tables can be secured behind distinct intake/publication capabilities. No DDL should start until B1–B5 are explicitly resolved, especially the live schema drift, domains contradiction, and demonstrably least-privilege worker identity.

Session A made no product-code, database, data, RLS, grant, target-branch, or production-resource change.
