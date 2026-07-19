# JID-107 Suspended Profile Transition Boundary Report

Date: 2026-07-19 (Asia/Riyadh)

## Result

The local RLS gate is green. A forward-only migration prevents Business and University Profile owners from directly changing moderation fields and excludes suspended rows from owner UPDATE access. Legitimate content editing remains available on an owner's non-suspended Profile. Existing staff-only audited suspension and reinstatement RPCs continue to work.

No Supabase cloud project, remote database, Vercel project, production resource, shared local database, secret, dependency, or `main` branch was contacted or changed.

## Migration

`20260719100425_enforce_suspended_profile_transition_boundary.sql`

The migration:

- replaces `profile_owner_update_content` and `university_profile_owner_update_content` so both `USING` and `WITH CHECK` require ownership and a non-suspended status;
- adds `enforce_owned_profile_moderation_boundary()` to reject owner changes to `status`, `verified_badge`, or `published_at`;
- adds the boundary trigger to `business_profiles` and `university_profiles`;
- explicitly revokes direct execution of the trigger function from public API roles;
- leaves `suspend_profile` and `reinstate_profile` definitions and grants unchanged.

The trigger permits service-role/internal maintenance and authenticated Staff/Super Admin moderation. Owner content updates are allowed only while the current row is not suspended and moderation fields are unchanged.

## Isolation and applied schema

- Branch: `agent/nonprod-signup-fix`.
- Repository-local Supabase CLI: 2.20.12.
- Disposable project: `jid-107-disposable`, distinct from shared `jid-platform`.
- Disposable API/database targets: `127.0.0.1:57321` and `127.0.0.1:57322`.
- Docker network: `jid-107-local`, bound to `127.0.0.1`.
- Temporary service range: localhost ports 57320–57329; unused before startup.
- Cloud project reference: absent.
- Applied migrations: 121, including the prior 120 and the JID-107 migration.
- Repository seeds: disabled.
- Local credentials: held only in process memory and never printed or committed.

Catalog inspection confirmed both policies include `status <> 'suspended'` in current-row and resulting-row predicates, both boundary triggers exist, and the existing moderation RPCs remain security-definer.

This evidence covers only the disposable locally applied schema. Cloud production and cloud non-production remain unverified and were not contacted.

## RLS evidence

Complete command: `corepack pnpm test -- tests/rls`

- Test files: 4 passed.
- Total tests: 24.
- Passed: 24.
- Failed: 0.
- Skipped: 0.
- Previous assertions: 14/14 passed.
- New moderation assertions: 10/10 passed.

Focused command: `corepack pnpm test -- tests/rls/moderation-boundary.rls.test.ts`

- Test files: 1 passed.
- Tests: 10 passed.
- Failed/skipped: 0/0.

### Business Profile evidence

- Owner content update on own non-suspended Profile succeeded.
- Cross-owner update returned zero rows and changed nothing.
- Direct status change was rejected by the moderation boundary.
- Staff suspension set status to `suspended` and wrote an audit record.
- Suspended owner self-reinstatement/content bypass returned zero rows; persisted status and content remained unchanged.
- Staff reinstatement returned the Profile to `draft` and wrote an audit record.

### University Profile evidence

- Owner content update on own non-suspended Profile succeeded.
- Cross-owner update returned zero rows and changed nothing.
- Direct status change was rejected by the moderation boundary.
- Staff suspension set status to `suspended` and wrote an audit record.
- Suspended owner self-reinstatement/content bypass returned zero rows; persisted status and content remained unchanged.
- Staff reinstatement returned the Profile to `draft` and wrote an audit record.

## Cleanup

Before stack removal, remaining RLS Auth users, Business Profile fixtures, and University Profile fixtures were each zero.

- Disposable containers remaining: 0.
- Disposable network remaining: false.
- Temporary workdir remaining: false.
- Disposable data removed without backup.
- Shared `jid-platform` containers remaining: 10; none were reset, stopped, or written by JID-107.

## Quality gate

- `git diff --check`: PASS.
- `corepack pnpm type-check`: PASS.
- `corepack pnpm lint`: PASS with the four pre-existing JID-104 Hook warnings.
- Focused safe unit tests: not applicable; the changed behavior is database authorization and is covered by local RLS integration tests.

## Files changed

- `supabase/migrations/20260719100425_enforce_suspended_profile_transition_boundary.sql`
- `tests/rls/fixtures/ownership-law.ts`
- `tests/rls/ownership-law.rls.test.ts`
- `tests/rls/moderation-boundary.rls.test.ts`
- `docs/command-center/JID-107_SUSPENDED_PROFILE_BOUNDARY_REPORT.md`
- `docs/command-center/TASK_BOARD.md`
- `docs/command-center/ENVIRONMENT_MAP.md`
