# JID Master Execution Ledger

## Specification 06 — Directory Correction and Notifications

| Field | Value |
|---|---|
| specification | 06 |
| status | IN_PROGRESS |
| session | 06-C COMPLETE (disposable-DB matrix; promotion pending CI + FF) |
| Session C base / integration starting SHA | 19cb0112b05752530da3a8dcd9fd89c5958869bc |
| Session C source branch | cursor/jid-06c-security-validation |
| Session 06-B implementation SHA | 45020bb37d652bf0f6362ce5fb95b03515ed75ce |
| Session 06-B ancestry | integration tip is ancestor of 06-B tip (exit 0) |
| Session C disposable project | `jid-06c-disposable` |
| Session C disposable ports | API 58421; DB 58422; shadow 58420; Studio 58423; Inbucket 58424; pooler 58429; analytics(disabled) 58427 |
| Session C migration/reset | first start applied full chain incl. 06-B then failed seed (`_seed_local_auth_user` missing); seed disabled; second start PASS; migrations through `20260730190001`; disposable helper SQL applied (not a product migration) |
| Session C POSITIVE A | PASS — approve; city only; ownership/verification/status untouched; decided; audit `directory.corrected`; suggester notification (06-A identity supported) |
| Session C POSITIVE B | PASS — reject; no companies change; decided; audit `directory.correction_rejected`; suggester notification |
| Session C NEGATIVE | PASS — non-staff RPC; non-staff action path (unit); anon privileged; non-whitelist; ownership/verification field; double/already-decided; missing directory + no orphan; own-read only; foreign suggester denied; anon private read denied; unauthorized companies UPDATE denied; audit/notification forge denied |
| Session C atomicity | PASS — failing approve (`directory_missing`) leaves pending suggestion, no company/audit/notification partial writes |
| Session C security-advisor | CLI advisors unavailable (v2.20.12); `supabase db lint --local` ran — pre-existing lint only; no Spec 06 correction-path repair required |
| Session C scoped repairs | none (matrix/helper/unit coverage only) |
| Session C cleanup | PASS — stop --no-backup; zero jid-06c containers/volumes/networks; unique ports released; no cloud; no real credentials; config.toml restored |
| Session C transcript | `docs/command-center/reports/JID_06_disposable_db_transcript.md` |
| Session C local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm exec vitest run --testTimeout=30000 PASS (294 passed / 74 skipped without disposable env); corepack pnpm build PASS |
| Session C validation CI | PENDING (reported in completion response) |
| Session C target CI | PENDING (reported in completion response) |
| Session C Vercel | PENDING (reported in completion response) |
| Session C combined / promoted SHA | PENDING (reported in completion response — do not self-embed) |
| Session B base SHA | 19cb0112b05752530da3a8dcd9fd89c5958869bc |
| Session B source branch | cursor/jid-06b-correction-implementation |
| Spec 06-A gate | COMPLETE at tip `19cb0112b05752530da3a8dcd9fd89c5958869bc` (equals Session A promoted SHA; intervening commits: none) |
| Session 06-A findings acted on | apply_path=complete → extend existing approve/reject RPCs (no `apply_directory_correction` duplicate); rls_correct=true → no RLS edit; suggester_identity_supported=yes → dispatch_notification to suggested_by; notification_render/duplicates deferred to Session D |
| Session B migrations | `20260730190000_directory_correction_notification_categories.sql`; `20260730190001_directory_correction_apply_hardening.sql` |
| Session B files | migrations ×2; staff/directory/actions.ts; suggestions-review-list.tsx; messages en/ar; CategoryIcon/categories/category-groups/preference-defaults; supabase/types.ts; tests unit ×2 + rls ×1 |
| Session B local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (293 passed / 67 skipped); corepack pnpm build PASS |
| Session B validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30573578420 (SHA 45020bb on codex/jid-06b-ci-validation) |
| Session B implementation SHA | 45020bb37d652bf0f6362ce5fb95b03515ed75ce |
| Session B promoted | **yes via Session 06-C** when FF completes (matrix + cleanup + local + validation CI) |
| Session A base SHA | 958ebf074a78d9883209fe4b63c844c77a37cce2 |
| Session A source branch | cursor/jid-06a-reconciliation |
| Spec 05 gate | SHIPPED; required SHA `958ebf074a78d9883209fe4b63c844c77a37cce2` equals resolved tip of `origin/agent/nonprod-signup-fix` and is an ancestor of that tip |
| intervening_commits | none — tip equals Spec 05 final tip SHA |
| intervening_scope_touch | none — no commits after Spec 05 tip; Spec 06 §10 areas unchanged since tip |
| apply_path | **complete** — migration `112_directory_correction_suggestions.sql` defines SECURITY DEFINER `approve_correction_suggestion` / `reject_correction_suggestion` (staff\|super_admin, pending gate, field whitelist, `companies` UPDATE on approve, `_write_audit_log` on both); app wiring `src/lib/staff/moderation.ts` → `staff/directory/actions.ts` `reviewCorrectionSuggestion` → UI `SuggestionsReviewList`; queue via `fetchPendingCorrectionSuggestions`. `staff/entities/actions.ts` is a separate metadata-edit path (not suggestion apply). Equivalent safe path already exists — Session B must not duplicate as `apply_directory_correction` unless extending (e.g. suggester notify). Suggester notify absent from RPCs (see `suggester_identity_supported`). |
| rls_correct | **true** — quoted from 112: `suggester_reads_own` FOR SELECT TO authenticated USING (`suggested_by = auth.uid()`); `staff_reads_all_suggestions` FOR SELECT TO authenticated USING (`(SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('staff', 'super_admin')`). (Also present: `verified_owner_suggests` INSERT — owner-of-linked-profile only; out of the staff/own-suggester read check.) |
| notification_render | `CategoryIcon` maps `claim.approved`/`claim.rejected` → Building2, `claim.needs_more_info` → FileQuestion (fallback Bell). `NotificationRow` picks `title_ar`/`body_ar` vs `title_en`/`body_en` by locale; links `action_url` when present. `notify_claim_decision` (108) bilingual copy for all three decisions; **`p_action_url := '/settings'`** with labels View settings / عرض الإعدادات (not Spec 03 outcome surfaces). App `notifyVerificationDecision`: inserts `email_outbox` (`template`=category, payload `claim_id`) + invokes `send-claim-approval`/`send-claim-rejection` (`body.claimId`). |
| notification_duplicates | **Parallel channels only (both stay):** in-app via RPC `notify_claim_decision` → `dispatch_notification` (idempotency `verification.decision:<id>:<decision>`); email via app `notifyVerificationDecision`. **No PROVEN same-channel duplicate** this session: single in-app insert path; `email_outbox` claim.* rows are not mapped by `process-email-outbox` to claim edge functions (non-expiry → `send-rejection-email`); `dispatch_notification` `pg_notify('email_queue')` + live `send-claim-*` invoke are potential second-email paths but delivery duplication not runtime-proven here. Observation: `send-claim-approval` still SELECTs legacy `claim_requests` (may fail for `verification_requests` ids). |
| suggester_identity_supported | **yes** — schema column `suggested_by uuid NOT NULL REFERENCES auth.users (id)`; Session 06-B wires `dispatch_notification` to that recipient on approve/reject |
| Session A local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (280 passed / 61 skipped); corepack pnpm build PASS |
| Session A validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30568821680 (SHA 19cb011) |
| Session A target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30571201036 (SHA 19cb011 on agent/nonprod-signup-form) |
| Session A Vercel | PASS — Vercel - jid-dev + jid-platform success; Preview Comments success |
| Session A implementation SHA | 19cb0112b05752530da3a8dcd9fd89c5958869bc |
| Session A promoted SHA | 19cb0112b05752530da3a8dcd9fd89c5958869bc |

