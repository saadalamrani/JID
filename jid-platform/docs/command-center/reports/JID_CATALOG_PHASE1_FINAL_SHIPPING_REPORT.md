# JID Catalog Phase 1 — Final Shipping Report

Date: 2026-08-03

Status: release candidate complete; validation CI, canonical fast-forward, target CI, and non-production deployment evidence are reported in the final completion response.

Source branch: `codex/jid-catalog-final-shipping`

Integrated validation branch: `codex/jid-catalog-final-shipping-ci-validation`

Canonical target: `agent/nonprod-signup-fix`

Catalog implementation commit on the integrated branch: `c023b2e`

Deterministic fixture commit on the integrated branch: `7ab386c`

Final promoted SHA: emitted by `JID_CATALOG_PHASE1_SHIPPED <promoted SHA>` after all remote gates pass.

## Outcome

Catalog Phase 1 now has one bounded GLEIF Saudi-organizational-data connector, a least-privilege worker identity, adjacent evidence/candidate/review/run data, a Staff review workspace, human-only publication through the existing Directory publication RPC, operational controls, and a completed ten-record non-production pilot.

The implementation preserves the Directory/Profile split. It does not create an owned Profile, Verification request, ownership link, `claimed_by` assignment, or automatic publication. Production, `main`, the historical mirror, and the frozen production candidate were not touched.

## Delivered files

Created:

- `docs/command-center/specifications/JID_Catalog_Final_Shipping_Specification_v1.0.md`
- `docs/command-center/reports/JID_CATALOG_PHASE1_FINAL_SHIPPING_REPORT.md`
- `scripts/catalog/provision-catalog-gleif-worker.sql`
- `src/app/[locale]/(staff)/staff/catalog/_components/catalog-admin-controls.tsx`
- `src/app/[locale]/(staff)/staff/catalog/_components/dead-letter-redrive.tsx`
- `src/app/[locale]/(staff)/staff/catalog/actions.ts`
- `src/app/[locale]/(staff)/staff/catalog/dead-letters/page.tsx`
- `src/app/[locale]/(staff)/staff/catalog/page.tsx`
- `src/app/[locale]/(staff)/staff/catalog/review/[candidateId]/page.tsx`
- `src/app/[locale]/(staff)/staff/catalog/review/_components/catalog-review-workspace.tsx`
- `src/app/[locale]/(staff)/staff/catalog/review/page.tsx`
- `src/app/[locale]/(staff)/staff/catalog/runs/page.tsx`
- `src/lib/staff/catalog-operations.ts`
- `supabase/functions/_shared/catalog-gleif.ts`
- `supabase/functions/catalog-gleif-sync/index.ts`
- `supabase/migrations/20260803120000_catalog_gleif_review_states.sql`
- `tests/rls/catalog-final-shipping.disposable.sql`
- `tests/rls/catalog-update-existing-fixture.disposable.sql`
- `tests/unit/catalog/gleif-final-shipping.test.ts`
- `tests/unit/catalog/staff-workspace-final-shipping.test.ts`

Modified:

- `docs/command-center/reports/JID_MASTER_EXECUTION_LEDGER.md`
- `messages/ar.json`
- `messages/en.json`
- `src/lib/staff/nav.ts`
- `src/lib/supabase/types.ts`
- `supabase/config.toml`
- `tests/unit/catalog/claim-api-retirement.test.ts`
- `tests/unit/profile/publication-ui-routes.test.tsx`
- `tests/unit/security/staff-system-claim-surface-cleanup.test.ts`

No package or lockfile changed and no dependency was added.

## Reuse and implementation decisions

Reused existing architecture:

- `public.companies` remains the sole published Directory store.
- `public.publish_directory_candidate(uuid)` remains the only publication boundary.
- The existing Staff shell, MFA guard, locale routing, navigation pattern, semantic components, and `next-intl` message system are reused.
- `current_user_role()`, the existing immutable audit integration, forced-RLS conventions, feature-flag table, `pg_cron`, `pg_net`, and Vault are reused.
- The seven Foundations tables are extended in place; no parallel Directory, Profile, Verification, or ownership store is introduced.

New code was required only for the GLEIF parser/connector, its bounded worker RPCs and operational controls, the Staff Catalog workspace, domain-evidence assistance, and focused evidence/tests. The connector authenticates with `catalog_worker_gleif`; it does not use `service_role`.

## Dynamic data sources

- Source records: GLEIF LEI Records API, filtered to Saudi legal-address country and stored with payload checksums and capture metadata.
- Run health and counters: `directory_sync_runs` rows written by the worker RPC boundary.
- Candidate identity and matching: `directory_import_candidates`, including GLEIF LEI/registration identifiers and deterministic match target.
- Review evidence: immutable raw evidence plus `directory_candidate_facts` provenance, authority, observation time, and Staff attestation.
- Review queue and outcomes: `directory_review_queue` state and reviewer decisions.
- Public Directory output: the existing `companies` table after explicit Staff approval and publication.
- Staff counters: direct database counts; no cached, estimated, or fabricated metrics.

