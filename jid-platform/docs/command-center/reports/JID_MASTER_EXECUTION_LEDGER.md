# JID Master Execution Ledger

## Specification 04 — Business End-to-End Journey

| Field | Value |
|---|---|
| specification | 04 |
| status | IN_PROGRESS |
| session | 04-A COMPLETE (defect inventory; no product edits) |
| Session A base SHA | 5af8b8aa6786fc45b19e3ea7eba49cdf52c284f1 |
| Session A source branch | cursor/jid-04a-chain-reconciliation |
| Spec 03 gate | SHIPPED; promoted SHA `548b40a8563ac22130d44c055c5eae2c638f4fb7` is an ancestor of Session A base |
| intervening_commits | `5af8b8a` Harden Lammah against native opportunity duplication |
| intervening_scope_touch | none — intervening commit does not touch `src/app/[locale]/(company)/**`, `src/lib/profile/owner-business-profile.ts`, or `src/lib/auth/verification.ts` (diff empty). Touches Lammah/public opportunities, messages (Lammah keys), migration `20260726183230_lammah_native_dedup_boundary.sql`, and Lammah tests only. |
| Session A defect inventory | DEF-01…DEF-08 (see below) — not empty |
| Session A local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (233 passed / 61 skipped without disposable env); corepack pnpm build PASS (recorded at commit time from pre-flight) |
| Session A validation CI | PENDING (reported in Session A completion response after push) |
| Session A target CI | PENDING (reported in Session A completion response after promote) |
| Session A Vercel | PENDING (reported in Session A completion response after promote) |
| Session A implementation SHA | PENDING (ledger-only findings commit; reported in completion response) |
| Session A promoted SHA | PENDING (reported in completion response after FF promotion) |

### Session 04-A verified starting-state (present)
- Business signup: `/signup/business` → `/signup/company`; `EntitySignupWizard entityType="company"` (DB type `business` via `toDbEntityType`).
- Spec 03 surfaces: `/company/verification-pending`, `/company/verification-rejected`, `/company/verification/reapply`.
- `/company/create-profile`: gated by `getMyApprovedVerifications`; RPC `create_business_profile` draft-only.
- `/company/profile` + `/company/profile/edit` exist; edit uses `fetchOwnerBusinessProfile` + PSW-001 save/reload.
- `/company/dashboard` exists; placeholder metrics retained (Spec 08).
- `/company/profile-suspended` exists.
- Catalog Directory detail + `CorrectionSuggestionForm` entry point present (apply-path = Spec 06).
- `fetchOwnerBusinessProfile` owner-scoped; legacy stubs `claim/reapply`, `pending-review`, `rejected` redirect correctly.

### Session 04-A transition inventory
| Transition | Result |
|---|---|
| Signup → submit → pending | verified correct |
| Rejected → Spec 03 reapply loop | verified correct |
| Approved → create-profile (happy path) | verified correct (fallback path DEF-05) |
| Create-profile → draft RPC | verified correct |
| Draft → `/company/profile` view | DEF-01 |
| Edit + save + reload | verified correct |
| Owner preview + public draft invisibility | verified correct |
| Directory reference + correction entry | verified correct |
| Dashboard page (fetchOwnerBusinessProfile) | verified correct (layout DEF-02) |
| Suspended override (org_profile routes) | verified correct |
| Wizard re-entry with existing Profile | DEF-03 / DEF-04 |
| Non-owner / wrong-role | DEF-06 (no silent wrong-data 200 on edit) |

### Session 04-A defects for Session B
1. **DEF-01** — `company/profile/page.tsx` + `lib/profile/queries.ts` (`getCurrentViewer` / `fetchOwnCompanyPageContext`): renders Directory/`companies` via approved `verification_requests.directory_id`, not owned draft `business_profiles`. Expected: owned draft Profile view (non-public).
2. **DEF-02** — `(company)/layout.tsx`: still selects `companies.claimed_by` and can wrap pages in `UniversityLayout`. Expected: Profile/`owner_user_id` only (no Directory claim ownership for layout).
3. **DEF-03** — `company/create-profile/page.tsx`: re-entry checks only `resulting_profile_id`, not existing Profile by `owner_user_id`. Expected: existing Profile → redirect (not wizard / RPC error).
4. **DEF-04** — `verification-outcome.ts` approved branch ignores orphaned `resulting_profile_id` when no profile row; with create-profile’s `resulting_profile_id`→dashboard redirect and middleware `organization_profile`, can loop dashboard↔create-profile. Expected: no loop; honest recovery or dashboard precedence per Spec §8.
5. **DEF-05** — `company/create-profile/page.tsx`: empty approved list always redirects to `verification-pending`. Expected: Spec §8 via `resolveVerificationOutcome` (rejected → rejected; none → signup).
6. **DEF-06** — middleware wrong-role → `notFound()` 404. Expected per Spec §14: honest unauthorized redirect (never wrong-data 200; prefer redirect over bare 404).
7. **DEF-07** — `(company)/billing/page.tsx`: resolves company via `companies.claimed_by`. Expected: owned Profile / non-claim ownership model within `(company)` scope.
8. **DEF-08** — `company/verification-pending/page.tsx`: passes `profile: null` into `resolveVerificationOutcome`, so owned/suspended Profile precedence is skipped if URL is hit post-profile. Expected: load profile row first per Spec §8.