### Session 06-A findings detail (evidence)

1. **apply_path = complete** — approve → Directory field apply → audit exists end-to-end (RPC + staff action + review UI + pending queue). Reject path marks suggestion + audit, no Directory write. Missing for later sessions (not apply/audit): suggester notification dispatch.
2. **rls_correct = true** — staff read-all + own-suggester read policies match Spec §13 expectation.
3. **notification_render** — claim.* icons + AR/EN title/body rendering real; action URL still generic `/settings`; email path preserved alongside in-app.
4. **suggester_identity_supported = yes** — `suggested_by` is a notifiable auth user id; notification not wired yet.

---

## Specification 05 — University End-to-End Journey

| Field | Value |
|---|---|
| specification | 05 |
| status | SHIPPED |
| session | 05-D COMPLETE (Session C SKIPPED — rls_gap=false) |
| Session A base SHA | 68c656d7d01578a1eafb98a2f82d6819d3c63500 |
| Session A source branch | cursor/jid-05a-chain-reconciliation |
| Spec 04 gate | SHIPPED; promoted SHA `68c656d7d01578a1eafb98a2f82d6819d3c63500` equals resolved tip of `origin/agent/nonprod-signup-fix` and is an ancestor of that tip |
| intervening_commits | none — tip equals Spec 04 final promoted SHA |
| intervening_scope_touch | none — no commits after Spec 04 tip; university / company-dashboard / university-dashboard / owned-profile paths unchanged since Spec 04 ship |
| Session A defect inventory | DEF-01…DEF-07 (+ observations OBS-01…OBS-03; claimed_by journey-route count = 0) |
| Session A claimed_by journey routes | **zero** matches under `src/app/[locale]/(university)/**` and `src/app/[locale]/(company)/company/dashboard/page.tsx` |
| Session A PSW-001 university parity | **SHIPPED** (not business-only) — see finding below |
| Session A local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (254 passed / 61 skipped); corepack pnpm build PASS |
| Session A validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30459342420 (SHA 424591f) |
| Session A target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30459900689 (SHA 424591f on agent/nonprod-signup-fix) |
| Session A Vercel | PASS — Vercel Preview Comments success (check-run 90603557103); Vercel - jid-dev + jid-platform success |
| Session A implementation SHA | 424591fdd0669ac6e507177fb7ebac7e53d2e538 |
| Session A promoted SHA | 424591fdd0669ac6e507177fb7ebac7e53d2e538 |
| Session B base SHA | 424591fdd0669ac6e507177fb7ebac7e53d2e538 |
| Session B source branch | cursor/jid-05b-university-routing-and-dashboard-honesty |
| Session B defects fixed | DEF-01…DEF-07 (all Session A named defects) |
| Session B files | owner-university-profile.ts (+Row); university-create-profile-gate.ts; university/create-profile/page.tsx; university/pending-review/page.tsx; university-dashboard.tsx; empty-university-state.tsx; university-layout.tsx; company/dashboard/page.tsx (claimed_by absence retained); messages en/ar; tests/unit/entity/university-journey-chain.test.ts; university-dashboard-honesty.test.tsx |
| Session B rls_gap | **false** — `110_profile_ownership_policies.sql`: owner read-own (`owner_user_id = auth.uid()`, no status filter); public published-only SELECT retained; draft/suspended not exposed to anon/non-owner. Query scopes `owner_user_id` server-side. No migration in Session B. |
| Session B observations unfixed | OBS-01 no `/university/profile` view page; OBS-02 layout omits profile edit nav (i18n only); OBS-03 snapshot via `university_dashboard_view` (pipeline Spec 08); KpiCard footer still hardcoded Arabic (pre-existing; not in Session A inventory) |
| Session B local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm test PASS (280 passed / 61 skipped); corepack pnpm build PASS |
| Session B validation CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30476431171 (SHA ba9127e on codex/jid-05b-ci-validation) |
| Session B target CI | PASS — Quality Gate https://github.com/saadalamrani/JID/actions/runs/30479086091 (SHA ba9127e on agent/nonprod-signup-fix) |
| Session B Vercel | PASS — Vercel Preview Comments success (check-run 90669387669) |
| Session B implementation SHA | ba9127e8de29a76bd6e119411810767460ed69f5 |
| Session B promoted SHA | ba9127e8de29a76bd6e119411810767460ed69f5 |
| Session C | **SKIPPED** — mechanical gate: Session B `rls_gap=false`; zero edits/commits; carried-forward SHA `ba9127e8de29a76bd6e119411810767460ed69f5` |
| Session C migration | none |
| Session D base SHA | ba9127e8de29a76bd6e119411810767460ed69f5 |
| Session D source branch | cursor/jid-05d-closeout |
| Session D regression | PASS — full local suite at Session B tip + closeout commit (evidence + ledger + capture script); no product regressions found |
| Session D repair | No regressions found. |
| Session D claimed_by grep | **zero** matches across university journey route/query paths listed below |
| Session D evidence set | `docs/command-center/reports/ui-evidence/spec-05/` — real Playwright Chromium PNG captures + INDEX.md (AR/EN full chain; rejected/reapply; AR 375px primary + mobile rejected set; both dashboard snapshot states) |
| Session D route map | see table below |
| Session D preserved contracts | PASS — Spec 02 decision RPCs untouched; Spec 03 rejected/reapply university routes retained; `verification_requests` / `create_university_profile` unchanged; migrations unchanged (Session C skipped); `viewer_approved_*` / `claim_requests` residue remains deferred (local-only compat view used for smoke, not committed); Catalog / Lammah untouched |
| Session D disposable fixtures | local project `jid-05d-disposable` ports 58321–58324; seed + ephemeral university fixtures; local-only `claimed_by`+`university_short_code=KSU` for populated snapshot smoke; destroyed after evidence |
| Session D local validation | git diff --check PASS; corepack pnpm install --frozen-lockfile PASS; corepack pnpm lint PASS; corepack pnpm type-check PASS; corepack pnpm exec vitest run --testTimeout=30000 PASS (280 passed / 61 skipped; default 5s timeout flakes on Temp filesystem scan tests); corepack pnpm build PASS |
| Session D validation CI | PENDING (reported in completion response) |
| Session D target CI | PENDING (reported in completion response) |
| Session D Vercel | PENDING (reported in completion response) |
| Session D implementation SHA | PENDING (reported in completion response — do not self-embed) |
| Session D promoted SHA | PENDING (reported in completion response after FF promotion) |

