# JID Catalog — Final Baseline Refresh and Phase-1 Execution Decision

Date: 2026-08-02
Scope: documentation-only, bounded reconciliation from the historical Catalog Session A report to the current canonical repository and approved non-production database
Decision: `CATALOG_PHASE1_READY_FOR_IMPLEMENTATION`

## 1. Executive decision

Catalog Phase 1 foundations may begin. The historical architecture remains correct, the approved non-production database now matches the current canonical migration chain, and every historical implementation blocker has an exact bounded resolution. There are no remaining blockers to the foundations task.

This decision authorizes only **Catalog Phase 1 Foundations**: adjacent tables, RLS, grants, privileged RPC boundaries, audit integration, one default-off ingestion feature flag, tests, and disposable-Supabase validation. It does not authorize a GLEIF connector, source retrieval, external imports, automatic publication, production work, Lammah, or ابحثلي.

## 2. Gate, authority, and historical report status

| Item | Verified result |
| --- | --- |
| Repository | `saadalamrani/JID` |
| Canonical branch | `origin/agent/nonprod-signup-fix` |
| Resolved canonical starting SHA | `39fc3066e94a81ee22eb79ddff7a62d6521d1290` |
| Expected canonical SHA | Exact match |
| Historical Catalog report commit | `efea594ee8d19436acc9d9e6ef688d71f1dfb3bf` |
| Historical report base | `68c656d7d01578a1eafb98a2f82d6819d3c63500` |
| Historical report file | `jid-platform/docs/command-center/reports/JID_CATALOG_SESSION_A_RECONCILIATION.md`, read directly with `git show` |
| Historical mirror | `origin/agent/nonprod-signup-form` at `b29846b644ab2d94ec1d88b3a0954f2f30276452`, unchanged |
| Current execution ledger | Specifications 02–09 `SHIPPED`; post-Specification-09 remediation `COMPLETE`; `ZERO_KNOWN_OPEN_RELEASE_DEFECTS` |
| Entry gate | PASS |

The historical commit was not merged or cherry-picked because it is a documentation commit on a separate line of history, is not an ancestor of the current canonical tip, and describes the old base rather than current truth. Its findings were used as point-in-time evidence and reconciled here. Merging or rebasing it would import stale repository state and violate the founder’s bounded-refresh direction.

The earlier `STALE_BASELINE` outcome was a prompt-protocol failure, not a repository failure. The branch and ledger were verified directly after `git fetch origin --prune`.

## 3. Current architecture confirmation

The current repository and live non-production schema preserve these contracts:

1. `public.companies` is the sole published Directory Record store. No `directory_records` table exists or is proposed.
2. Directory records are not owned Profiles. `business_profiles` and `university_profiles` remain separate, owner-controlled presentation records linked to a Directory row.
3. Verification remains a separate evidence and approval workflow in `verification_requests`; Catalog cannot create, approve, or bypass it.
4. Catalog candidate intake and staff publication are separate privileged boundaries.
5. Every Phase-1 candidate requires human review. There is no automatic publication, Profile creation, Verification bypass, or Directory ownership assignment.
6. Exactly three external actors remain: Individual, Business, and University. A worker is an internal technical identity, not a fourth actor.
7. Existing audit, staff authorization, feature-flag, taxonomy, `pg_cron`, `pg_net`, and Vault infrastructure is reused where safe.

Current Profile publication strengthens, rather than changes, this split. Owners can publish or unpublish only their existing Profile through audited RPCs; those operations do not change the underlying Directory record. Public Profile reads require `status = 'published'`.

## 4. Bounded delta from the historical baseline