### Session 04-A route map (route → guard → logic)
| Route | Guard | Logic |
|---|---|---|
| `/signup/company` | public signup | EntitySignupWizard company→business |
| `/signup/business` | public | → `/signup/company` |
| `/company/verification-pending` | company-verification-pending (no org_profile) | stay pending/needs_more_info; else outcome.path (DEF-08) |
| `/company/verification-rejected` | company-verification-rejected | latest rejected or → signup |
| `/company/verification/reapply` | company-verification-reapply | eligible form / blocked / → pending |
| `/company/pending-review` | legacy | → verification-pending |
| `/company/rejected` | legacy | → verification-rejected |
| `/company/claim/reapply` | legacy | → verification/reapply |
| `/company/create-profile` | company-create-profile (no org_profile) | DEF-03/04/05 gates; else wizard |
| `/company/dashboard` | company-portal + org_profile | draft/published via fetchOwnerBusinessProfile |
| `/company/profile` | company-portal + org_profile | DEF-01 Directory view |
| `/company/profile/edit` | company-portal + org_profile | owner draft management |
| `/company/profile/preview` | company-portal + org_profile | owner visitor preview |
| `/company/profile-suspended` | company-profile-suspended | suspended message |
| `/company/billing` (group) | company-portal + org_profile | DEF-07 claimed_by |
| `/catalog/[slug]` | public | Directory + correction entry if owner |
| `/companies/[slug]/profile` | public | published Profile only |

### Session 04-A scope notes
- No product-code, schema, RLS, or migration changes (ledger-only).
- Dashboard placeholder metrics retained (Spec 08).
- Correction apply-path deferred (Spec 06); publication deferred (Spec 07).
- Terminology note (non-blocking): signup prop `entityType="company"` vs Spec wording "business"; internal Claim* component names remain (external contracts).

### Still deferred (Specification 04)
- Session B: fix DEF-01…DEF-08 only
- Session closeout / evidence walks

---

## Specification 03 — Entity Rejection / Reapply Journey