### Session 05-A verified starting-state (evidenced at tip `68c656d7`)

| Check | Result | Evidence |
|---|---|---|
| `EntitySignupWizard entityType="university"` reachable | verified present | `src/app/[locale]/(auth)/signup/university/page.tsx` returns `<EntitySignupWizard entityType="university" />`; wizard maps university → `/university/pending-review` |
| `/university/pending-review` | verified present | `…/(university)/university/pending-review/page.tsx` |
| `/university/rejected` | verified present | `…/university/rejected/page.tsx` |
| Spec 03 university reapply + rejected link | verified present | `…/university/reapply/page.tsx` (ClaimSubmissionForm `claimType="university"`); rejected CTA `href="/university/reapply"` when `canReapplyNow` |
| `/university/create-profile` + `create_university_profile` | verified present | create-profile page + wizard; `createUniversityProfile` → `client.rpc('create_university_profile', …)` in `src/lib/auth/verification.ts` |
| `(university)/…/dashboard/page.tsx` renders `UniversityDashboard` | **partially stale vs Spec §5 wording** | Page does **not** render `UniversityDashboard` unconditionally: redirects if no owned profile; draft → `OrganizationDraftDashboard`; else `<UniversityDashboard />`. Owner query is `fetchOwnerUniversityProfile` (already exists). |
| `(company)/company/dashboard` university via `companies.claimed_by` | **STALE ASSUMPTION — not true at tip** | Current file uses only `fetchOwnerBusinessProfile` → draft/CompanyDashboard. **No** `claimed_by` read; **no** university branch. Removed earlier (PSW-001 `1e75528`). |
| `UniversityDashboard` + snapshot + `EmptyUniversityState` | present with honesty defects | Component reads `useUniversityDashboard` → `university_dashboard_view`; `EmptyUniversityState` is a real alternate path but only when `snapshot.total_students === 0`; absent/error path shows Arabic error copy instead of empty state (DEF-04/05/06) |
| `/university/profile-suspended` | verified present | `…/university/profile-suspended/page.tsx` |
| PSW-001 university draft management parity | **SHIPPED (both actors)** | Report `docs/command-center/reports/PSW-001_ORGANIZATION_DRAFT_PROFILE_MANAGEMENT_REPORT.md` lists `/university/dashboard`, `/university/profile/edit`, `/university/profile/preview`; code: `university-profile-management.tsx`, `university-profile-view.tsx`, `updateOwnerUniversityProfile` / Action, tests 2/4 in `organization-draft-management.test.tsx` |