| Historical finding or open point | Classification | Current evidence and effect |
| --- | --- | --- |
| `companies` is the only published Directory store | `STILL_VALID` | Current Catalog reads and public routes still use `companies`; no replacement store exists. |
| Do not create `directory_records` | `STILL_VALID` | No current requirement contradicts it. |
| Catalog must not write Profiles or Verification | `STILL_VALID` | New Profile publication RPCs and Verification hardening make those boundaries more explicit. |
| Intake and publication are distinct privileged boundaries | `STILL_VALID` | Required by current grants, RLS, and review model. |
| Human review only; no auto-publication | `STILL_VALID` | No current ingestion or auto-publication infrastructure exists. |
| GLEIF is qualified with limitations | `STILL_VALID` | Current GLEIF terms still make LEI reference data freely accessible under CC0; API and Golden Copy remain supported access paths. |
| Ministry source is not qualified | `STILL_VALID` | The Ministry page points to a general open-data portal, but no exact current licensed machine-readable organization artifact was confirmed. |
| Built-in `service_role` is not least privilege | `STILL_VALID` | Live `service_role` has `BYPASSRLS`; current Supabase documentation confirms secret keys use this full-access role. |
| Existing infrastructure should be reused | `STILL_VALID` | Audit, flags, taxonomies, cron, network, and Vault remain present. |
| Repository/non-production migration drift blocked DDL | `RESOLVED` | Live migrations now include the complete canonical chain through `20260802120000_university_dashboard_view_owner_scope`. |
| Domainless publication needed a decision | `RESOLVED` | A candidate without a validated official domain remains review-only; no placeholder domain is permitted. |
| Worker identity was undecided | `RESOLVED` | Use a dedicated non-login capability role plus a separate direct-Postgres login member, with execute-only intake RPC access and no RLS bypass. |
| Raw-evidence retention was undecided | `RESOLVED` | Retain while referenced, then 180 days; apply shorter licence/privacy requirements; retain immutable metadata and audit. |
| Staff role granularity needed confirmation | `RESOLVED` | Reuse the current layered staff shell and RPC authorization pattern; publication RPC permits only `staff` and `super_admin`. |
| Profile publication/read linking was incomplete | `UPDATED` | Owner publication RPCs, moderation triggers, and public published-Profile routes now exist. |
| Directory correction apply path needed hardening | `UPDATED` | Approval/rejection now locks rows, enforces an exact field allowlist, rejects missing Directory rows, audits, and notifies. |
| `companies.claimed_by` runtime ownership checks remained | `RESOLVED` | Current viewer helpers resolve Profile ownership plus approved Verification. `claimed_by` survives only as legacy schema/data compatibility, not the Catalog ownership boundary. |
| `claim_requests` / `viewer_approved_*` residue | `UPDATED` | Runtime helpers now query `verification_requests`; a few legacy helper names remain compatibility labels only. |
| University dashboard depended on `companies.claimed_by` | `RESOLVED` | The current owner-scoped view uses `university_profiles.owner_user_id` and approved Verification. |
| Historical eleven-table proposal | `UPDATED` | Foundations are reduced to seven adjacent tables plus existing immutable audit reuse. |
| Manual staff Directory insert uses `link_status = 'unknown'` | `STILL_VALID` | The live enum accepts `healthy`, `broken`, and `pending`. This pre-existing manual-path observation is outside this documentation task and does not block foundations because the Catalog publication RPC must set `pending`. It is not reopened here as a release defect. |

No `NEW_BLOCKER` was found.

## 5. Current schema, RLS, grant, trigger, and infrastructure reality

### 5.1 `companies`

- RLS is enabled.
- Public `anon` and `authenticated` reads are limited by the active-record policy; staff/super-admin policies support administrative read/insert/update and super-admin delete.
- Supabase’s exposed-schema table grants remain broad for platform roles, so RLS is the ordinary Data API boundary. `service_role` and `postgres` bypass RLS and are prohibited as connector identities.
- `domains` is `text[] NOT NULL` with a non-empty-cardinality constraint. `stub.local` is not valid Catalog evidence and must never be invented.
- `entity_type` is the `business`/`university` enum. Phase 1 is GLEIF business-only.
- Legacy `claimed_by` remains physically present, but current ownership and approved-viewer behavior no longer relies on it.
- There is no Catalog-specific trigger on `companies`. Publication must therefore be mediated by a new narrowly authorized RPC, not direct worker DML.
- Current `link_status` values are `healthy`, `broken`, and `pending`, with `pending` the neutral publication value.

