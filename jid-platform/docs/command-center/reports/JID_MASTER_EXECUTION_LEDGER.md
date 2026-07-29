# JID Master Execution Ledger

## Specification 04 — Business End-to-End Journey

| Field | Value |
|---|---|
| specification | 04 |
| status | SHIPPED |
| session | 04-C closeout (Sessions 04-A, 04-B complete) |
| Session A base SHA | 5af8b8aa6786fc45b19e3ea7eba49cdf52c284f1 |
| Session A source branch | cursor/jid-04a-chain-reconciliation |
| Spec 03 gate | SHIPPED; promoted SHA `548b40a8563ac22130d44c055c5eae2c638f4fb7` is an ancestor of Session A base |
| intervening_commits | `5af8b8a` Harden Lammah against native opportunity duplication |
| intervening_scope_touch | none — intervening commit does not touch Spec 04 file areas |
| Session A defect inventory | DEF-01…DEF-08 |
| Session A local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (233 passed / 61 skipped without disposable env); corepack pnpm build PASS |
| Session A validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30390061942 (SHA c45f10a) |
| Session A target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30390421380 (SHA c45f10a on agent/nonprod-signup-fix) |
| Session A Vercel | PASS — Vercel Preview Comments success (check-run 90380850646) |
| Session A implementation SHA | c45f10a6c2e286a18307d5311a3e77d1a1a0f030 |
| Session A promoted SHA | c45f10a6c2e286a18307d5311a3e77d1a1a0f030 |
| Session B base SHA | c45f10a6c2e286a18307d5311a3e77d1a1a0f030 |
| Session B source branch | cursor/jid-04b-chain-fixes |
| Session B defects fixed | DEF-01…DEF-08 (all Session A named defects) |
| Session B files | company/profile/page.tsx; (company)/layout.tsx; company/create-profile/page.tsx; business-create-profile-gate.ts; verification-outcome.ts; company/verification-pending/page.tsx; (company)/billing/page.tsx; middleware.ts; owner-business-profile.ts; tests/unit/entity/business-journey-chain.test.ts; verification-outcome-ui.test.tsx |
| Session B observations unfixed | University create-profile / pending-review mirror pre-fix Business anti-patterns (Spec 05). Staff/sys middleware still uses notFound for wrong-role (intentional; DEF-06 scoped to general entity guards). `getCurrentViewer` still resolves Directory id via approved verification (unused by fixed /company/profile). |
| Session B local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (253 passed / 61 skipped without disposable env); corepack pnpm build PASS |
| Session B validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30395358647 (SHA 8809b74) |
| Session B target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30395717616 (SHA 8809b74 on agent/nonprod-signup-fix) |
| Session B Vercel | PASS — Vercel Preview Comments success (check-run 90398493962) |
| Session B implementation SHA | 8809b745c8886dcd685b62f288b4e8b35df53b52 |
| Session B promoted SHA | 8809b745c8886dcd685b62f288b4e8b35df53b52 |
| Session C base SHA | 8809b745c8886dcd685b62f288b4e8b35df53b52 |
| Session C source branch | cursor/jid-04c-closeout |
| Session C regression | PASS — full local suite at Session B tip + closeout commit; one closeout repair (duplicate `company` message key merge) |
| Session C repair | Merged duplicate top-level `company` keys in `messages/en.json` + `messages/ar.json` so `company.nav` / shell / profileCreation remain with boost/ssis (JSON last-key-wins had shadowed portal copy). Minimal integrity test added. |
| Session C evidence set | `docs/command-center/reports/ui-evidence/spec-04/` — real Playwright Chromium PNG captures + INDEX.md (AR/EN full chain; rejected/reapply; AR 375px primary + mobile rejected set) |
| Session C route map | see table below |
| Session C preserved contracts | PASS — `rejected-claim.ts` byte-identical vs Session B tip; `supabase/migrations` byte-identical; Session B product paths for DEF-01…DEF-08 unchanged in this closeout except messages/tests/docs |
| Session C local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (254 passed / 61 skipped); corepack pnpm build PASS |
| Session C validation CI | PENDING (reported in completion response) |
| Session C target CI | PENDING (reported in completion response) |
| Session C Vercel | PENDING (reported in completion response) |
| Session C implementation SHA | PENDING (reported in completion response) |
| Session C promoted SHA | PENDING (reported in completion response after FF promotion) |

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