### Session 05-A transition inventory

| Transition | Result |
|---|---|
| Signup → submit → pending-review | verified correct |
| Rejected → Spec 03 `/university/reapply` loop | verified correct |
| Approved → create-profile (happy path) | verified correct (fallback / non-approved paths DEF-02) |
| Create-profile → draft via `create_university_profile` RPC | verified correct |
| Wizard re-entry with owned Profile / orphaned `resulting_profile_id` | DEF-01 / DEF-02 |
| Pending-review Spec §8 with owned/suspended Profile | DEF-03 |
| Draft → owner edit/save/reload (`/university/profile/edit`) | verified correct (PSW-001) |
| Owner preview (`/university/profile/preview`) | verified correct |
| Public draft invisibility (catalog published-only embed) | verified correct (`resolvePublishedProfile` requires `status === 'published'`) |
| Directory reference + correction entry on edit | verified correct |
| Dashboard owned-Profile routing (`fetchOwnerUniversityProfile`) | verified correct on `(university)` dashboard; company dashboard has no university/`claimed_by` branch |
| Snapshot present → real KPIs + PDF | verified correct when snapshot row exists and `total_students !== 0` |
| Snapshot absent → `EmptyUniversityState`, no export, no zeros | DEF-04 |
| Snapshot present with `total_students === 0` | DEF-04 (treated as empty; Spec §7 expects real KPIs when snapshot present) |
| Empty-state CTA target | DEF-05 (`/company/profile`) |
| Dashboard / empty / layout AR+EN parity | DEF-06 (hardcoded Arabic) |
| Suspended override on org_profile routes | verified correct via `checkOrganizationProfile` + guards |
| Suspended on create-profile / pending-review pages | DEF-03 (+ missing Row helper DEF-07) |
| Non-owner denial on owner surfaces | verified correct (owner_user_id server fetch → redirect/notFound; no draft to visitors) |
| Journey route `claimed_by` references | verified none (0) |

