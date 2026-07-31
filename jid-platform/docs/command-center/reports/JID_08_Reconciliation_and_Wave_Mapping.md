# JID_08 — Reconciliation and Wave Mapping (Session 08-A)

**Status:** COMPLETE (findings only — no product code, no database changes)
**Canonical starting SHA:** `4214040ad2f058af88280a9a7cee7767ef9d89fa`
**Source branch:** `cursor/jid-08a-reconciliation`
**Reference inputs:** JID_01 Current State and Architecture Baseline (locked); JID_08 Dashboards and UI Implementation Spec v2 (Reviewed)
**Date:** 2026-08-01

---

## 0. Gate summary

| Check | Result |
|---|---|
| Both required attachments readable | PASS |
| `origin/agent/nonprod-signup-fix` | `4214040ad2f058af88280a9a7cee7767ef9d89fa` (exact expected) |
| Intervening commits after expected SHA | none |
| `origin/agent/nonprod-signup-form` | `b29846b644ab2d94ec1d88b3a0954f2f30276452` (separate; not updated) |
| Specs 02–07 SHIPPED | PASS (02 via Spec 03 gate tip `ed5bc40`; 03–07 dedicated sections) |
| Spec 07-E COMPLETE + evidence index + contract proof | PASS |
| Spec 08 / 09 SHIPPED claim | absent (PASS) |
| Predecessor SHAs ancestors of tip | PASS |
| Commits after Spec 07-E start (`b77fca0`) | `ee2afeb`, `4214040` — documentation/evidence only; do not invalidate Spec 08 assumptions |

---

## 1. Dashboard-metric reality (Business)

### 1.1 Placeholder finding

`company-dashboard.tsx` line 87 renders `t('placeholderMetrics')` honesty copy. **No numeric KPI cards** are rendered on `/company/dashboard` when a non-draft owned Profile exists. The page does not call `fetchOwnerJobs`, applicant aggregates, or any metric query.

### 1.2 Per-metric classification

Classification key: **A** = `real_query_exists`; **B** = `read_only_owner_count_needed`; **C** = `no_authorized_real_data`.

| Visible metric | Component | Current source | Query/helper | Owner scoping | Table/view | Auth boundary | Class | Real 0 possible? | Missing ≠ 0? | Session 08-B action |
|---|---|---|---|---|---|---|---|---|---|---|
| Metrics placeholder copy | `CompanyDashboard` | i18n `company.dashboard.placeholderMetrics` | none | n/a | n/a | auth + owned profile page gate | **C** (no value) | n/a | must stay non-numeric honesty | Replace only when real cards ship; never coerce to `0` |
| Profile status pill | `CompanyDashboard` | `profile.status` | `fetchOwnerBusinessProfile` | `owner_user_id` | `business_profiles` | session + RLS | **A** (status, not engagement KPI) | n/a | n/a | Keep as status chrome |
| Jobs posted count (planned / Spec 08) | not rendered | — | candidate `fetchOwnerJobs` (`src/lib/queries/jobs.ts`) | jobs RLS / owner-visible | `jobs` | existing job owner policies | **B** | yes | yes | Add read-only owner-scoped count; no RLS/migration |
| Applications received count (planned) | not rendered | — | triage/`applicant_count` paths exist; triage still resolves company via `companies.claimed_by` in access helper | mixed | `applications` / jobs | triage auth caveat | **B** with auth caveat | yes | yes | Wire only after ownership re-anchor off `claimed_by` **or** show honest unavailable if blocked without RLS change |
| Decorative % / charts / vanity | none on Business dashboard | — | — | — | — | — | n/a | — | — | Do not invent |

**Nearby hazard (not on this dashboard):** `fetchCompanyPageContext` hardcodes `activeJobsCount: 0` as a Job Board placeholder (`src/lib/profile/queries.ts`). Do not import that into Session 08-B.

---

## 2. University dashboard reality

| Topic | Finding |
|---|---|
| Route | `/university/dashboard` → draft `OrganizationDraftDashboard` or client `UniversityDashboard` |
| Snapshot load | `useUniversityDashboard` → `fetchUniversityDashboardSnapshot` → `university_dashboard_view` |
| Present vs absent | first row or `null`; `!snapshot` → `EmptyUniversityState` |
| Zero vs absent | Legitimate snapshot zeros render KPIs + export; absent shows empty (no KPI zeros) |
| Export | Hidden unless snapshot present; `handleExport` early-returns without snapshot |
| Placeholders / fabricated metrics | None client-invented; values pass through snapshot |
| AR/EN | Dashboard/empty/nav next-intl present; residual hardcoded Arabic on `KpiCard` footer + some bar empty/label maps |
| Protecting tests | `tests/unit/entity/university-dashboard-honesty.test.tsx`; journey-chain DEF-05/06 |

