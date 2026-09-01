# LEGACY ORGANIZATION CLAIM MODEL — RETIREMENT CLOSEOUT

**Status:** `LEGACY_ORG_CLAIM_MODEL=RETIRED`  
**Timezone:** Asia/Riyadh  
**Closed:** 2026-09-01  
**This is not Wave 15.**

| Field | Value |
| --- | --- |
| BRANCH | `integration/retire-legacy-org-claim-model` |
| BASE_SHA | `60cdb54f2683995f51a0140273b3a9de9fa5858e` |
| ANCESTRY | `2d234d5b514ffc95ac333997370b4d4589cd1052` (implementation) · `60cdb54f2683995f51a0140273b3a9de9fa5858e` (onboarding closeout) |
| FINAL_SHA | recorded after this file is committed |
| PRODUCTION_TOUCHED | NO |
| MAIN_MERGED | NO |
| NONPROD_ONLY | YES (`hmjuijmaefajdjrjdsxu`) |

---

## MIGRATIONS

Forward-only. Historical migrations were not edited.

1. `jid-platform/supabase/migrations/20260901180000_retire_legacy_org_claim_model.sql`  
   Authority proof for the two `entity_state='approved'` Directory rows; workspace helpers; RLS/function replacement; verification/notification/metric rename; drop of claim RPCs and `companies.claimed_by` / `claim_requested_at` / `entity_state`.
2. `jid-platform/supabase/migrations/20260901190000_catalog_functions_drop_org_claim_refs.sql`  
   Rewrite live `ingest_directory_candidate` and `publish_directory_candidate` so function source no longer references retired columns.

Applied only to nonprod `hmjuijmaefajdjrjdsxu`. Production `znfhladafpajyjwcfzvv` was not queried, migrated, written, or deployed.

---

## BEFORE_INVENTORY

Verified on nonprod before retirement:

- `companies_total=44`
- `claimed_by_nonnull=0`
- `claim_requested_at_nonnull=0`
- `entity_state_nondefault=2` (both `approved`, each already with owned Business profile + approved verification)
- Live columns: `companies.claimed_by`, `companies.claim_requested_at`, `companies.entity_state` (3)
- RLS policies authorizing via `claimed_by` + `entity_state='approved'`: 9 rewritten (application intents, rejection email outbox, team invitations select/insert, job boost stats, catalog insert, profile views insert/select, subscriptions)
- Live functions still reading Directory claim columns: 12 replaced (`can_read_individual_profile`, `business_can_select_applicant_profile`, `is_verified_hiring_employer`, `user_can_manage_company_communication`, `user_owns_job_for_communication`, `user_can_manage_ssis`, `user_owns_ssis_job`, `toggle_job_boost`, `refresh_company_badges`, `create_directory_for_verification`, `ingest_directory_candidate`, `publish_directory_candidate`)
- Legacy RPCs present: `assign_claim_to_self`, `notify_claim_decision`, `review_claim`, `review_claim_request`, `viewer_approved_company_id`, `viewer_has_approved_company_claim`
- Verification still used `claimant_name` / `claimant_title`, `claim_status_enum` / `claim_type_enum`
- Notification enum still used `claim.approved`, `claim.needs_more_info`, `claim.rejected`, `staff.claim_assigned`
- Staff/sys metrics still exposed `pending_claims`, `overdue_claims`, `claims_*`

---

## AFTER_INVENTORY

Mechanical scan of nonprod `hmjuijmaefajdjrjdsxu` after both migrations:

| Gate | Result |
| --- | --- |
| ORG_CLAIM_LIVE_COLUMNS | 0 |
| ORG_CLAIM_RLS_DEPENDENCIES | 0 |
| ORG_CLAIM_FUNCTION_DEPENDENCIES | 0 |
| ORG_CLAIM_TRIGGER_DEPENDENCIES | 0 |
| ORG_CLAIM_LIVE_VIEW_DEPENDENCIES | 0 |
| ORG_CLAIM_LIVE_MATVIEW_DEPENDENCIES | 0 |
| LEGACY_COMPANY_CLAIMED_BY | ABSENT |
| LEGACY_COMPANY_CLAIM_REQUESTED_AT | ABSENT |
| LEGACY_COMPANY_ENTITY_STATE | ABSENT |
| LEGACY_VERIFICATION_CLAIM_COLUMNS | 0 |
| LEGACY_VERIFICATION_CLAIM_TYPES | 0 |
| LEGACY_VERIFICATION_CLAIM_NOTIFICATION_CATEGORIES | 0 |
| LEGACY_VERIFICATION_CLAIM_METRICS | 0 |
| OLD_CLAIM_RPCS | 0 |