| Field | Value |
|---|---|
| specification | 03 |
| status | SHIPPED |
| session | 03-D closeout (Sessions 03-A, 03-B complete; Session 03-C SKIPPED) |
| Session A base SHA | ed5bc4048733a654b72d544b38248e3854481540 |
| Session A source branch | cursor/jid-03a-baseline-reconciliation |
| Spec 02 gate | SHIPPED at tip `ed5bc4048733a654b72d544b38248e3854481540` (required before Spec 03) |
| duplicate_prevention_gap | false |
| duplicate_prevention_gap evidence | BEFORE INSERT trigger `enforce_verification_request_applicant_insert_boundary` (migration `20260720072615_harden_verification_request_insert_boundary.sql`) raises `active_verification_request_exists` when the same authenticated applicant already has any row in pending/submitted/pending_review/under_review/needs_more_info (applicant-scoped; covers same-user+same-directory duplicates). RLS suite `verification-insert-boundary.rls.test.ts` asserts the duplicate insert is denied. App-layer `submitClaimRequest` only pre-checks reapply cooldown (no active-duplicate pre-check); the DB trigger remains the authoritative race-safe boundary. |
| Session A verified files | Business: `company/verification-pending`, `company/verification-rejected` (links `/company/verification/reapply`), `company/verification/reapply` (ClaimSubmissionForm). University: `university/pending-review`, `university/rejected` (CTA links `/signup/university` — **no** `university/.../reapply` route at Session A). Helpers: `rejected-claim.ts` (`getLatestRejectedVerification`, `canReapplyNow`, `formatRequiredDocuments`); `claims.ts` `submitClaimRequest`. Messages: `entity.rejected` EN+AR key parity. Migration: `20260720072615_harden_verification_request_insert_boundary.sql`. |
| Session A local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (213 passed / 46 skipped without disposable env); corepack pnpm build PASS |
| Session A validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30159630774 (SHA a458f38) |
| Session A target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30159752959 (SHA a458f38 on agent/nonprod-signup-fix) |
| Session A Vercel | PASS — Vercel Preview Comments success for jid-dev against SHA a458f38 (check-run 89683232991) |
| Session A implementation SHA | a458f38dd53ddd9467db573528f686a8ee9800c2 |
| Session A promoted SHA | a458f38dd53ddd9467db573528f686a8ee9800c2 |
| Session B base SHA | a458f38dd53ddd9467db573528f686a8ee9800c2 |
| Session B source branch | cursor/jid-03b-reapply-and-outcome-implementation |
| Session B files | university/reapply; university/rejected CTA; company/university pending + rejected + create-profile; verification-outcome.ts; organization-profile.ts; guards.ts; pending-review-view; messages en/ar; tests/unit/entity/** |
| Session B local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (227 passed / 46 skipped without disposable env); corepack pnpm build PASS |
| Session B validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30167184297 (SHA 7ad3fe9) |
| Session B target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30167327728 (SHA 7ad3fe9 on agent/nonprod-signup-fix) |
| Session B Vercel | PASS — Vercel — jid-dev success for SHA 7ad3fe9 (check-run 89702680632) |
| Session B implementation SHA | 7ad3fe96142c301293d295b3b283e78c31cc1623 |
| Session B promoted SHA | 7ad3fe96142c301293d295b3b283e78c31cc1623 |
| Session C base SHA | 7ad3fe96142c301293d295b3b283e78c31cc1623 |
| Session C source branch | cursor/jid-03c-duplicate-prevention-boundary |
| session_03_c | SKIPPED |
| Session C skip reason | Session A recorded `duplicate_prevention_gap=false` with BEFORE INSERT trigger `enforce_verification_request_applicant_insert_boundary` as the race-safe authoritative boundary; MECHANICAL GATE required no product-code change, no migration, and no disposable database environment. |
| Session C migration | none (skipped — no gap) |
| Session C disposable DB matrix | not run (skipped — no gap) |
| Session C local validation | ledger-only commit; no product/migration/test changes |
| Session C validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30167599881 (SHA e18a9f4) |
| Session C target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30167714830 (SHA e18a9f4 on agent/nonprod-signup-fix) |
| Session C Vercel | PASS — Vercel Preview Comments success (check-run 89703740319) |
| Session C implementation SHA | e18a9f4677ad5c5320558b6b7c23467e250c28d5 |
| Session C promoted SHA | e18a9f4677ad5c5320558b6b7c23467e250c28d5 |
| Session D base SHA | e18a9f4677ad5c5320558b6b7c23467e250c28d5 |
| Session D source branch | cursor/jid-03d-closeout |
| Session D regression | PASS — full local suite at Session C tip; no product regressions found; no repair commits |
| Session D local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (227 passed / 46 skipped without disposable env); corepack pnpm build PASS |
| Session D terminology sweep | PASS — ZERO visible Claim/مطالبة in `entity.rejected|reapply|pendingReview|approvedWithoutProfile` EN+AR (evidence: `docs/command-center/reports/ui-evidence/spec-03/terminology-sweep.txt`) |
| Session D preserved contracts | PASS — migrations after Spec 02 tip: none; harden trigger + Spec 02 decision RPCs + `rejected-claim.ts` byte-identical vs `ed5bc40` |
| Session D evidence set | `docs/command-center/reports/ui-evidence/spec-03/` (28 HTML captures + INDEX.md + terminology-sweep.txt; AR/EN; desktop + 375px mobile) |
| Session D validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30168421689 (SHA 548b40a) |
| Session D target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30168577485 (SHA 548b40a on agent/nonprod-signup-fix) |
| Session D Vercel | PASS — Vercel Preview Comments success (check-run 89705660985) |
| Session D implementation SHA | 548b40a8563ac22130d44c055c5eae2c638f4fb7 |
| Session D promoted SHA | 548b40a8563ac22130d44c055c5eae2c638f4fb7 |

### Session 03-A scope (complete)
- Baseline reconciliation against Spec 02 SHIPPED tip `ed5bc40`.
- Verified starting-state routes/helpers/messages and insert-boundary migration.
- Recorded `duplicate_prevention_gap: false` with trigger + RLS-test + application-path evidence (no product fix; no university reapply route built — deferred to Session B).

### Session 03-B scope (complete)
- University `/university/reapply` route reusing rejected-claim helpers (Business behavior, university flat naming).
- Spec 03 §8 state-resolution shared helper + organization-profile / pending-page alignment; `needs_more_info` honest awaiting copy.
- Explicit approved-without-profile notice (no auto-creation) on both create-profile pages.
- Terminology + `noReason` fallback; AR/EN parity tests under `tests/unit/entity/**`.
- No RLS, RPC, schema, or duplicate-prevention changes.
- Promoted SHA `7ad3fe96142c301293d295b3b283e78c31cc1623`.

### Session 03-C scope (complete — SKIPPED)
- Evaluated Session A's `duplicate_prevention_gap=false`.
- Confirmed the existing authoritative insert boundary already prevents a second active request.
- Correctly skipped database fix, migration, and disposable-database validation.
- Ledger-only update promoted at `e18a9f4677ad5c5320558b6b7c23467e250c28d5`.

### Session 03-D scope (complete — closeout)
- Full regression suite; journey evidence; terminology sweep; preserved contracts; ledger `SHIPPED`.

### Still deferred (not resolved by Specification 03)
- Needs-more-info respond flow
- Evidence upload / view / download
- Notification rendering (Specification 06)
- Visual redesign (Specification 08 W9-A)

---
