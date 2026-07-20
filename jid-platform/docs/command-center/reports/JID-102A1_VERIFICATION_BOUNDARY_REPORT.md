# JID-102A1 — Verification Request Insert Boundary Report

Date: 2026-07-20 (Asia/Riyadh)

## Result

Closed the `verification_requests` INSERT forge path for Business and University applicants. Pre-fix, an authenticated applicant could INSERT `status = 'approved'` (and staff-controlled fields) and then call `create_business_profile`. Post-fix, applicants may INSERT only their own `pending_review` row with staff/decision/resulting-profile fields null/empty; Staff approve/reject remain RPC-only; approval still does not create a Profile.

No Supabase cloud project, remote database, Vercel project, production resource, shared local `jid-platform` database, secret, or `main` branch was contacted or changed.

## Step 0 — Inspection summary

- Base branch: `agent/nonprod-signup-form`
- Required base HEAD confirmed: `8772951a92c1e46b968d682ed3aad89ae99c9e20`
- Worktree branch: `cursor/jid-102a1-verification-boundary`
- Final INSERT policy before fix (migration `111`): `WITH CHECK (applicant_user_id = auth.uid())` only
- Legitimate initial status used by app (`submitClaimRequest` / `submitCatalogClaim`): `pending_review`
- Zero direct UPDATE policies by design; transitions via `approve_verification_request` / `reject_verification_request`
- Profile creation is a separate deliberate RPC (`create_business_profile` / `create_university_profile`) gated on `status = 'approved'`

### Chosen boundary mechanism

Bounded combination (after inspection):

1. Column-level INSERT privileges for `authenticated` (submission columns only)
2. Tightened INSERT RLS `WITH CHECK` requiring `pending_review`, Business/University type, and null/empty staff-controlled fields
3. `REVOKE ALL` from `anon` / `authenticated` with selective re-grants (SELECT + column INSERT)

## Migration

`supabase/migrations/127_verification_requests_insert_boundary.sql`

## Isolation

- Disposable project: `jid-102a1-disposable` (distinct from shared `jid-platform`)
- API/DB: `127.0.0.1:58321` / `127.0.0.1:58322`
- Seeds disabled (`[db.seed] enabled = false`)
- No cloud link / no remote credentials
- Shared `jid-platform` containers left running and untouched

## Pre-fix exploit

Against the disposable schema with all migrations through JID-107 and **without** migration 127:

- Forged INSERT with `status = 'approved'` + reviewer fields: **succeeded**
- `create_business_profile` on the forged row: **succeeded** (Profile created)
- Verdict: `exploitConfirmed = true`

## Post-fix RLS evidence

Command: `corepack pnpm test -- tests/rls` (disposable local env)

- Test files: 5 passed
- Total tests: 37
- Passed: 37
- Failed: 0
- Skipped: 0

### JID-102A1 matrix (13/13)

1. Anonymous INSERT denied
2. Legitimate own `pending_review` succeeds
3. Forged `approved` denied
4. Forged rejected/staff-controlled statuses denied
5. Reviewer fields denied
6. Decision fields denied
7. `resulting_profile_*` / staff arrays denied
8. Another `applicant_user_id` denied
9. Pending cannot create Business Profile
10. Pending cannot create University Profile
11. Staff approval and rejection via RPC still work
12. Approval does not create a Profile
13. Rejection and reapplication remain functional

### JID-107 regression

`tests/rls/moderation-boundary.rls.test.ts`: 10/10 passed (included in the 37).

Ownership-law assertion 5 updated to accept privilege denial (`42501`) in addition to empty RLS update results, because migration 127 revokes table UPDATE for API roles while preserving “no direct status transition.”

## Quality gate

- `git diff --check`: PASS
- `corepack pnpm --version`: 9.15.4
- `corepack pnpm install --frozen-lockfile`: PASS
- `corepack pnpm lint`: PASS (0 warnings/errors)
- `corepack pnpm type-check`: PASS
- `corepack pnpm test`: PASS — 42 passed; 37 skipped (RLS suites skip without disposable env; intentional)
- `corepack pnpm build`: PASS

## Files changed

- `supabase/migrations/127_verification_requests_insert_boundary.sql`
- `tests/rls/verification-insert-boundary.rls.test.ts`
- `tests/rls/ownership-law.rls.test.ts`
- `docs/command-center/reports/JID-102A1_VERIFICATION_BOUNDARY_REPORT.md`
- `.gitignore` (ignore `.jid-local/`)

## Cleanup

- Disposable containers remaining: 0
- Disposable volumes remaining: 0
- Disposable networks remaining: 0
- Temporary workdir `.jid-local` remaining: false
- Shared `jid-platform` containers remaining: 9; none reset, stopped, or written by JID-102A1
