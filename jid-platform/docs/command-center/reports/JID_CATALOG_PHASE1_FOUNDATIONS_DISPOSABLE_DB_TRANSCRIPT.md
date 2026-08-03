# JID Catalog Phase 1 Foundations - Disposable Database Transcript

Date: 2026-08-03

Session: Phase 1 / Session B

Source branch: `codex/jid-catalog-b-foundations-recovery`

Canonical target: `agent/nonprod-signup-fix`

## Isolation and safety

- The disposable stack used `.jid-local/catalog-b-recovery-proof` and an isolated Docker network.
- The stack had no cloud link and no production credentials.
- Production SQL was not executed.
- The disposable database was stopped and destroyed with `--no-backup`; its containers and volumes were verified absent afterward.

## Migration replay

- Replayed the repository migration chain from zero to tip on the disposable PostgreSQL instance.
- Applied `20260802205903_catalog_phase1_foundations.sql` successfully.
- Confirmed exactly seven adjacent Catalog tables and no replacement or ownership mutation of `public.directory_records`.
- Confirmed forced RLS, default-deny direct access, the disabled-by-default `catalog.phase1_ingestion` flag, scoped function ownership, and the immediate schema `CREATE` privilege revocation.

## Behavioral matrix

The disposable SQL matrix completed with `CATALOG_DISPOSABLE_MATRIX_PASS` and covered:

- worker-only ingestion authorization and authenticated staff/super-admin publication authorization;
- denial for anonymous, ordinary authenticated, wrong-identity, stale, superseded, invalid-state, and lower-authority attempts;
- missing, empty, stub, and placeholder source-domain handling;
- provenance, evidence, candidate, review-queue, and publication state gates;
- idempotent retries and exact-update behavior;
- a synthetic direct-login proof for the worker capability role;
- concurrent intake and publication calls, each producing one new result and one replay result;
- post-concurrency verification of invariants;
- no writes to Profiles or Verification domains.

## Non-production confirmation

- Target: Supabase project `hmjuijmaefajdjrjdsxu` (`jid-nonprod`).
- Migration history records `catalog_phase1_foundations`.
- All seven Catalog tables have forced RLS and contained zero rows after validation.
- The Catalog ingestion flag remained `false`.
- Profiles/Verification row counts were unchanged: profiles 17, business profiles 1, university profiles 1, verification requests 4.
- Generated database types contained all seven tables and both RPCs.
- The function-owner role had no schema `CREATE`; exactly seven approved Catalog functions used that owner.
- The worker role could execute intake but not publication; authenticated could execute publication but not intake; public could execute neither.

## Advisor delta and founder acceptance

The Advisor result increased from 220 to 221 findings. The only new finding was:

`authenticated_security_definer_function_executable public.publish_directory_candidate(uuid)`

The founder explicitly accepted this single intentional warning on 2026-08-03. No other warning is accepted by this decision. The compensating controls are documented in the Session B report.