### Session 04-A defects for Session B (all FIXED in 04-B)
1. **DEF-01** — FIXED: `company/profile/page.tsx` now uses `fetchOwnerBusinessProfile` + `BusinessProfileView`.
2. **DEF-02** — FIXED: `(company)/layout.tsx` removed Directory claim ownership branch.
3. **DEF-03** — FIXED: create-profile uses `fetchOwnerBusinessProfileRow` + gate helper before wizard.
4. **DEF-04** — FIXED: orphaned `resulting_profile_id` → create_profile stay (no dashboard loop).
5. **DEF-05** — FIXED: empty/non-approved paths use Spec §8 via `resolveBusinessCreateProfileGate`.
6. **DEF-06** — FIXED: middleware entity wrong-role → `redirectTo(/login)`.
7. **DEF-07** — FIXED: billing uses `fetchOwnerBusinessProfile.directory_id`.
8. **DEF-08** — FIXED: verification-pending loads profile row into `resolveVerificationOutcome`.

### Session 04-B scope (complete)
- Fixed every Session A named defect; added Spec §20 integration suite + per-defect regressions.
- No schema, RPC, RLS, dashboard-metric, correction-apply-path, or publication changes.
- Promoted SHA `8809b745c8886dcd685b62f288b4e8b35df53b52`.

### Session 04-C scope (complete — closeout)
- Full regression of Sessions A+B together; real-browser AR/EN smoke walks + 375px primary; Business rejected→reapply both locales; route map; preserved-contract verification; ledger `SHIPPED`.
- Closeout repair only: duplicate `company` message namespace merge (required for `StandardCompanyLayout` / portal copy after DEF-02).

### Specification 04 route map (Session C)

| Route | Guard (`guards.ts` / page) | Destination logic |
|---|---|---|
| `/signup/business` | public | redirect → `/signup/company` |
| `/signup/company` | public (`onboarding-company-entity`) | Entity signup wizard; submit → pending verification path |
| `/company/verification-pending` | `entity` \| `company_admin` (no org_profile) | Spec §8 pending / needs_more_info; else redirect via `resolveVerificationOutcome` |
| `/company/verification-rejected` | `entity` \| `company_admin` | Latest rejected + reapply CTA → `/company/verification/reapply` |
| `/company/verification/reapply` | `entity` \| `company_admin` | ClaimSubmissionForm when `canReapplyNow`; else blocked copy |
| `/company/create-profile` | `entity` \| `company_admin` | `resolveBusinessCreateProfileGate` → wizard / redirect (DEF-03/04/05) |
| `/company/profile` | org_profile business | `fetchOwnerBusinessProfile` + `BusinessProfileView` (DEF-01) |
| `/company/profile/edit` | org_profile business | Owner management (PSW-001); sections include reference + correction entry |
| `/company/profile/preview` | org_profile business | Owner visitor preview |
| `/company/dashboard` | org_profile business | Owner dashboard (placeholder metrics → Spec 08) |
| `/company/billing` | org_profile business | Billing uses owned Profile `directory_id` (DEF-07) |
| `/company/profile-suspended` | `entity` \| `company_admin` | Suspended override surface |
| `/catalog/[slug]` | public | Directory reference + `CorrectionSuggestionForm` entry (apply-path Spec 06) |
| Entity wrong-role on company routes | middleware | `redirectTo(/login)` (DEF-06); staff/sys still `notFound` |

### Still deferred (not resolved by Specification 04)
- Dashboard honesty / placeholder metrics (Specification 08)
- UI restyling (Specification 08 W9-B)
- Correction apply-path (Specification 06)
- Publication (Specification 07)
- University create-profile / pending-review mirror cleanup (Specification 05)
- Permanent migration repair for `viewer_approved_*` still referencing `claim_requests` after P-101 rename (local disposable compat view used only for Session C smoke)

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