### Session 05-A defects for Session B

1. **DEF-01** — `university/create-profile/page.tsx` redirects to `/university/dashboard` when `verification.resulting_profile_id` is set, without requiring an owned `university_profiles` row. Expected: mirror Spec 04-B — owned Profile (incl. status) drives redirect; orphaned `resulting_profile_id` stays on wizard (honest recovery).
2. **DEF-02** — University create-profile lacks a Spec §8 / gate helper equivalent to `resolveBusinessCreateProfileGate` (uses `getMyApprovedVerifications` length-only + `resulting_profile_id` shortcut). Expected: profile-first gate; non-approved / empty verification paths resolve via `resolveVerificationOutcome` for university.
3. **DEF-03** — `university/pending-review/page.tsx` always passes `profile: null` into `resolveVerificationOutcome` (Business DEF-08 mirror). Expected: load owned university profile row (incl. suspended) before outcome resolution so owned/suspended users leave pending correctly.
4. **DEF-04** — `university-dashboard.tsx` honesty wiring: `(query.isError \|\| !snapshot)` → error copy; `EmptyUniversityState` only if `snapshot.total_students === 0`. Expected: snapshot absent → `EmptyUniversityState` (no KPI cards, no export, no zero-filled cards); snapshot present → real values (including legitimate zeros) + export; query error → distinct honest error.
5. **DEF-05** — `empty-university-state.tsx` default `ctaHref = '/company/profile'` (wrong actor). Expected: university owner surface (e.g. `/university/profile/edit`) within existing routes — wiring only.
6. **DEF-06** — `UniversityDashboard`, `EmptyUniversityState`, and `university-layout.tsx` use hardcoded Arabic strings (no `next-intl`). Expected: full AR/EN parity on namespaces touched by Spec 05 dashboard/empty/layout wiring; Latin digits in Arabic.
7. **DEF-07** — No `fetchOwnerUniversityProfileRow` (status-aware, includes suspended) mirroring `fetchOwnerBusinessProfileRow`. `fetchOwnerUniversityProfile` already exists and excludes suspended. Expected: add/extend Row helper for DEF-01/DEF-03 gates (query wiring only; no schema/RPC).

