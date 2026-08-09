# JID Security & Privacy Gate A — Canonical Reconciliation Report

Date: 2026-08-09 (Asia/Riyadh)

Mode: nonproduction reconciliation; disposable local database verification only

## 1. Step 0 and history truth

- `git fetch origin --prune` completed before reconciliation.
- Actual canonical branch: `origin/agent/nonprod-signup-fix`.
- Canonical was `c1bd5cd8001504800d67c5693ff1bdef318dc995` at the first fetch, then advanced during final history proof.
- Actual final canonical SHA used for reconciliation: `e876060706abd6c8fbb12d6a5f05df679d49632e`.
- Promoted canonical commits preserved below Gate A: `fc852e5416a3a9c6d449582e5ca33bde7132f97b` (Institutional Onboarding UX) and `e876060706abd6c8fbb12d6a5f05df679d49632e` (evidence whitespace repair).
- Old Gate A branch/SHA: `codex/jid-security-privacy-gate-a` at `528b6c3b567d1ce5b35a434de6b79c32d7d2f393`.
- Old Gate A merge-base with canonical: `5d6c8e3baba1b37336f1d192ea30195f8d442953`.
- New branch: `codex/jid-security-privacy-gate-a-reconciled`.
- The isolated Gate A commit was first ported onto `c1bd5cd`, then its single unpublished commit was replayed cleanly onto the advanced canonical `e876060` without force-pushing or replacing the old branch.
- Final reconciled SHA and merge-base proof are emitted in the handoff after the evidence commit is created.

## 2. Conflicts and reconciliation decisions

The cherry-pick had no textual Git conflicts. Current canonical Wave 1 files remained authoritative outside Gate A scope.

Two security-contract reconciliations were made after the clean port:

1. Authorization helpers were moved from the exposed `public` schema to a non-exposed `private` schema. They remain fixed-search-path, session-bound, boolean-only `SECURITY DEFINER` functions used by policies and exact-column views. This follows current Supabase guidance without changing the intended audience matrix.
2. University owner dashboard reads fail closed. Canonical uses `companies.id` as institutional Directory identity, while the existing aggregate is keyed by `universities_catalog.id`; there is no populated, referentially safe mapping. Gate A does not infer identity by name or short code. The internal consent-safe catalog aggregate remains available only for privileged inspection, while University Intelligence and identity reconciliation remain separately gated.

Institutional Onboarding was present on final canonical. Its Identify → Verify → Prepare framing, terminology, AR/EN selector language, pending outcome, and deliberate post-approval Profile creation remain canonical and untouched. Wave 1 guarantees were also preserved.

## 3. Defects closed

1. `profile_skills_public_read USING (true)` was removed. Skill rows now follow the active, non-deleted parent Individual audience gate.
2. `mentor_reviews_insert_mentee` now binds reviewer, meeting, completed status, meeting mentee, and the exact meeting mentor.
3. University actors receive no cross-institution Individual rows. Consent-safe aggregate inputs require active, non-deleted, non-suspended Individuals with `show_profile_in_university_stats = true`.
4. University aggregate sources are independently grouped before joining, use distinct users/events, and avoid fan-out multiplication.
5. Public Individual, Mentor, and mentor-review reads use explicit safe projections instead of private base-table payloads.
6. In-scope `anon`/`authenticated` grants were reduced to required operations; dangerous `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER` privileges are absent.
7. `applications` has no anonymous grant or public projection. Applicant, owning Business, and staff access remains contained by existing RLS; unrelated Businesses receive no rows.
8. `lammah_profiles_function_read` remains assigned only to `lammah_function_owner`; it was not treated as public exposure and Lammah code was not changed.

## 4. Policies and grants before/after

| Contract | Before | Reconciled Gate A |
| --- | --- | --- |
| Individual public read | Public/discovery/university policies selected base `profiles` rows | Owner/staff retain base RLS; public and verified-Business audiences read exact-column projection |
| Individual skills | Unconditional public policy | `profile_skills_audience_read` calls the parent Individual audience gate |
| University Individual access | University-stat consent could authorize Individual rows without a safe canonical institution bridge | University Individual-row policy removed; owner dashboard fails closed pending identity reconciliation |
| Mentor public read | Approved rows selected from base `mentor_profiles` | Public exact-column Mentor projection; base table owner/staff only |
| Mentor review insert | Meeting predicate did not bind the review mentor safely | Reviewer, meeting, completion, mentee, and mentor all bound |
| Public mentor reviews | Public base-table rows | Exact-column public review projection with anonymous reviewer suppression |
| University snapshot | Multi-domain joins could multiply counts and include unsafe population | One consented population plus independent CV/application/meeting aggregates |
| Applications | Broad inherited table privileges | Authenticated `SELECT, INSERT, UPDATE` only; RLS contains applicant/owner/staff rows; anonymous has none |

Disposable-database privilege audit showed:

- `anon`: `SELECT` only on safe public projections and visibility-gated `profile_skills` in scope.
- `authenticated`: only the owner/staff-RLS-backed operations required by current profile, skills, mentor, review, and application flows.
- University snapshot storage: service role only.
- University owner/admin views: authenticated `SELECT`, with fail-closed or privileged predicates in the view contract.

## 5. Exact changed files versus canonical

