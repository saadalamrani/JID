# JID-105 Disposable RLS Gate Report

Date: 2026-07-19 (Asia/Riyadh)

## Result

The disposable local RLS harness is reproducible, but the RLS gate is red because two suites have fixture/schema drift. Repository migrations apply cleanly. The `profiles` RLS suite passes. The ownership-law and jobs-reanchor suites fail during fixture setup before their 12 assertions execute.

No product behavior, RLS policy, migration, dependency, environment secret, cloud project, or existing local database was changed.

## Target isolation evidence

- Branch: `agent/nonprod-signup-fix`.
- Project-local Supabase CLI: 2.20.12.
- Docker Desktop: running; Docker Engine 29.6.1 client was installed.
- Existing `jid-platform` local stack: created 2026-07-12, treated as pre-existing/shared, never written, stopped, or reset.
- Disposable project ID: `jid-105-disposable`.
- Temporary workdir: `.jid-local/jid-105` inside the checkout; removed after testing.
- Isolated Docker network: `jid-105-local`, host binding `127.0.0.1`; removed after testing.
- Disposable API target: `127.0.0.1:55321`.
- Disposable database target: `127.0.0.1:55322`.
- Shadow/configured service range: localhost ports 55320–55329; all were unused before startup.
- No `supabase/.temp/project-ref` cloud-link metadata existed.
- Test credentials were derived in memory from local CLI status, never printed or written.

## Repository SQL versus local applied schema

Repository SQL consisted of 120 copied migration files under `supabase/migrations`. The disposable config disabled `[db.seed]`, so no repository seed file or shared fixture dataset was loaded. The CLI applied all 120 migrations in repository order, beginning with `012_platform_foundation.sql` and ending with `126_revoke_truncate_deprecated_commitment_scores.sql`.

Local catalog evidence before cleanup:

- Migration-history rows: 120.
- `profiles` policies: 9.
- Policies across `companies`, `business_profiles`, `directory_correction_suggestions`, and `verification_requests`: 15.
- Policies across `jobs` and `applications`: 11.

This proves only the disposable locally applied schema. Cloud production and cloud non-production schema/RLS state remain unverified and were not contacted.

## Test identities and roles

The tests generate random local-only identities:

| Suite | Intended identities |
|---|---|
| Profiles | `user-a`, `user-b`: Individual |
| Ownership law | `owner-a`, `owner-b`: Business admins; `staff`: Staff; `outsider`: Individual |
| Jobs re-anchor | `jobs-owner-a`, `jobs-owner-b`, `jobs-legacy`: Business admins; `jobs-applicant`: Individual |

The profiles identities were created and cleaned successfully. In each failing suite, creation stopped at the first Business-admin profile because the fixture used an invalid enum value; the helper deleted the partially created Auth user.

## Assertions and coverage

Command: `corepack pnpm test -- tests/rls`

Totals reported by Vitest:

- Test files: 1 passed, 2 failed.
- Tests: 2 passed, 12 skipped, 0 assertion failures.
- Suite/hook errors: 4.

Passed assertions:

1. An authenticated Individual can select their own private `profiles` row.
2. The same Individual cannot select another Individual's private `profiles` row.

Not executed because fixture setup failed:

- Organization owners cannot update Directory rows directly.
- Organization owners cannot directly create owned profiles or access another owner's profile.
- Correction suggestion eligibility and field allow-list.
- Direct verification-status mutation denial.
- Staff suspension/reinstatement and owner self-unsuspend denial.
- Job ownership, cross-tenant isolation, owned-profile anchoring, transitional access, and application isolation.

## Exact failures

Primary schema/fixture drift in both failing suites:

```text
invalid input value for enum profile_state_enum: "complete"
```

Source: `tests/rls/fixtures/ownership-law.ts:37`. The locally applied enum does not accept the fixture value `complete`.

Secondary cleanup-hook errors occur because `afterAll` assumes setup completed:

- Jobs suite attempts to delete an application using an undefined ID.
- Ownership suite dereferences an undefined Directory fixture.

These are test-harness defects, not failed RLS assertions. JID-105 did not alter fixtures or policies.

## Cleanup evidence

Before stack deletion, aggregate inspection found zero remaining RLS Auth test users. Cleanup then reported:

- Disposable containers remaining: 0.
- Disposable volumes remaining: 0.
- Disposable network remaining: false.
- Temporary workdir remaining: false.
- Pre-existing `jid-platform` containers still running: 9.

## Quality gate

| Check | Result |
|---|---|
| `git diff --check` before documentation | PASS |
| `corepack pnpm type-check` | PASS |
| `corepack pnpm lint` | PASS with the same four JID-104 Hook warnings |
| Three RLS suites | RED: 2 passed, 12 skipped; 2 suite setup and 2 cleanup-hook errors |
| Focused unit tests | Not applicable; documentation only, no runtime/tooling code changed |

## Follow-up

JID-106 must reconcile the fixture value with the real profile-state model and make cleanup hooks tolerate partial setup, without weakening policies. It must then rerun all 14 RLS assertions against a fresh disposable stack. JID-102 and JID-103 must not treat the RLS gate as green until JID-106 passes.

## Files changed

- `docs/command-center/JID-105_DISPOSABLE_RLS_GATE_REPORT.md`
- `docs/command-center/ENVIRONMENT_MAP.md`
- `docs/command-center/TASK_BOARD.md`

No application component/function was created or modified. No dynamic content or reference material was involved.