### Snapshot-present metrics (all **A** when view returns a row)

Total students; profile completion %; CV creation %; job applications; mentorship sessions; status breakdown bars; college distribution bars; `refreshed_at`.

Shared caveat: view ownership still uses `companies.claimed_by` (below) → modern `university_profiles` owners often get empty → EmptyUniversityState even if MV has rows.

### `university_dashboard_view` × `claimed_by` (deferred — database object)

**Still references `companies.claimed_by`** in migration `023_university_rls_policies.sql` (view definition). No later migration remaps it. App TS query does not mention `claimed_by`.

**Spec 08 must not modify the view, migration, schema, RLS, or any database object.** Session 08-B preserves absent≠zero honesty and does not invent metrics. Remapping remains deferred outside Spec 08 product waves (ledger already notes residue).

---

## 3. Visual-drift inventory (summary by wave)

Brand targets: olive `#2F3A2E`, gold `#E6B43A`, off-white `#F7F5EF`, secondary `#414D40` via semantic tokens; no gradients; no heavy shadows; one overdue red; logical RTL; no Arabic letter-spacing; focus-visible; honest states; 375px.

Cross-cutting: `shadow-sm` ubiquitous; cover gradients on profile views; multi-hue status/urgency colors; secondary `#414D40` not in `design-tokens.ts` (closest `line.700`); Arabic letter-spacing absent in wave files (good).

### W-Lifecycle → Session D (visual)

- `PendingReviewView` / `SlaProgressBar`: raw Tailwind red + `shadow-sm` vs single semantic overdue.
- Business/University rejected pages: duplicate markup; red card chrome; shadow.
- Reapply pages: sparse shell; university cooldown date forced `en-US`.
- Create-profile / `ProfileWizardShell`: shadow; white-on-primary CTA text vs beige-on-olive.

Behavior contracts (pending/rejected/reapply/create-profile notices) unchanged.

### W-ProfileMgmt → Session D

- `BusinessProfileView` / `UniversityProfileView` / `PublicUniversityProfileView`: gradient covers, raw `jid-*`, shadow — high fork risk across three heroes.
- `OrganizationProfileShell`: hardcoded English eyebrows `"Business"` / `"University"`.
- `OrganizationDraftDashboard`: mostly flat/honest.
- Suspended: `ShellForbidden` + shadow.
- `ProfileStateBadge`: multi-color + emoji vs olive/gold + one red.

### W-Staff → Session C

- `VerificationCard` urgency: red/orange/amber/gray + blue/purple type badges.
- `VerificationKanban`: lg 3-col only — must stack at 375px.
- `ChecklistPanel` / `VerificationDecisionForm`: focus-visible gaps; checklist client-only.
- `RelatedHistoryPanel`: uppercase chips; locale-blind `ar-SA` dates.

### W-Dashboards → Session B (honesty) + D (visual)

- Business: placeholder honesty; emerald/amber pills; hover shadow.
- University: raw error red; AR header dates coerced to `en-US`; PDF always `en-US`; `KpiCard` AR-only footer; `EmptyUniversityState` mild shadow.

### W-Publication → Session D

- `DraftPublicationBoundary`: suspended full red panel.
- Public profiles: same gradient/shadow forks as profile views.
- `CatalogCta`: mostly on-brand; strengthen focus-visible.
- Public not-found: branded global 404 (acceptable).

Detailed row inventory retained for Sessions B–D implementation prompts; behavior/routes/authorization frozen.

---

## 4. Wave 2A mapping table

**Pack files under `docs/`:** Design Spec / Component Inventory / State Matrix / HTML prototype — **not committed**.

**Label:** preliminary — complete against committed Wave 2A pack files in Session 08-C