### claimed_by reference list (Session A)

**Inside Spec 05 journey route files:** none.

**Outside journey (not Session B unless proven to gate this chain):**
- `src/app/[locale]/(sys)/sys/entities/actions.ts` — staff Directory claim writes
- `src/lib/onboarding/entity-queries.ts` / `entity-actions.ts` — legacy onboarding `companies.claimed_by`
- `src/lib/jobs/company-access.ts` — transitional P-104 path
- `src/lib/applications/triage-access.ts`
- `src/lib/hooks/use-current-entity.ts`
- Types / generated Supabase types / sys+staff entity list selects

**Spec §5 defect statement status:** the `(company)/company/dashboard` university `claimed_by` branch is **already absent** at Spec 04 tip. Session B must not reintroduce it; residual work is university create-profile/pending-review mirrors + dashboard honesty/i18n wiring, not resurrecting a removed branch.

### PSW-001 university-parity finding

**Conclusion: PSW-001 shipped university-side draft management equivalent to business (not business-only).**

Proof files:
- `docs/command-center/reports/PSW-001_ORGANIZATION_DRAFT_PROFILE_MANAGEMENT_REPORT.md` (routes table includes university edit/preview/dashboard)
- `src/components/organization-profile/university-profile-management.tsx`
- `src/components/organization-profile/university-profile-view.tsx`
- `src/app/[locale]/(university)/university/profile/edit/page.tsx`
- `src/app/[locale]/(university)/university/profile/preview/page.tsx`
- `src/lib/profile/organization-profile-update.ts` (`updateOwnerUniversityProfile`)
- `src/lib/profile/organization-draft-management.test.tsx` (university cases)
- `src/lib/profile/owner-university-profile.ts` (`fetchOwnerUniversityProfile`)

**Observation (not a Spec 05 build-new-UI ticket):** no `/university/profile` owner view page exists (business has `/company/profile`). Edit + preview + draft dashboard cover management; absence is recorded only — do not invent new management UI in Spec 05.

### Observations (future specs / out of Spec 05 product scope)

- **OBS-01** — No dedicated `/university/profile` view route (business-only surface parity gap for a view page). Deferred; wiring-only Spec 05 must not invent it.
- **OBS-02** — `UniversityLayout` nav omits profile edit/preview links (owners reach them via draft dashboard). Optional nav wiring only if Session B touches layout for DEF-06.
- **OBS-03** — Snapshot source is `university_dashboard_view` (not a raw `university_dashboard` table select). Pipeline/generation remains Spec 08 / deferred; honesty wiring only here.

### Session 05-A scope reminder for Session B

- Fix DEF-01…DEF-07 only (wiring/routing/honesty/i18n on existing surfaces).
- Do **not** build new university draft-management UI; do **not** change snapshot pipeline, RPCs, schema, or `companies` columns.
- Do **not** add invented KPIs; publication = Spec 07; deeper metrics = Spec 08.

### Session 05-B defects fixed (cross-ref Session A)

1. **DEF-01** — FIXED: create-profile uses owned Profile row via gate; orphaned `resulting_profile_id` stays on wizard.
2. **DEF-02** — FIXED: `resolveUniversityCreateProfileGate` + Spec §8 outcome paths.
3. **DEF-03** — FIXED: pending-review loads `fetchOwnerUniversityProfileRow` into `resolveVerificationOutcome`.
4. **DEF-04** — FIXED: absent snapshot → `EmptyUniversityState`; present (incl. zeros) → real KPIs + export; error → distinct error.
5. **DEF-05** — FIXED: empty CTA → `/university/profile/edit`.
6. **DEF-06** — FIXED: `university.dashboard` / `university.nav` / empty copy in EN+AR via next-intl.
7. **DEF-07** — FIXED: `fetchOwnerUniversityProfileRow` added (mirrors business Row helper).

