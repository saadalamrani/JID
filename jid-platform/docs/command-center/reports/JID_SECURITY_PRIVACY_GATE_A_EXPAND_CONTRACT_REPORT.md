# JID Security & Privacy Gate A — Expand/Contract Reconciliation Report

Date: 2026-08-09 (Asia/Riyadh)

Mode: nonproduction reconciliation; disposable local database verification only

## 1. Step 0 and history truth

- `git fetch origin` completed before reconciliation.
- Expected canonical SHA: `e876060706abd6c8fbb12d6a5f05df679d49632e`.
- Gate A source: `codex/jid-security-privacy-gate-a-reconciled` at `6551e7c0b4a8bfc9b12664d0591254e7ddf1c267`.
- Gate A parent equals expected canonical: `6551e7c^ = e876060`.
- Current `origin/agent/nonprod-signup-form` tip at fetch time was `b29846b644ab2d94ec1d88b3a0954f2f30276452` (ancestor of expected SHA; 63 commits behind `e876060`). This task did not promote or move canonical; work branched from the expected SHA required by the packet.
- New branch: `codex/jid-security-privacy-gate-a-expand-contract`.
- Historical migration `20260805190100_catalog_review_auth_wrappers.sql` remains blob `1d9ba0c85c31f3fe9223901282efeed7101b1566` (canonical with UTF-8 BOM). Gate A BOM cleanup is excluded.

## 2. Expand / Contract split

| Phase | Migration | Contents |
| --- | --- | --- |
| EXPAND | `20260809065512_security_privacy_gate_a_expand.sql` | `private` audience helpers; Individual/Mentor/review projections; additive `profile_skills_audience_read`; tightened mentor-review insert binding; consent-safe University snapshot + fail-closed owner view. Keeps base-table public policies and grants required by the deployed `e876060`/`fc852e5` app. |
| APP | application files from Gate A | Public reads move onto safe projections. |
| CONTRACT | `20260809065513_security_privacy_gate_a_contract.sql` | Drops obsolete public base-table policies; removes obsolete anon/authenticated grants; owner-only mentor base select; applications least-privilege grants. |

Final schema after EXPAND+CONTRACT is security-equivalent to approved Gate A intent. Gate A is not weakened.

## 3. Application phase

Preserved Gate A application changes:

- `src/lib/profile/individual-profile-projection.ts`
- `src/lib/profile/queries.ts`
- `src/lib/queries/mentors.ts`
- `src/lib/queries/university-dashboard.ts`
- `src/app/[locale]/(company)/_components/university-dashboard.tsx`
- focused unit/RLS tests

## 4. Canonical vs Gate A RLS comparison (disposable local)

Environment: local Supabase project `jid-platform`, `db reset --no-seed`, disposable helper `tests/rls/fixtures/rls-test-role-helper.sql` applied after each reset. Hosted Supabase untouched.

Local apply note: historical file `20260805190100_catalog_review_auth_wrappers.sql` contains a UTF-8 BOM that PostgreSQL rejects (`42601`). For disposable replay only, the BOM was stripped in the working copy during `db reset`, then the file was restored to canonical blob `1d9ba0c…` before commit. That BOM cleanup is not part of this branch.

### A. Canonical `e876060` schema (Gate A migrations aside)

- Files: 9 passed, 2 failed (11 total; Gate A focused suite excluded because objects absent)
- Tests: **85 passed**, **1 failed**, **15 skipped**
- Pre-existing failures reproduced independently:
  - `ownership-law.rls.test.ts` — expects empty RLS update result; canonical grant denial returns `42501`
  - `lammah-native-dedup.rls.test.ts` — fixture insert on `lammah_sources` denied with `42501`; 15 tests skipped after suite setup failure

Evidence: `docs/command-center/reports/ui-evidence/gate-a-expand-contract/CANONICAL_FULL_RLS.txt`

### B. Reconciled Gate A EXPAND+CONTRACT from scratch

- Focused Gate A RLS: **15/15 passed**
- Full RLS: Files 10 passed, 2 failed (12 total)
- Tests: **100 passed**, **1 failed**, **15 skipped**
- Identical pre-existing failures only (`ownership-law` `42501`, `lammah` `42501` + 15 skipped)
- **Gate A introduced ZERO additional RLS failures** (100 − 85 = 15 Gate A tests; no new failure classes)

Evidence: `GATE_A_FOCUSED_RLS.txt`, `GATE_A_FULL_RLS.txt`

Full migration replay from zero: `supabase db reset --no-seed` succeeded with EXPAND+CONTRACT present.

## 5. Deployment runbook

See `docs/command-center/reports/JID_SECURITY_PRIVACY_GATE_A_EXPAND_CONTRACT_RUNBOOK.md`.

Order: EXPAND → verify projections → deploy app → runtime smoke → CONTRACT → final RLS/privacy smoke. Rollback guidance is recorded after every stage.

## 6. Repository validations

| Check | Result |
| --- | --- |
| `git diff --check` | pass |
| `pnpm lint` | pass |
| `pnpm type-check` | pass |
| `pnpm vitest run --exclude tests/rls/**` | 57 files / 492 tests passed |
| `pnpm build` | pass (304 static pages) |
| Gate A focused RLS | 15/15 passed |
| Full RLS after EXPAND+CONTRACT | 100 passed, 1 failed, 15 skipped (pre-existing only) |
| Full migration replay from zero | `supabase db reset --no-seed` pass |

Historical wrappers blob proof: `git hash-object …/20260805190100_catalog_review_auth_wrappers.sql` = `1d9ba0c85c31f3fe9223901282efeed7101b1566` (canonical).

## 7. Promotion boundary

- `main` was not checked out or modified.
- `agent/nonprod-signup-form` was not modified or promoted.
- Production and hosted Supabase were not modified.
- This branch is for review only; hosted apply remains a separate authorized action.