| Design-pack name | Real path | Route | Behavior contract | Restyle boundary | States to keep | Mobile | a11y | AR/EN | Spec 02 tests | Reuse |
|---|---|---|---|---|---|---|---|---|---|---|
| VerificationCard | `staff/verification/_components/verification-card.tsx` | `/staff/verification*` | urgency, assignment, review href | classes + date locale | overdue/critical/warning/normal; assigned/unassigned | stack | focus-visible | `staff.claims.card` | `verification-decision-ui.test.tsx` | must reuse |
| Kanban | `verification-kanban.tsx` | `/staff/verification` | pending/overdue/completedToday | column chrome | empty columns | stack at 375 | headings | `staff.verification.kanban` | page composition | must reuse; never radar kanban |
| ChecklistPanel | `(staff)/_components/checklist-panel.tsx` | `/staff/verification/[id]` (+ mentor) | all items for approve; view-only disable | visual only; still client state | progress; checked | aside stacks | progressbar + focus-visible | workspace.checklist | structural | shared; no fork |
| DecisionForm | `[id]/_components/verification-decision-form.tsx` | review | approve/reject only; reason; docs; self-block; SA override | visual + focus-visible | locked/submitting/checklist gate | full width | override testids | workspace.decision | decision-ui / action / structural / assignment | must reuse |
| RelatedHistoryPanel | `related-history-panel.tsx` | review | related query | visual + locale dates | empty/list | OK | link focus | relatedHistory | structural | must reuse |

### Unsupported capabilities (honest)

| Capability | backend_present | Authorization | Honest UI today | Deferred owner | Why not “working” |
|---|---|---|---|---|---|
| Evidence viewer | no (queue omits evidence/PII; no viewer pane) | staff shell | absent control | later / ledger deferred | no storage/view/download |
| Request-more-information | partial enum/notify only; no staff decision option | staff | applicant awaiting copy when status is `needs_more_info` | deferred | no staff affordance / RPC path in form |
| Persisted checklist | no (`useState` only) | staff | in-session gate only; resets on reload | deferred | no durable store |

---

## 5. Bounded arSA / date-locale list (five waves only)

Preferred pattern: `useLocale()` → Arabic `arSA` / `ar-SA`; English `enUS` / `en-US`.

| Path | Site | Current | Affected | Fix session |
|---|---|---|---|---|
| `verification-card.tsx` | `formatDistance` + `arSA` | always AR relative | EN staff | C |
| `verification-review-workspace.tsx` | same | always AR | EN | C |
| `related-history-panel.tsx` | `toLocaleString('ar-SA')` | always AR | EN | C |
| `university/reapply/page.tsx` | cooldown `en-US` | always EN | AR | D |
| `university-dashboard.tsx` header | AR forced to `en-US` | inverted | AR | B/D |
| `university-dashboard.tsx` PDF | always `en-US` | EN PDF | AR | B/D |

Out of wave scope (not fixed in Spec 08 sweeps): moderation/mentor `arSA` cards; notification-row.

Reference-correct pattern already on Business/University rejected pages.

---

## 6. Component-reuse and fork-risk inventory

| Existing | Routes | Wave | Fork risk | Reuse strategy | Tests |
|---|---|---|---|---|---|
| `VerificationCard` / Kanban / Checklist / Decision / RelatedHistory | `/staff/verification*` | W-Staff | High vs radar/mentor copies | Restyle in place | Spec 02 decision/assignment suites |
| `OrganizationProfileShell` + `OrganizationDraftDashboard` + `DraftPublicationBoundary` | company/university profile + dashboards | Profile/Pub | Medium | One shell; i18n eyebrows | publication-ui*, journey |
| `BusinessProfileView` vs `UniversityProfileView` vs `PublicUniversityProfileView` | preview/public | Profile/Pub | **High** | Shared flat hero shell | publication privacy / journeys |
| `EmptyUniversityState` vs `HonestEmptyState` | uni dash / draft | Dashboards | Medium | Prefer honest empty archetype | university-dashboard-honesty |
| Rejected page duplicates (B/U) | rejected routes | Lifecycle | Medium | Shared rejected view | Spec 03 outcome UI |

---

## 7. Behavior-test baseline

Recorded in ledger after suite execution (Session 08-A documentation commit). Suite run unchanged; no product repair; no test weakening.

---

## 8. Session boundaries (forward)

| Session | Scope |
|---|---|
| **08-B** | Business dashboard honesty (wire **B**-class counts or keep honesty; never coerce missing→0); university regression (preserve absent≠zero; no DB view edit) |
| **08-C** | W-Staff Wave 2A (pack files required attachments); complete mapping; restyle real components only |
| **08-D** | W-Lifecycle + W-ProfileMgmt + W-Publication visual pass |
| **08-E** | Closeout evidence + promotion |

**Forbidden in all Spec 08 sessions:** migrations; RLS/RPC/view edits; fabricated metrics; Claim/مطالبة copy; Directory↔Profile merge; Verification auto-create/publish implications.