### Session 05-B scope note

- `fetchOwnerUniversityProfile` already existed at Session A tip; Session B aligned it with the business pattern (+Row), retained owned-profile routing on `(university)/dashboard`, and documented company dashboard `claimed_by` absence (already removed pre-Session A).
- `rls_gap: false` — no Session C migration required unless later disposable proof contradicts policy text.

### Session 05-C mechanical skip

- Gate: Session B ledger `rls_gap | **false**`.
- Action: zero edits, zero commits, no migration, no promotion.
- Carried-forward SHA: `ba9127e8de29a76bd6e119411810767460ed69f5`.

### Session 05-D claimed_by grep proof (journey route + query paths)

**ZERO** matches for `claimed_by` in:
- `src/app/[locale]/(university)/**`
- `src/app/[locale]/(company)/company/dashboard/**`
- `src/app/[locale]/(company)/_components/university-dashboard.tsx`
- `src/app/[locale]/(company)/_components/empty-university-state.tsx`
- `src/app/[locale]/(company)/_components/university-layout.tsx`
- `src/lib/queries/university-dashboard.ts`
- `src/lib/profile/owner-university-profile.ts`
- `src/lib/entity/university-create-profile-gate.ts`
- `src/lib/entity/verification-outcome.ts`
- `src/lib/entity/rejected-claim.ts`
- `src/lib/entity/claims.ts`
- `src/middleware.ts`

**Deferred observation (not journey TS):** SQL view `university_dashboard_view` still joins via `companies.claimed_by` + `university_short_code` (migration `023_university_rls_policies.sql`). Snapshot pipeline / view ownership remapping remains Spec 08 / deferred. Local-only smoke set `claimed_by` on the seed university Directory row to exercise the populated KPI path; that fixture was not committed.

### Specification 05 route map (Session D)

| Route | Guard (`guards.ts` / page) | Destination logic |
|---|---|---|
| `/signup/university` | public auth signup | `EntitySignupWizard entityType="university"` → pending-review after submit |
| `/university/pending-review` | `university-pending-review` roles entity/university_admin | Loads owned profile row + latest verification → `resolveVerificationOutcome`; redirects when approved/owned/suspended |
| `/university/rejected` | `university-rejected-page` | Latest rejected verification + reapply CTA → `/university/reapply` when eligible |
| `/university/reapply` | `university-reapply` | Spec 03 `ClaimSubmissionForm claimType="university"` |
| `/university/create-profile` | `university-create-profile` | `resolveUniversityCreateProfileGate` + owned Profile row; orphaned `resulting_profile_id` stays on wizard |
| `/university/dashboard` | `university-portal` + org profile type university | No owned profile → create-profile; draft → `OrganizationDraftDashboard`; else `UniversityDashboard` (honest empty/present/error) |
| `/university/profile/edit` | `university-profile-owner` | PSW-001 owner edit/save (Session A shipped) |
| `/university/profile/preview` | `university-profile-owner` | PSW-001 visitor preview |
| `/university/profile-suspended` | `university-profile-suspended` | Suspended owner notice |
| `/company/dashboard` | company portal | Business owned-profile only — **no** university/`claimed_by` branch |
| `/catalog` | public | Directory reference (published profiles) |

### Still deferred after Specification 05

- Snapshot generation pipeline / remapping `university_dashboard_view` off `companies.claimed_by`
- Deeper institutional analytics
- Publication (Specification 07)
- Visual redesign (Specification 08)
- New university draft-management UI beyond PSW-001 shipped surfaces
- Dedicated `/university/profile` view page (OBS-01)
- Permanent migration repair for `viewer_approved_*` / `claim_requests` residue
- Catalog automated ingestion and Lammah external opportunity ingestion (never in Spec 05)

---

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