## Database and authorization evidence

The fresh disposable Supabase chain applied through `20260803120000_catalog_gleif_review_states.sql`. The complete database matrix returned `CATALOG_FINAL_DISPOSABLE_PASS` and covered forced RLS, positive and negative roles, worker boundaries, review states, domain gating, publication, replay, dead letters, legal hold, retention, and zero forbidden side effects. The disposable stack and its volumes were destroyed without backup.

The new worker login is a member only of `catalog_worker` and is `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, and `NOBYPASSRLS`. It has no Profile, Verification, ownership, or `companies` DML grant. The Edge Function uses the direct Postgres endpoint because the managed Supavisor tenant did not register the custom login; no broader role or `service_role` fallback was introduced.

The deployed non-production function is `catalog-gleif-sync`, deployment id `9d48168b-d64c-4a27-a8dc-31141f30346b`, version 1. `verify_jwt=false` is intentional because the body performs constant-time validation of a dedicated invocation secret before database or network work. An unauthenticated live request returned HTTP 401.

Vault contains only the scheduler function URL and invocation-secret entries. The worker database URL is an Edge Function secret, not a public or client variable. The weekly cron is `catalog-gleif-weekly` at `0 2 * * 1`. Both Catalog flags are OFF after the pilot.

## Accepted Advisor warning

The final non-production Security Advisor result contains 221 project-wide findings, of which exactly one is Catalog-relevant:

`authenticated_security_definer_function_executable public.publish_directory_candidate(uuid)`

This is the single founder-accepted warning. Compensating controls remain:

- execute is restricted to `authenticated`; `PUBLIC`, `anon`, `service_role`, and the worker cannot call publication;
- the function independently requires a JWT subject and canonical `staff` or `super_admin` role;
- its owner is scoped `NOLOGIN`/`NOBYPASSRLS` with fixed `search_path` and least-privilege object grants;
- locked review, evidence, source, candidate, ownership, and publication states are checked;
- success and denial paths are audited;
- idempotency and concurrency are proven;
- clients have no direct DML route around forced RLS.

Remediation reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

No other new Catalog Advisor warning is accepted or present.

## Deterministic update fixture repair

The live `directory_import_candidates_flags_chk` allowlist remains unchanged. The reserved marker is not a review condition and was not added to that allowlist.

The corrected fixture uses `review_flags = ARRAY[]::text[]`. The marker `JID_CATALOG_NONPROD_UPDATE_FIXTURE_V1` is confined to `source_record_key` and `idempotency_key`; deterministic UUIDs identify fixture rows and actors.

Targeted disposable preflight:

- reused valid test LEI `9845003OC587591DQ586` and registration identifier `1010000000`;
- Candidate A published successfully;
- Candidate B reused the registration identifier and resolved to `update_existing`;
- both candidates targeted the same `companies.id`;
- one company existed after both publications and both replay calls;
- Profiles, Verification, owned Profiles, ownership fields, and `claimed_by` were unchanged;
- the transaction rolled back;
- `JID_CATALOG_UPDATE_FIXTURE_TRANSACTION_PASS` and `JID_CATALOG_UPDATE_FIXTURE_PREFLIGHT_PASS` were emitted;
- candidate, evidence, dead-letter, actor, role, and flag residue were all zero;
- the isolated stack, volumes, network, and local work directory were removed.

The first targeted preflight exposed the intentional active-LEI unique index. The fixture was corrected to exercise the registration-identifier match path instead of weakening that index.

Non-production proof:

- both flags stayed OFF for the entire proof;
- the proof ran in one transaction using fixed UUIDs and the reserved prefix;
- Candidate A published through the real authenticated Staff boundary;
- Candidate B resolved to `update_existing`, targeted the same company, published into it, and replayed without duplication;
- the temporary worker `SET` capability was revoked before publication;
- the transaction rolled back atomically;
- result: `JID_CATALOG_NONPROD_UPDATE_FIXTURE_PASS`;
- run, evidence, candidate, fact, queue, company, flag, and permission residue all returned zero/false.

The valid disposable LEI was already present in the real ten-record pilot as an approved-pending-domain record, so the non-production transaction left LEI null on the two synthetic candidates and reused the valid registration identifier. This preserved the real pilot record and the active-LEI uniqueness boundary.

## Non-production pilot evidence

Project: `jid-nonprod` (`hmjuijmaefajdjrjdsxu`)

Run:

- id: `d879b3d9-6ad1-48ec-b09c-ea4032bb0165`
- external id: `PILOT-CATALOG-20260803-C`
- status: `succeeded`
- retrieved: 10
- accepted: 10
- rejected/dead-lettered/skipped: 0
- pages: 1
- retries: 0
- worker: `catalog_worker_gleif`

Human review outcomes:

- 5 reviewed records total;
- 2 published;
- 1 approved pending authoritative domain evidence;
- 1 rejected;
- 1 returned for correction;
- 5 remained pending and were not published.

Published Directory records:

- `21b7bf4d-e3f0-4c18-afdb-4ebb5755bbf7` — شركة عرب كريت الخليجية للصناعة — `gulfarabcrete.com` — Staff-cited official bilingual site.
- `a0e6ddf2-7755-4294-b890-8fe15bf4a16f` — Barq Tech Foundation for Delivery and Logistics Services — `barqapp.com` — Staff-cited official BARQ site.

Both published rows are `entity_type=business`, `entity_state=unclaimed`, `is_verified=false`, `claimed_by=null`, `claim_requested_at=null`, and `link_status=pending`. Every publication has an approved review queue row, reviewer id, domain provenance URL, and attestation. There was no automatic publication.

The pilot was deliberately bounded to ten records by the founder launch prompt. Its execution acceptance was five reviewed, two published, one pending-domain, one rejected/returned, and one deterministic update proof. Those newer bounds supersede the larger numerical targets in the attached v1.0 planning specification.

## Zero-side-effect and cleanup evidence

Before and after pilot/fixture proof:

- profiles: 17
- business profiles: 1
- university profiles: 1
- verification requests: 4
- companies with `claimed_by`: 0

The corrected fixture left zero candidate/evidence/run/fact/queue/company residue, zero active flags, and no worker `SET` residue. The real ten-record pilot, its evidence, audit trail, two real published Directory records, and reviewed outcomes are retained under the approved non-production pilot policy.

## Validation evidence

- Targeted Catalog unit validation: 2 files, 13 tests passed.
- Lint: passed with no warnings or errors.
- Type-check: passed.
- Full test suite: 44 files passed, 11 skipped; 411 tests passed, 101 skipped.
- Production build: passed; compilation, lint/type validation, and generation of 284 static pages completed.
- Catalog routes in the build: AR/EN public Catalog plus Staff overview, review queue/detail, runs, and dead-letter routes.
- Package/lockfile: unchanged.
- The integrated candidate includes canonical commits `0c66815`, `4f7eba7`, and `aec5e1c` before the Catalog commits. Their shareable-test-access behavior was neither run nor modified by this wave.
- Validation CI and canonical target CI: reported in the final completion response.
- Non-production Vercel deployment and public route checks: reported in the final completion response.

## AR/EN, responsive, and accessibility evidence

All new message keys exist in both `messages/ar.json` and `messages/en.json`. Focused tests assert key parity, route presence, Staff guard behavior, localized action copy, semantic control labels, and mobile-safe layout classes. The production build generated both locales for all static Staff Catalog routes and the public Catalog.

Live authenticated Staff screenshots were not produced because this recovery explicitly prohibited touching the shareable test accounts. This does not weaken the authorization evidence: the disposable SQL matrix covers positive and negative actors, and the focused DOM/source tests cover the Staff workspace. The final deployment gate uses public Catalog checks without mutating those accounts.

## Deviations and mechanical adjustments

- No standalone task packet existed under `docs/command-center/tasks/`; the attached final shipping specification and founder prompts were the execution packet.
- Managed Supavisor rejected the custom login although the documented username forms were tested. The least-privilege login therefore uses the supported direct database endpoint; architecture and grants are unchanged.
- The first two scheduled pilot invocations failed before a run row because of that Supavisor registration issue. The final direct-endpoint run succeeded; no candidate or partial Catalog state came from the failed invocations.
- A prior local build attempt in the earlier recovery was blocked by sandbox font access and then timed out. The single final build in this recovery ran outside the sandbox and passed.
- Canonical advanced during the wave with the authorized shareable non-production access commits. To avoid both a force push and a merge commit, the validation branch was created from the new canonical tip and the two Catalog commits were cherry-picked onto it. Both histories are preserved, and canonical remains an ancestor of the promotion candidate.

## Preserved boundaries

- Exactly three external actors remain: Individual, Business, University.
- Directory records are not owned Profiles.
- No Claim Existing Profile or commitment score is restored.
- No private data is fetched to the client and hidden there.
- No fabricated metrics or facts are shown.
- No social/feed mechanic is added.
- No Ministry, Lammah, or ابحث لي connector exists in this wave.
- No production SQL or deployment occurred.
- `main`, `agent/nonprod-signup-form`, and the frozen production candidate were not changed.
