# JID Spec 09 — Session D Disposable Database Transcript

## Gate

| Check | Result |
|---|---|
| Canonical tip at Session D start | `1955f5e63f62bff3bead7f7e13e76f8ca5bf36d0` |
| Session 09-C promoted SHA | `d7de682adb023867ee69ad5f708e93672eb40a6c` (ancestral) |
| Historical mirror `agent/nonprod-signup-form` | `b29846b644ab2d94ec1d88b3a0954f2f30276452` unchanged |
| JID09_RUN_ID | `jid09-20260801-7d956c` |
| Cloud link for disposable stack | **none** |

## Disposable environment

| Field | Value |
|---|---|
| Project name | `jid-09d-disposable` |
| API | `127.0.0.1:58921` |
| DB | `127.0.0.1:58922` |
| Shadow | `58920` |
| Studio | `58923` |
| Inbucket | `58924` |
| Pooler | `58929` |
| Credentials | local Supabase demo JWT keys only |
| Temporary config | `supabase/config.toml` project_id + ports + seed disabled for the run; restored to HEAD before commit |

### Migration / reset

1. Command: `npx supabase start` from `jid-platform/` with disposable `config.toml` (seed disabled).
2. Result: **PASS** — migration chain applied through `20260802090000_repair_claim_requests_residue_helpers.sql`.
3. Seed disabled; disposable-only helper `tests/rls/fixtures/rls-test-role-helper.sql` applied (not a product migration).
4. No cloud project contacted for the disposable stack.

## Synthetic actor matrix (disposable)

| Actor | Role | Purpose |
|---|---|---|
| Owner A | `company_admin` | Positive ownership / viewer_approved |
| Owner B | `company_admin` | Cross-tenant deny |
| Staff | `staff` | Assigned-reviewer matrix |
| Outsider | `individual` | Negative viewer_approved (null) |

## Positive tests

| Test | Result |
|---|---|
| No public functions retain `claim_requests` body references | PASS (`REMAINING_CLAIM_REFS []`) |
| `viewer_approved_company_id()` returns owned Business Profile directory | PASS |
| `viewer_has_approved_company_claim()` true for owner | PASS |
| Authenticated `profiles` SELECT no longer errors on residue | PASS |
| `tests/rls/ownership-law.rls.test.ts` | PASS (7) |
| `tests/rls/verification-assigned-reviewer.rls.test.ts` | PASS (12) |
| `tests/rls/profile-publication.rls.test.ts` | PASS (10) |

## Negative tests

| Test | Result |
|---|---|
| Individual outsider `viewer_approved_company_id()` → null / false | exercised in disposable probe (rollback-scoped) |
| Ownership-law cross-tenant Directory UPDATE deny | PASS via ownership-law suite |
| Non-assigned reviewer decision deny | PASS via assigned-reviewer suite |

## Audit / cleanup

| Field | Result |
|---|---|
| Audit | No production audit rows; disposable synthetic only |
| Cleanup | `npx supabase stop --project-id jid-09d-disposable --no-backup` |
| config.toml | Restored to HEAD (`jid-platform` / default ports / seed enabled) |
| Secrets committed | none |
| Cloud link | none for disposable |

## Approved non-production apply (separate from disposable)

After disposable PASS, migration `20260802090000_repair_claim_requests_residue_helpers.sql` was applied to approved non-production project `hmjuijmaefajdjrjdsxu` only.

| Check | Result |
|---|---|
| Remaining `claim_requests` function refs | `[]` |
| `viewer_approved_company_id()` callable | PASS |
| Production access | none |