### 5.2 Profiles and Verification

- `business_profiles` and `university_profiles` have RLS, public-published read policies, owner read/update policies, staff reads, moderation triggers, and audited owner publication RPCs.
- Profile moderation fields remain trigger-protected. Catalog receives no table grants and no RPC path to either Profile table.
- `verification_requests` has RLS, a hardened applicant-insert boundary, applicant-own reads, and staff/super-admin review access. Catalog receives no table grant and no verification RPC.
- Current helper and dashboard migrations remove live `claimed_by` dependence in favor of Profile ownership and approved Verification.

### 5.3 Audit, corrections, flags, and jobs

- `audit_logs` is immutable under update/delete triggers. Existing privileged functions write through `_write_audit_log`; Catalog publication must reuse that pattern rather than granting direct audit-table inserts.
- Correction approval permits exactly `city`, `career_portal_url`, `website_url`, `linkedin_url`, `twitter_url`, `sector_id`, and `region_id`; it requires a staff/super-admin caller and review notes, locks the suggestion, checks the Directory row, audits, and notifies.
- `feature_flags` has RLS and already contains `catalog`, currently enabled for the public catalog. Foundations must not overload that public-read flag. It must add `catalog.phase1_ingestion`, default `false`, managed through the existing governance path.
- `pg_cron`, `pg_net`, and Vault are installed. Existing cron jobs are unrelated and must not be reused with their global service-role configuration. Phase 1 foundations create no connector or scheduled fetch.
- The live project has no Edge Functions, no `catalog_worker` role, no Catalog intake/publication functions, and no automated-ingestion tables. This is expected before implementation.
- The live non-production migration list matches the current canonical repository chain through the six post-baseline migrations for correction hardening, Profile publication, claim-residue repair, and University owner scoping. Catalog DDL can safely target this current schema in a disposable database and, only after its own approval, non-production.

## 6. Current Catalog routes and read paths

| Surface | Current behavior |
| --- | --- |
| `/api/catalog` | Reads active business Directory rows and published Profile projection data. |
| `/api/catalog/[slug]` | Reads an active Directory detail by slug with published Profile projection when present. |
| `/[locale]/catalog` | Public localized Directory listing. |
| `/[locale]/catalog/[slug]` | Public localized Directory detail. |
| `/[locale]/companies/[slug]` | Public company Directory surface. |
| `/[locale]/companies/[slug]/profile` | Public Business Profile only when published. |
| `/[locale]/universities/[slug]/profile` | Public University Profile only when published. |
| Staff Directory routes | Existing manual Directory CRUD plus correction and Profile-moderation queues behind the staff shell. |

`src/lib/queries/catalog.ts` filters `companies.is_active`, limits the main list to business Directory records, joins only published Profiles for public projection, and resolves viewer ownership from Profile ownership rather than Directory ownership. Catalog Phase 1 must preserve these reads; it adds no public candidate or raw-evidence route.

## 7. Historical blocker resolution

| Historical blocker | Resolution | Phase-1 consequence |
| --- | --- | --- |
| Schema/migration drift | **Resolved.** Approved non-production and canonical migrations are synchronized. | Foundations may author DDL against the current schema, validate in disposable Supabase, and leave production untouched. |
| Domainless publication | **Resolved by policy.** Missing, empty, placeholder, or unverified domains keep a candidate in review. | Publication RPC rejects such candidates. It never writes `stub.local`. |
| Worker identity | **Resolved by least privilege.** See section 11. | Worker can ingest candidate evidence only, never publish or mutate Directory/Profile/Verification directly. |
| Evidence retention | **Resolved.** See section 12. | Foundations must encode retention state and deletion eligibility before any connector exists. |
| Legal/source scope | **Resolved for foundations.** GLEIF remains qualified with limitations; Ministry remains excluded. | Only a later GLEIF connector task may retrieve external data. |
| Publication allowlist | **Resolved.** See sections 9 and 10. | Publication RPC owns the allowlist, pins invariants, and rejects everything else. |
| Human authorization | **Resolved.** Reuse current staff shell plus an independent RPC role check. | Every publication is an attributable staff/super-admin decision with notes and audit. |