Live replacement objects present: `private.user_owns_directory_workspace`, `private.user_owns_job_workspace`, `public.notify_verification_decision`, `verification_requests.representative_name` / `representative_title`, `verification_status_enum` / `verification_type_enum`.

`companies.is_verified` retained (Directory reference flag, not workspace ownership).  
`companies.total_students_claimed` retained (category D).

---

## AUTHORITY_REPLACEMENT

Directory remains platform-owned reference truth. It is not an owned record.

| Actor | Canonical authority |
| --- | --- |
| Business | `business_profiles.owner_user_id` + `business_profiles.directory_id` |
| University | `university_profiles.owner_user_id` + `university_profiles.directory_id` |

Helper: `private.user_owns_directory_workspace(directory_id)` — non-suspended owned Business or University profile for that Directory id.  
Helper: `private.user_owns_job_workspace(job_id)` — owner of the `business_profiles` row that anchors the job.

Application runtime (`fetchOwnedDirectoryForUser`, `getCurrentViewer`, `useCurrentEntity`, jobs/hiring/triage) no longer reads Directory claim columns. Approved verification without an owned profile grants no organization authority.

The two previously `entity_state='approved'` rows were proven in-migration to already have owned profile + approved verification before the column drop. `DATA_LOSS=0`. `AUTHORITY_LOSS=0`. `AUTHORITY_EXPANSION=0`.

No new membership semantics were invented. Access remains fail-closed.

---

## RLS_REPLACEMENT

Policies that previously used `companies.claimed_by` and `entity_state='approved'` now call `private.user_owns_directory_workspace` / `private.user_owns_job_workspace`.

Covered domains: candidate profile visibility, hiring-employer verification, job boost, company/job communications, team invitations, profile views, subscriptions, SSIS ownership.

---

## FUNCTION_RETIREMENT

Dropped with no compatibility shim:

- `assign_claim_to_self`
- `notify_claim_decision` → replaced by `notify_verification_decision`
- `review_claim`
- `review_claim_request`
- `viewer_approved_company_id`
- `viewer_has_approved_company_claim`

Remaining listed functions were rewritten onto owned-profile authority.

---

## VERIFICATION_NAMING_MIGRATION

| From | To |
| --- | --- |
| `claimant_name` / `claimant_title` | `representative_name` / `representative_title` |
| `claim_status_enum` / `claim_type_enum` | `verification_status_enum` / `verification_type_enum` |
| `claim_requests_*` constraints | `verification_requests_*` |
| `idx_claim_requests_*` / `idx_claims_assigned` | `idx_verification_requests_*` |
| `contact_message_source_enum.claim_help` | `verification_help` |

No data loss. Types were renamed in place (no row rewrite).

---

## NOTIFICATION_MIGRATION

PostgreSQL enum values renamed in place (existing preference and notification rows keep their intent):

| From | To |
| --- | --- |
| `claim.approved` | `verification.approved` |
| `claim.needs_more_info` | `verification.needs_more_info` |
| `claim.rejected` | `verification.rejected` |
| `staff.claim_assigned` | `staff.verification_assigned` |

Deployed Edge Function **folder names** `send-claim-approval` / `send-claim-rejection` / `send-claim-decision-email` remain as deploy paths. Function bodies now query `verification_requests` and accept `verificationId`. They do not authorize via Directory claim columns. `ORG_CLAIM_EDGE_RUNTIME_DEPENDENCIES=0`.

---

## STAFF_METRIC_MIGRATION

| From | To |
| --- | --- |
| `pending_claims` | `pending_verifications` |
| `overdue_claims` | `overdue_verifications` |
| `claims_reviewed_today` | `verifications_reviewed_today` |
| `claims_approved_today` | `verifications_approved_today` |
| `claims_rejected_today` | `verifications_rejected_today` |
| `claims_assigned_open` | `verifications_assigned_open` |

Consumers: `v_staff_personal_metrics`, `mv_sys_dashboard_metrics`, Staff/Sys dashboard queries, governance schemas, i18n metric keys. No duplicate metrics.

---

## HISTORICAL_AUDIT_PRESERVED

YES. Historical migration files and historical audit action strings such as `claim_submitted` / `claim_approved` / `claim_rejected` were not rewritten. They have zero runtime authorization dependency. New events use verification terminology.

---

## UNRELATED_CLAIM_CLASSIFICATION

Every discovered occurrence was assigned exactly one category.

### A — ORG_OWNERSHIP_CLAIM → REMOVE