- `docs/command-center/reports/JID_SECURITY_PRIVACY_GATE_A_REPORT.md`
- `src/app/[locale]/(company)/_components/university-dashboard.tsx`
- `src/lib/profile/individual-profile-projection.ts`
- `src/lib/profile/queries.ts`
- `src/lib/queries/mentors.ts`
- `src/lib/queries/university-dashboard.ts`
- `supabase/migrations/20260805190100_catalog_review_auth_wrappers.sql` (UTF-8 BOM removal only; SQL semantics unchanged)
- `supabase/migrations/20260809065512_security_privacy_gate_a.sql`
- `tests/rls/security-privacy-gate-a.rls.test.ts`
- `tests/unit/profile/publication-ui-routes.test.tsx`
- `tests/unit/security/privacy-gate-a-contract.test.ts`

## 6. Migration status

- A clean disposable Supabase stack replayed the complete 137-migration chain from scratch with seeds disabled.
- `20260809065512_security_privacy_gate_a.sql` applied successfully.
- The migration was replayed again after the final rebase onto `e876060`; focused live RLS tests passed against that exact schema.
- The disposable stack and its data volumes were stopped and deleted after evidence collection.
- No hosted Supabase migration was applied. Project `hmjuijmaefajdjrjdsxu` received no write from this task.
- No production database, production data, or real user data was accessed or modified.

## 7. Tests and validation

### Gate A focused evidence

- Gate A RLS: 15/15 passed.
- Combined Gate A RLS plus contract/public-route unit selection before the canonical advance: 36/36 passed across 3 files; the final-rebase RLS rerun remained 15/15.
- Coverage includes private/public skills, active verified Business gating, University cross-row denial and fail-closed owner view, consent/inactive/deleted exclusion, distinct fan-out-safe aggregates, all mentor-review positive/negative cases, safe projection columns, and application actor containment.

### Full RLS suite

- 10 files passed; 2 files reported pre-existing contract mismatches.
- 100 tests passed, 1 test failed, 15 tests skipped.
- `ownership-law.rls.test.ts` expects a direct `companies` update to return an empty RLS result, while canonical grants reject it with explicit `42501`.
- `lammah-native-dedup.rls.test.ts` fixture setup expects insert permission on `lammah_sources`, while canonical grants reject it with explicit `42501`; its 15 tests then skip.
- Gate A changes neither table. Broadening either grant would weaken canonical least privilege, so these failures were preserved and classified as pre-existing.

### Repository checks

- `corepack pnpm install --frozen-lockfile`: passed in the standalone reconciled worktree with no lockfile change. Final canonical did not change the lockfile; after one redundant Windows recreation timed out, `--force --frozen-lockfile` restored all 942 packages successfully.
- `corepack pnpm lint`: passed, no warnings or errors.
- `corepack pnpm type-check`: passed.
- `corepack pnpm test` on final canonical: 57 files passed, 12 skipped; 491 tests passed, 116 skipped.
- `corepack pnpm build`: passed after allowing the canonical Google Font downloads; 304 static pages generated.
- Initial sandboxed build failed only because network policy blocked IBM Plex Sans Arabic, Manrope, and JetBrains Mono downloads; the identical network-enabled rerun passed.
- Disposable DB lint found one pre-existing error in `public.refresh_company_badges` (`entity_type = 'company'` is invalid for the current enum). Gate A does not change that function.
- Final `git diff --check` is rerun after this report update and before commit.

### Canonical Wave 1 regression selection

- 5 files passed; 32/32 tests passed.
- Explicitly covered logo aspect, AR/EN font/parity contract, retired Pulse quick-action absence, SmartHeader/shell behavior, and University shell/journey boundaries.

### Promoted Institutional Onboarding regression selection

- 2 files passed; 28/28 tests passed after the final rebase.
- Combined Gate A contract/public-route, Wave 1, and onboarding selection: 9 files and 81/81 tests passed.
- Coverage includes Identify → Verify → Prepare framing, no visible Claim terminology, Arabic/English selector parity, pending as an outcome, and approved-without-Profile behavior.

## 8. Behavior and compatibility

- Public profile and Mentor routes keep their URLs and required display payloads, now sourced from safe projections.
- Denied external Individual reads return not-found without first fetching a private identity row.
- Public Mentor ordering uses public fields rather than internal `mentor_score`.
- University aggregate distribution fields remain nullable and the dashboard renders unavailable evidence honestly.
- University owner dashboard data remains empty until a dedicated, reviewed Directory-to-catalog identity reconciliation exists. This is the deliberate fail-closed compatibility risk.
- No Professional Discovery UI, University KPI expansion, application redesign, product positioning, or new feature was introduced.

## 9. Remaining risks and rollback

Remaining risks:

- University identity still requires a dedicated schema/data reconciliation before owner analytics or University Intelligence can safely resume.
- Materialized snapshot freshness still relies on the existing refresh mechanism; Gate A fixes privacy and truthfulness, not scheduling.
- Other legacy grants outside the named Gate A objects require separate scoped review.
- The two full-RLS harness assumptions and the pre-existing badge-function lint error need owner-domain follow-up without weakening grants.

Rollback notes:

- Rollback is forward-only: add a compensating migration; do not edit applied migration history.
- Safe projections can be revoked and replaced by a new version while base owner/staff RLS remains intact.
- Do not restore unconditional skills reads, base-table public Mentor/Profile reads, the tautological review policy, short-code/name identity authorization, or broad application grants.
- The task branch can be abandoned without affecting canonical. No hosted database rollback is required because no hosted write occurred.

## 10. Promotion boundary

- `main` was not checked out or modified.
- `agent/nonprod-signup-fix` was not modified or promoted.
- Production and hosted Supabase were not modified.
- The reconciled branch is pushed only for Nebras review; promotion remains a separate authorized action.