## 8. Source decisions

### 8.1 GLEIF — `QUALIFIED_WITH_LIMITATIONS`

GLEIF remains the only qualified Phase-1 source. Its current [LEI Data Terms of Use](https://www.gleif.org/en/meta/lei-data-terms-of-use) state that the access service is free and LEI/LE-RD data is provided under CC0. The [GLEIF API](https://www.gleif.org/en/lei-data/gleif-api) exposes LEI reference-data search, and the [Golden Copy](https://www.gleif.org/en/lei-data/gleif-golden-copy/download-the-golden-copy) remains a daily deduplicated bulk/delta source.

Allowed Phase-1 candidate facts from GLEIF are limited to:

- LEI;
- legal name;
- authoritative other, transliterated, and historical names when explicitly present;
- legal-address and headquarters locality/country fields;
- legal jurisdiction;
- legal form, entity category, and subcategory;
- entity status and entity creation date;
- registration authority and registered identifier;
- registration, renewal, validation, and managing-LOU metadata;
- validation source and validation authority metadata.

Limitations:

- GLEIF does not establish an official web domain, sector taxonomy, Saudi region mapping, marketing description, logo, social URL, ownership classification, verification approval, or Profile ownership.
- GLEIF data is third-party-supplied and offered as-is; human review and provenance display remain mandatory.
- Phase 1 must not imply that JID is endorsed by GLEIF.
- A historical sample/count is not a current inventory claim. No external data was retrieved in this task.

### 8.2 Ministry of Education — `BLOCKED_SOURCE_QUALIFICATION`

The current Ministry [Open Data page](https://www.moe.gov.sa/en/knowledgecenter/dataandstats/pages/opendata.aspx) points generally to the Saudi Open Data Platform and describes multiple formats, but this refresh did not confirm one exact current, licensed, machine-readable organization artifact with stable identifiers and the required fields. Historical HTML statistical tables mix universities, colleges, and institutes and are not an acceptable current connector contract.

The Ministry is excluded from Phase 1. This is a source-specific exclusion, not a blocker to GLEIF-only foundations. No Ministry adapter, fixture, import, or speculative schema field is authorized.

## 9. Exact Phase-1 `companies` publication allowlist

Only the staff-publication RPC may write `companies`, and only after a human approves a candidate with complete provenance and an official non-placeholder domain.

| Field | Exact rule |
| --- | --- |
| `id` | Generate a UUID for a new Directory row; never accept a worker-supplied row ID. |
| `name` | Required; use the approved GLEIF legal name. |
| `name_ar` | Write only when the source provides authoritative Arabic or a staff reviewer records an attributable, reviewed Arabic rendering; otherwise leave null. Never machine-invent it. |
| `domains` | Required non-empty array of normalized, validated official domains from approved evidence. GLEIF alone is not domain evidence. |
| `entity_type` | Pin to `business` for Phase 1. |
| `city` | Optional; only from the approved legal-address locality fact. |
| `founded_year` | Optional; derive only from an exact approved entity-creation date and retain that derivation in provenance. |
| `slug` | Generate server-side with a deterministic, collision-safe rule on insert; never accept from the worker. Do not silently change an existing published slug. |
| `is_active` | Pin `true` only at the human publication decision. |
| `link_status` | Pin `pending`; never write `unknown`. |
| `updated_at` | Set server-side at publication. |

For an existing Directory row, the RPC may update only approved source-fact fields from this list (`name`, `name_ar`, `domains`, `city`, `founded_year`) after exact deterministic identity resolution and a row lock. It must not replace a higher-authority value with an empty, older, or lower-authority value. `id`, `entity_type`, and `slug` are immutable through the Catalog update path.

## 10. Exact prohibited and pinned writes

Catalog must never write:

- any row or field in `business_profiles`, `university_profiles`, or `verification_requests`;
- Directory ownership or lifecycle claims: `claimed_by`, `claim_requested_at`, or any Claim/مطالبة concept;
- verification/moderation fields: `is_verified`, Profile status, `verified_badge`, suspension fields, reviewer assignments, or verification decisions;
- engagement or fabricated metrics: `total_students_claimed`, `avg_response_days`, `response_rate_pct`, `total_jobs_posted_12mo`, `last_activity_at`, or `is_on_honor_roll`;
- commercial/operational fields: `subscription_tier`, `employee_count_range`, `office_locations`, `last_audit_at`, `broken_since`, or `manual_order`;
- unsupported Directory content: `tagline_ar`, `tagline_en`, `about_ar`, `about_en`, `description_ar`, `description_en`, `logo_url`, `cover_image_url`, `career_portal_url`, `website_url`, `linkedin_url`, or `twitter_url`;
- unsupported classifications: `ownership_type`, `sector_id`, `region_id`, or `university_short_code`;
- generated `search_vector` or timestamp/history columns other than the server-set `updated_at` named in the allowlist;
- audit rows by direct table DML.

For every new Phase-1 Directory publication, the RPC must also enforce, through explicit values or verified defaults: `claimed_by = NULL`, `claim_requested_at = NULL`, `is_verified = false`, `entity_state = 'unclaimed'`, and no Profile or Verification side effect. Incoming values for pinned or prohibited fields cause rejection; they are not silently ignored.

## 11. Worker identity decision

Use a dedicated direct-Postgres identity, not the Data API and not Supabase’s built-in `service_role`:

1. Foundations creates `catalog_worker` as `NOLOGIN`, `NOBYPASSRLS`, and without table privileges. It is the capability role.
2. The later connector task provisions a distinct `LOGIN`, `NOBYPASSRLS` member role for the server worker and grants it membership in `catalog_worker`. Credential provisioning and secret rotation occur outside schema migrations in the approved server secret store/direct pooler configuration.
3. `catalog_worker` receives `USAGE` only where required and `EXECUTE` only on the candidate-ingestion RPC. It receives no publication-RPC execute, no direct DML on `companies` or adjacent tables, and no access to Profiles, Verification, audit tables, or raw public routes.
4. The intake RPC is `SECURITY DEFINER`, has a fixed `search_path`, validates source activation, run identity, idempotency key, payload checksum/size/type, and candidate-field allowlist, writes only adjacent intake tables, and records audit through the internal audit helper.
5. The worker never runs in the browser or client, never receives a global service key, and cannot publish.

This matches Supabase’s current guidance to create a separate database user for each service and grant permissions on specific objects. Supabase documents that `service_role` [bypasses RLS](https://supabase.com/docs/guides/database/postgres/roles) and that secret keys use that full-access role with `BYPASSRLS` ([API-key documentation](https://supabase.com/docs/guides/getting-started/api-keys)); therefore neither is a least-privilege Catalog worker identity.

Staff publication is separate. The server action must reuse `requireStaffShellAccess()` for authenticated session, staff-shell role, MFA AAL2, and the eight-hour session limit. The publication RPC must independently require `auth.uid()` whose current profile role is `staff` or `super_admin`, lock the candidate and target Directory row, require review notes, revalidate every source fact, and write immutable audit evidence. There is no new public actor.

## 12. Evidence retention decision

Raw evidence is private and never client-readable.

- Retain a raw evidence object while any active candidate, published fact, unresolved conflict, audit investigation, or legal hold depends on it.
- Once it is superseded and unreferenced, mark it deletion-eligible and delete the raw payload after **180 days** through an audited retention job.
- A source licence, contract, law, privacy obligation, or deletion request that requires a shorter period overrides 180 days. A documented legal hold pauses deletion.
- CC0 or otherwise permissive terms allow use but do not justify indefinite raw-payload retention; the same dependency-plus-180-day default applies.
- Retain the immutable checksum, source ID, source-record key, fetch timestamp, parser/version metadata, licence snapshot/reference, deletion timestamp/reason, candidate-fact provenance, publication audit, and reviewer decision after payload deletion.
- Collect organization facts only. Do not extract personal contacts, officers, beneficial owners, emails, phone numbers, or other unnecessary personal data. Evidence unexpectedly dominated by personal data is quarantined, not parsed, and receives a 30-day deletion review.
- Foundations models retention metadata and eligibility only. It does not retrieve data or create a production deletion schedule.

## 13. Minimum Phase-1 schema boundary

Foundations may create exactly these adjacent tables, with names finalized in the migration but responsibilities kept separate:

| Adjacent table | Minimum responsibility |
| --- | --- |
| `directory_sources` | Source identity, qualification state, licence/reference, permitted fields, activation state, and retention override. Seed metadata only; no retrieved organization data. |
| `directory_sync_runs` | Immutable run envelope, actor/worker identity, source, mode, parser version, status, counters sourced from actual rows, and timestamps. |
| `directory_raw_evidence` | Private evidence metadata: locator placeholder, content type/size, checksum, fetch time, licence snapshot, retention state, deletion eligibility, and deletion audit reference. No public read. |
| `directory_import_candidates` | Source record identity, normalized candidate identity, state machine, idempotency key, match target, conflict state, and terminal reason. |
| `directory_candidate_facts` | One normalized fact plus source/evidence pointer, source field, transformation/derivation, confidence as a categorical review aid rather than a public metric, observed/effective time, and supersession. |
| `directory_review_queue` | Human assignment, decision state, notes, reviewer, timestamps, and publication result; no automatic approval transition. |
| `directory_dead_letters` | Failed/rejected intake reference, bounded sanitized error class/details, retry state, and run/source linkage; no secrets or uncontrolled raw payload copy. |

Reuse `audit_logs` and `_write_audit_log`; do not create a parallel audit ledger. Add two privileged boundaries only:

- one worker-executable candidate-ingestion RPC that cannot touch `companies`;
- one authenticated staff-publication RPC that alone can apply the section 9 allowlist to `companies`.

Reuse existing taxonomies as read-only validation references. Add `catalog.phase1_ingestion` to the existing `feature_flags` table, default off. Do not alter the meaning or current enabled state of the existing `catalog` public-browse flag.

Do not create `directory_records`, Profiles, Verification rows, source connectors, external payloads, public candidate APIs, or auto-publication machinery.

## 14. Security gates for Foundations

Foundations is not complete unless all of these are proven in disposable Supabase:

1. RLS is enabled and forced where appropriate on all seven adjacent tables before any grants.
2. `anon`, ordinary `authenticated`, Individual, Business, University, and unassigned staff sessions cannot read raw evidence or mutate intake/review state directly.
3. No adjacent table grants direct `INSERT`, `UPDATE`, or `DELETE` to `anon`, `authenticated`, or `catalog_worker`.
4. `catalog_worker` is `NOBYPASSRLS`, cannot login itself, and can execute only the intake boundary. Its later login member is server-only.
5. All `SECURITY DEFINER` functions have a fixed `search_path`, immediate `REVOKE ALL ... FROM PUBLIC`, exact grants, fully qualified objects, input size/type limits, and independent caller/role checks.
6. Intake cannot write `companies`; publication cannot write Profiles or Verification; neither can write audit tables directly.
7. Publication row-locks candidate/queue/Directory state, is idempotent, enforces the exact allowlist and pins, rejects domainless/placeholder records, and cannot auto-transition from intake.
8. Every review, publication, failure, retry, retention transition, and deletion is attributable and immutable in existing audit infrastructure without secrets or excess personal data.
9. The default-off `catalog.phase1_ingestion` flag gates intake. Turning it off prevents new intake without disabling the existing public Catalog.
10. Security Advisor is reviewed after disposable DDL; any new RLS, definer, or exposed-schema warning caused by Foundations is a blocker.

## 15. Testing gates for Foundations

Required evidence:

- migration apply from a fresh disposable Supabase database and from the current canonical migration chain;
- schema-contract tests for all seven tables, constraints, indexes, foreign keys, role attributes, function ownership, function `search_path`, revokes, and exact grants;
- a positive/negative permission matrix for `anon`, authenticated external actors, `staff`, `admin`, `super_admin`, `catalog_worker`, and the worker login member;
- proof that direct table DML is denied and only the intended RPC is executable for each identity;
- intake idempotency, duplicate source key, replay, checksum mismatch, oversize payload metadata, invalid field, disabled source, disabled flag, failure/dead-letter, and concurrent-run tests;
- review state-machine tests including mandatory human decision, required notes, stale/superseded evidence, competing reviewer, and double-publication concurrency;
- publication tests for every allowed field, every prohibited/pinned field, missing domain, `stub.local`, wrong entity type, existing-row identity mismatch, lower-authority overwrite, Profile/Verification no-side-effect, and immutable audit evidence;
- retention eligibility, legal hold, shorter source override, personal-data quarantine, deletion metadata, and audit tests without retrieving real external data;
- generated TypeScript types updated without `any`;
- repository checks: `git diff --check`, `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build`;
- validation-branch CI, Vercel result, canonical fast-forward only after validation passes, and target-branch CI.

No test may use production data, secrets, real external organization retrieval, or fabricated public success metrics.

## 16. Phase-1 success declaration

**Foundations success** means the seven-table private candidate/evidence boundary, exact least-privilege roles/grants/RLS, intake and staff-publication RPC contracts, audit integration, default-off ingestion flag, retention metadata, and disposable permission/behavior matrix are implemented and proven while current Directory/Profile/Verification behavior remains unchanged.

It does **not** mean a source has been fetched, a connector is running, a candidate has been auto-published, a production migration has run, or Catalog ingestion is enabled.

## 17. Remaining blockers

None for **Catalog Phase 1 Foundations**.

The following are deliberate later-task gates, not foundation blockers:

- a real candidate without a validated official domain remains in review;
- Ministry ingestion remains excluded until its exact source is independently qualified;
- GLEIF retrieval remains deferred until foundations pass and a separately authorized connector task exists.

## 18. Immediate next implementation task

### Catalog Phase 1 Foundations

Implement only:

- the seven adjacent tables in section 13;
- RLS, exact grants, and least-privilege role boundaries;
- the candidate-ingestion and staff-publication RPC contracts;
- existing immutable audit integration;
- the default-off `catalog.phase1_ingestion` feature flag;
- focused repository tests and disposable-Supabase validation.

Explicitly exclude the GLEIF connector, source retrieval, external imports, automatic publication, production, Lammah, and ابحثلي. Do not create any further discovery, audit, or review task before this foundations task.

## 19. Validation and change boundary

This refresh changes only this report. It performs read-only repository, approved non-production schema, migration, RLS/grant, role, cron/extension, Edge Function, and official-source checks. It makes no product-code, database, production, `main`, or historical-mirror change.

Local validation, implementation/validation SHAs, CI, Vercel, and canonical promotion evidence are reported in the task completion response because the containing commit cannot self-reference its own SHA.

## 20. Final decision

`CATALOG_PHASE1_READY_FOR_IMPLEMENTATION`