`companies.claimed_by`, `companies.claim_requested_at`, `companies.entity_state`, claim RPCs, RLS/function authorization through those columns, public claim onboarding (already removed on this lineage).

### B — VERIFICATION_LEGACY_NAMING → MIGRATE / RENAME

Representative columns, verification enums, notification categories, staff metrics, constraint/index names, application types/RPCs/tests coordinated to the new names.

### C — LEGACY_HISTORICAL_AUDIT → PRESERVE

Historical migrations (including `notify_claim_decision` SQL and catalog phase-1 publication checks against the original file). Historical tests that read those files still expect the old strings. No runtime authority.

### D — UNRELATED_GENERIC_TECHNICAL_CLAIM → KEEP

- JWT / MFA: `mfa_amr_claims_*`
- Queue leasing: `claim_directory_candidate`, `claim_lammah_candidate`, `claim_due_communication_batches`
- Commercial: `commercial_packages.excluded_claims`, `commercial_package_excluded_claims_chk`
- `companies.total_students_claimed` — student-affiliation volume counter, not organization ownership; comment recorded; not dropped
- Legal copy `مطالبة` in Terms (liability claim)
- Staff UI filenames (`claims.ts`, `/staff/claims` redirects) that already serve verification; not a UI redesign
- Directory-correction CHECK test using `field_name: 'claimed_by'` as a **forbidden field-name string**, not a live column
- Catalog/type comments stating authority is **not** `claimed_by`

`UNRELATED_CLAIM_TERMS_CLASSIFIED=YES`

---

## DATA_LOSS / AUTHORITY

| Gate | Value |
| --- | --- |
| DATA_LOSS | 0 |
| AUTHORITY_LOSS | 0 |
| AUTHORITY_EXPANSION | 0 |

---

## TESTS

Targeted Vitest (serial):

- PASS: notification action URLs + render, staff-system claim-surface cleanup, verification decision structural/action, triage access, hiring contract, evidence authority, university journey chain, company dashboard honesty, verification outcome UI, privacy-gate-a contract, verification copy/assignment copy, professional-discovery fail-closed, spec09 historical residue file, seed-safety, lammah real-opportunities, paid-visibility-off, organization-shell-separation, directory-correction-apply
- RLS matrix: skipped in this environment (`getRlsTestEnv` requires local `127.0.0.1` Supabase). Live nonprod mechanical RLS scan = 0 claim dependencies.
- Pre-existing, not introduced by this packet: `content-wave-a-truth` Abhathli/ابحث لي product-copy hits; `phase1-foundations` looks for renamed historical filename `20260802205903_catalog_phase1_foundations.sql`

`pnpm type-check` PASS  
`pnpm lint` PASS  
`git diff --check` PASS

---

## TYPECHECK / LINT / BUILD

| Check | Result |
| --- | --- |
| TYPECHECK | PASS |
| LINT | PASS |
| BUILD | PASS |

---

## P0 / P1

| | |
| --- | --- |
| P0 | NONE |
| P1 | NONE |

---

## DEFINITION OF DONE

| Gate | Result |
| --- | --- |
| LEGACY_ORG_CLAIM_MODEL | RETIRED |
| PUBLIC_CLAIM_FLOW | ABSENT |
| COMPANIES_CLAIMED_BY | ABSENT |
| COMPANIES_CLAIM_REQUESTED_AT | ABSENT |
| COMPANIES_ENTITY_STATE | ABSENT |
| RUNTIME_ORG_CLAIM_FUNCTIONS | 0 |
| RUNTIME_ORG_CLAIM_RLS_DEPENDENCIES | 0 |
| VERIFICATION_REQUESTS_USES_REPRESENTATIVE_TERMINOLOGY | YES |
| VERIFICATION_ENUMS_USE_VERIFICATION_TERMINOLOGY | YES |
| LIVE_NOTIFICATION_CLAIM_TERMINOLOGY | 0 |
| LIVE_STAFF_VERIFICATION_METRICS_USE_CLAIM_TERMINOLOGY | 0 |
| BUSINESS_AUTHORITY | PROFILE_BASED |
| UNIVERSITY_AUTHORITY | PROFILE_BASED |
| DIRECTORY_REMAINS_PLATFORM_OWNED | YES |
| VERIFICATION_REMAINS_SEPARATE | YES |
| DATA_LOSS | 0 |
| AUTHORITY_LOSS | 0 |
| AUTHORITY_EXPANSION | 0 |
| NONPROD_ONLY | YES |
| PRODUCTION_TOUCHED | NO |
| MAIN_MERGED | NO |
