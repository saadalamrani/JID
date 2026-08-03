# JID Catalog Phase 1 / Session B - Foundations Report

Date: 2026-08-03

Status: locally complete; validation CI and canonical fast-forward remain

Source branch: `codex/jid-catalog-b-foundations-recovery`

Validation branch: `codex/jid-catalog-b-recovery-ci-validation`

Canonical target: `agent/nonprod-signup-fix`

## Delivered scope

- Added the seven adjacent Catalog foundation tables without changing ownership semantics for directory records.
- Added deterministic ingestion and publication RPCs with independent authorization, state, provenance, idempotency, and concurrency controls.
- Added forced RLS and least-privilege role grants for the Catalog worker and function owner.
- Added a disabled-by-default ingestion feature flag.
- Added generated Supabase TypeScript definitions for the new tables and RPCs.
- Added unit, disposable RLS, edge-case, direct-login, and concurrency evidence.
- Preserved the three-actor model and made no Profile or Verification domain writes.

## Accepted Advisor warning

The founder accepts only the following intentional Supabase Advisor warning:

`authenticated_security_definer_function_executable public.publish_directory_candidate(uuid)`

The function must remain executable by `authenticated` because staff and super-admin users enter through that database role. The function body then performs the authoritative application-role check. This is a deliberate RPC boundary, not a grant to ordinary authenticated users.

### Compensating controls

- `PUBLIC`, `anon`, `service_role`, and `catalog_worker` have no execute grant on the publication RPC; only `authenticated` can enter it.
- The RPC requires a valid JWT subject and independently permits only the canonical `staff` or `super_admin` application role.
- The `SECURITY DEFINER` owner is a scoped `NOLOGIN`, `NOBYPASSRLS` role, not a general application or deployment role.
- The owner receives only the exact schema, sequence, table-column, and function privileges required by the two RPC workflows.
- Temporary `CREATE` on `public` exists only while assigning the approved function owners and is revoked in the same migration.
- The function uses a fixed safe `search_path` and schema-qualified references.
- Candidate, evidence, review-queue, source-authority, ownership, verification, and publication-state invariants are checked while locking the relevant rows.
- Forced RLS and revoked direct DML keep clients on the reviewed RPC boundary.
- Successful and denied publication attempts produce immutable Catalog audit evidence.
- Idempotency and concurrent-call tests prove one authoritative result with safe replay behavior.
- The workflow does not mutate Profiles or Verification records, and ingestion remains disabled by default.

The post-migration Advisor delta contained exactly this one new finding. Any additional finding remains unaccepted and is a blocker.

## Database evidence

The disposable transcript is recorded in `docs/command-center/reports/JID_CATALOG_PHASE1_FOUNDATIONS_DISPOSABLE_DB_TRANSCRIPT.md`.

The zero-to-tip replay, behavioral matrix, edge matrix, direct-login role proof, concurrent intake, concurrent publication, and concurrency verifier passed. The non-production project then confirmed the migration, empty Catalog state, forced RLS, generated types, role/function privilege matrix, disabled flag, and no Profile/Verification count changes.

## Validation and promotion contract

- Focused Catalog unit tests: 14 passed before the final full validation run.
- Lint: passed with no warnings or errors.
- Type-check: passed after replacing a test-only `matchAll` spread with `Array.from` for compatibility with the repository compiler target.
- Full test suite: 398 passed and 101 skipped across 53 files. Its first run identified the authorized Catalog migration as missing from a historical Profile-publication allowlist; the related guard was updated to recognize the adjacent migration while continuing to prohibit edits to the Profile publication RPCs.
- Production build: passed, including Next.js compilation, lint/type validation, and generation of 276 static pages.
- The implementation commit SHA, CI run evidence, and promoted canonical SHA are reported in the Session B completion response.
- Promotion is allowed only as a fast-forward of `agent/nonprod-signup-fix` after validation CI passes.
- Production, `main`, the historical mirror, the frozen production candidate, and the concurrent Cursor documentation branch remain out of scope.
