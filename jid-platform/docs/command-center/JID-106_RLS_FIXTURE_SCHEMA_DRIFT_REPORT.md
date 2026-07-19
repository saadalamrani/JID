# JID-106 RLS Fixture/Schema Drift Closure Report

Date: 2026-07-19 (Asia/Riyadh)

## Result

JID-106 closed the fixture/schema drift and made all 14 RLS assertions execute, but the gate remains red on one real authorization defect. A Business Profile owner can directly change their own profile from `suspended` to `draft`. JID-106 did not change the policy or any production migration because policy repair is outside this task.

No cloud Supabase project, remote database, Vercel project, production resource, secret file, dependency, or `main` branch was contacted or changed.

## Isolation and migration evidence

- Branch: `agent/nonprod-signup-fix`.
- Supabase CLI: repository-local 2.20.12.
- Disposable project ID: `jid-106-disposable`, distinct from the shared `jid-platform` project.
- Disposable API/database: `127.0.0.1:56321` / `127.0.0.1:56322`.
- Temporary service range: localhost ports 56320–56329.
- Cloud link metadata: no `supabase/.temp/project-ref` present.
- Repository migrations: all 120 copied migrations applied successfully in order.
- Seeds: disabled; only test-created fixtures and the test-only helper were loaded.
- Credentials: derived from local CLI status and held only in process memory; none were printed or committed.
- Existing shared local stack: preserved and never targeted. Its 10 existing containers remained after cleanup (nine running and one pre-existing stopped Edge Runtime container).

This evidence describes only the disposable locally applied schema. Cloud production and cloud non-production state remain unverified.

## Fixture and harness closure

Repository migrations `012_platform_foundation.sql` and `0241_profile_enhancements.sql`, plus generated types, define `profile_state_enum` as `incomplete`, `active`, `suspended`, and `deleted`. The fixture now uses the valid value `active` instead of unsupported `complete`.

Other test-only alignment:

- Role fixtures create the migration-valid default profile first, then use a disposable-only, service-role-only helper to assign Business/Staff roles without weakening the production role-escalation trigger.
- Teardown checks fixture existence before cleanup after partial setup.
- A disposable-only cleanup helper removes immutable audit fixtures before deleting local test users.
- Jobs fixtures align to migration 117's required `business_profile_id` and final owned-profile authorization model; no nullable transitional job rows are fabricated.
- Unauthorized UPDATE assertions distinguish RLS-filtered zero-row updates from constraint errors and verify persisted state where applicable.

The helper SQL lives under `tests/rls/fixtures`; it is not a migration and was applied only to the disposable database.

## Test identities and coverage

Random local-only identities covered Individual, Business admin, and Staff roles across private Profile access, Directory mutation denial, owned Profile boundaries, correction suggestions, verification status, moderation, Jobs, and Applications.

## RLS evidence

Command: `corepack pnpm test -- tests/rls`

- Test files: 2 passed, 1 failed.
- Assertions executed: 14.
- Passed: 13.
- Failed: 1.
- Skipped: 0.

Exact failed assertion:

```text
Ownership Law RLS — zero-leak proofs (P-103)
6 — suspend_profile() blocks owner self-unsuspend via direct UPDATE
Expected persisted status: suspended
Received persisted status: draft
```

Migration 110's `profile_owner_update_content` policy has `USING (owner_user_id = auth.uid())` and `WITH CHECK (owner_user_id = auth.uid() AND status <> 'suspended')`. That check permits an owner to write `draft` to a row whose current status is `suspended`. The test proved the UPDATE affected the row and the authoritative service-role read returned `draft`.

## Follow-up blocker

JID-107 must repair and verify the Business and University Profile moderation boundary so owners cannot transition a currently suspended profile. It must use a fresh disposable local stack, retain staff-only audited reinstate functions, add regression evidence for both profile types, and avoid broad product behavior changes. JID-102 and JID-103 remain blocked on a green RLS gate.

## Cleanup

- Disposable containers remaining: 0.
- Disposable network remaining: false.
- Temporary workdir remaining: false.
- Disposable database data was deleted without backup.
- Shared `jid-platform` containers remaining: 10; none were stopped, reset, or written by JID-106.

## Quality gate

- `git diff --check`: PASS.
- `corepack pnpm type-check`: PASS.
- `corepack pnpm lint`: PASS with the same four pre-existing JID-104 Hook warnings.
- `corepack pnpm test -- tests/rls`: RED; 13 passed and 1 exact policy assertion failed.

No dependency changes were made.

## Files changed

- `tests/rls/fixtures/ownership-law.ts`
- `tests/rls/fixtures/rls-test-role-helper.sql`
- `tests/rls/ownership-law.rls.test.ts`
- `tests/rls/jobs-reanchor.rls.test.ts`
- `docs/command-center/JID-106_RLS_FIXTURE_SCHEMA_DRIFT_REPORT.md`
- `docs/command-center/TASK_BOARD.md`
- `docs/command-center/ENVIRONMENT_MAP.md`
