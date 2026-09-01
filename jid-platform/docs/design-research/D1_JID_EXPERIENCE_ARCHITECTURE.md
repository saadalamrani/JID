# D1 — JID Experience Architecture

**Phase:** D1 (Experience Architecture + Design Direction + reference implementation).
**Status:** `DESIGN_AUTHORITY_WRITTEN` — not design-approved, not founder-accepted.
**Checkpoint 1 scope:** this document + `D1_JID_DESIGN_LANGUAGE.md` +
`D1_REFERENCE_EXPERIENCES.md` complete; **only R1 (Public Front Door) and R2
(Individual Home) implemented** in product code. R3–R7 are specified here, not built.
**Design input authority:** `R1C_JID_EXPERIENCE_CONTENT_THESIS.md` +
`R1C_D1_DESIGN_INPUT.md` at `75500a5`; `R1B_JID_SAUDI_PRODUCT_LANGUAGE_SYSTEM.md` at
`4ae7dd8`. Org-onboarding product truth: `2d234d5` / closeout `60cdb54`.
**Product-code base:** `origin/integration/org-registration-representative-verification`
(contains `2d234d5`), branch `integration/jid-d1-experience-design-direction`.
**Current UI design authority:** ZERO. Inspected only for functionality, states, data,
actions, permissions, contracts, edge cases.

---

## 0. WHAT CHANGES, IN ONE PARAGRAPH

Today JID is organized around database entities and shipped workstreams: the public
homepage is a hero + an 8-tile module grid + a Vision-2030 marketing section + a
generic pre-footer CTA slab; the Individual "home" is `/me → /profile →
/profile/{id}`, i.e. **the person's own public profile projection stands in for a
workspace that does not exist**. D1 replaces both. The homepage becomes a statement of
what JID *is* — one governed record of professional truth, seen from three vantage
points — communicated through the structure of the page, not through feature cards.
The Individual gets a real home: a personal workspace anchored to the Career Record
that answers *where do I stand / what needs my attention / what changed / what can I
do*, with opportunities, applications, readiness and evidence shown as one system
rather than separate modules.

---

## 1. GOVERNING DECISIONS (apply to every actor)

| # | Decision | Source |
|---|---|---|
| A1 | **The home is a workspace, not a dashboard.** Every actor home leads with attention items, recent changes, and one clear next action. Actor-specific model — never a shared widget-grid template. | R1-C P16 / P5 |
| A2 | **One spine, many views.** The Career Record (Individual), the Workspace/Role (Employer), the Program/Cohort (University) are the persistent centers. CV, Timeline, Profile projection, reports, comparisons are *views onto* those centers, never peers in navigation. | R1-C P1 / Article 3 |
| A3 | **Navigation is thin and job-shaped.** 3–5 persistent destinations per actor, each a *job* not a *feature*. Everything else is object-level, contextual, search, or background. | R1-C P7 / D1-Input K |
| A4 | **Contextual over persistent.** Assessments, CV renderings, methodology, AI rationale, verification status, paid-tier boundaries appear where their object is — not in nav. | R1-C P6 / P15 |
| A5 | **Arabic-first composition.** Reading order, action placement, alignment, data placement are designed in RTL first; LTR is validated after. `lang`/`dir` set server-side. | D1-Input G / brief Part 6 |
| A6 | **Density by actor, on purpose.** Public + Individual: focus/recede, generous. Employer: precise, mid-density. University: analytical density where comparison is real. Staff: dense, keyboard-capable. One design language, four operating densities. | R1-C P6 / D1-Input H |
| A7 | **No keep-them-here mechanic.** No feed, streak, like, follower, "recent activity" stream, profile-completeness %, or fabricated score/trend anywhere. | Article 3/8 / R1-C P8 |
| A8 | **Plus is contextual, not primary** (`PLUS_IS_CONTEXTUAL_NOT_PRIMARY=YES`). Never a nav item. Surfaces only at a genuine additional-value boundary; explains the capability before the tier label. | D1-Input / brief Part 4 |
| A9 | **Technical truth stays behind the experience.** `directory_id`, `reconciliation_state`, `entity`, RLS, catalog matching never surface to the three public actors; plain status and plain consequences instead. | R1-C P10 / P14 |

---

## 2. THE GLOBAL SHELL

The current shell has two parts: `SmartHeader` (brand-constant dark-olive top bar,
centered nav, palette/bell/theme/lang/profile on the end) via `PublicNav`, and
`actor-sidebar-shell` for authenticated actors. D1 keeps the **dark-olive brand bar**
(it is a genuine JID signature, not slop) and re-solves what it carries and how the
authenticated frame works.

### 2.1 Two frames, one language

| Frame | Used by | Structure |
|---|---|---|
| **Public frame** | Unauthenticated visitors; R1 | Dark-olive bar: logo · (no primary nav links — see 2.3) · language · one situational entry action. Footer below. No sidebar. |
| **Workspace frame** | Individual, Employer, University, Staff (authenticated) | Dark-olive bar: logo · **actor context** (which workspace / who you are) · global search (actor-scoped) · attention (bell) · language · profile. Plus a **left rail** (RTL: right rail) of 3–5 job destinations. Content column is single-focus, max-width by density (§ Design Language). |

The bar is identical in silhouette across both frames so JID reads as one product; what
it *carries* differs.

### 2.2 Attention, not notifications

The bell becomes an **attention surface**: a bounded, typed list of *things that need
you or changed* (application moved, verification decision, closeable readiness gap,
mentorship reply). Every item is one specific sentence + at most one action. No "you
have 3 updates." No infinite history. This is the same object that seeds the home's
"what needs my attention" and "what changed" sections — one model, two surfaces.

### 2.3 Navigation architecture per actor

Persistent nav = a job the actor does repeatedly. Not a feature list.

| Actor | Persistent destinations (3–5) | Object-level | Contextual | Search scope | Command palette |
|---|---|---|---|---|---|
| **Public** | *(none as links)* — the page **is** the explanation; the only chrome action is the situational entry ("أنشئ حسابك" / "ابدأ التحقق"). Secondary links (opportunities, about, directory, universities, mentors) live in the **footer** and inline in page sections, not the bar. | — | — | — | No |
| **Individual** | **الرئيسية** (home/workspace) · **سجلي المهني** (Career Record) · **الفرص** (Opportunities — Radar + Abhathli + Lammah unified) · **طلباتي** (Applications) · **الإرشاد** (Mentorship) *(only if the person has a mentorship relationship or is an approved mentor — otherwise 4)* | Career Record → sections; an Opportunity; an Application; a mentorship thread | Readiness detail; a CV rendering; an assessment; consent settings; Plus boundary (Lammah) | Opportunities, own record sections, mentors (governed), organizations (directory) | Optional, off by default; on for power users only (existing `shellShowsIndividualCommandPalette` gate) |
| **Employer** | **الرئيسية** (decision surface) · **الأدوار** (Roles) · **القرارات** (Hiring decisions archive) · **منشأتي** (Workspace + Profile + team) | A Role → criteria/candidates; a Candidate; a Decision | Assessment config; applicant comms; paid visibility + disclosure; verification status *(only while pending)* | Roles, candidates (own), organizations | Yes (power users) |
| **University** | **الرئيسية** (institutional overview) · **البرامج** (Programs/Cohorts) · **التقارير** (Reports) · **الجامعة** (Profile) | A Program → outcomes; a Cohort; a Report | Methodology/coverage/suppression (attached to a metric); a consented graduate record; employer-alignment view | Programs, cohorts, reports | Yes |
| **Staff** | Work queues (**المطابقة/reconciliation**, **التصحيحات/corrections**, **الإشراف/moderation**), **السجل** (audit) | A verification request; an entity; an audit entry | Reconciliation options (inside a request) | Everything internal (`entity`, requests) | Yes (keyboard-first) |

**Retired from navigation** (become views/contextual/background, per R1-C P7):
`Explore opportunities` + `Jobs` → merged into **الفرص**. `Mentorship` + `Mentors` →
one job under the Individual. `CV`, `Career Timeline`, `Profile`, `Assessments`,
`Radar`, `Abhathli`, `Lammah`, `Network` → not nav items. `Pulse`, `Vision 2030` → not
primary; Pulse is a public reference surface reachable from the footer.

### 2.4 Global search

Yes for Individual / Employer / University / Staff — **actor-scoped**, never universal.
Not for the public actor. Search is a supplement to a legible architecture, never a
replacement for one. Scope per actor as in the table above. Command palette: Staff and
Employer/University power users only; never forced on public or casual Individual
users; never the primary way to reach anything.

---

## 3. INDIVIDUAL ARCHITECTURE

**Governing question:** *"Where do I stand, and what do I do next?"*
**Primary workspace:** the Individual Home (`R2`).
**Primary object:** the Career Record (the spine).

### 3.1 How the twelve capabilities resolve

| Capability | Resolution in the architecture |
|---|---|
| **Career Record** | Primary object + a persistent destination (**سجلي المهني**). The spine. |
| **Career Timeline** | A **view** inside the Career Record (a lens on the same facts) + authored milestones. Not nav. Never a feed. |
| **Profile** | The **governed projection** — what employers/universities/public see, computed per consent. Reached from the record as "how others see me." Not a separate thing to maintain. |
| **CV** | An **output/action** of the Career Record: "create a CV from this record." Dated snapshot. Reached in context (an application, an export). Not nav. |
| **Evidence** | A **section** of the Career Record (L3), owner-private by default. External linking is **not live** — architected for, shown as "not available yet," never faked. |
| **Readiness** | A **contextual view**: an honest reading of what's present/absent against a goal or an opportunity's criteria. Never a %, score, or bar. Appears on the home (as closeable gaps) and inside an Opportunity. |
| **Radar** | The **الفرص** destination — the opportunity surface. "Radar" as a concept is the monitoring spine of that surface. |
| **Abhathli** | A **background service** + a contextual control inside الفرص ("define once what to watch for"). Not a destination, not a chatbot. |
| **Lammah** | A **contextual capability** inside الفرص: external-opportunity sourcing. The Plus boundary — capability explained before tier (A8). |
| **Applications** | The **طلباتي** destination — status tracking of submitted acts (متقدم view). Distinct from الفرص (act) vs طلباتي (track). |
| **Professional Layer** | The **substrate** under the governed projection + governed connection (mentor, university, chosen contacts). Surfaces as "who can see me / who I'm connected to," never as a feed or a people-you-may-know surface. NEEDS D1 EXPERIMENT for R3+. |
| **Mentorship** | A **relationship + mode**. The **الإرشاد** destination appears only when a relationship exists (being mentored) or the person is an approved mentor. `/mentor` + `/mentors` route group restructures under the Individual — not a fourth actor. |

### 3.2 Individual Home composition (R2 — implemented this checkpoint)

Single focus column, RTL-first. Reading order top→bottom:

1. **Standing line** — a plain-language reading of where the person stands, anchored to
   the Career Record: what the record contains, what's verified, when it was last
   updated. No score, no %, no bar. One or two sentences.
2. **What needs my attention** — 0–5 specific items, each = one sentence + ≤1 action
   (an application moved to review; a verification decision; a closeable readiness gap;
   a mentorship reply). Empty state is honest and calm: "لا شيء ينتظر إجراءك الآن."
3. **What changed** — a bounded, typed list of recent factual events (status changes,
   a new matched opportunity). Not a feed: finite, no engagement, no "activity."
   Collapses if nothing changed recently.
4. **My Career Record at a glance** — a compact summary of the spine (education,
   experience, skills, certifications, evidence) with a clear path in, and its derived
   views named as outputs: "عرض المسار الزمني," "كيف يراني أصحاب العمل," "أنشئ سيرة
   ذاتية." Makes A2 visible: one record, many views.
5. **Opportunities for me** — a small set (3–4) of matched opportunities from Radar,
   each showing *why* it surfaced (which criteria) and what evidence is relevant/
   missing (readiness in context). Abhathli named as the background monitor. If the
   Lammah/Plus boundary is relevant, it appears here as one honest line describing the
   external-sourcing capability, with the tier named second (A8).
6. **My applications** — status list, plain fixed states ("قيد المراجعة," "بانتظار
   ردّهم"), each linking to the tracked act.

Relationships made explicit by adjacency and language: the Career Record is the spine;
readiness reads *from* it against opportunity criteria; applications track acts *on*
opportunities; every section references the record rather than duplicating it.

**Forbidden in R2:** widget grid, card-soup, profile-completeness %, readiness %/score,
streaks, social feed, fabricated progress, decorative analytics, a "quick actions"
toolbar divorced from context, persistent upgrade pressure.

### 3.3 Mobile (Individual)

Mobile-primary for: check standing, see what needs me, respond to an opportunity,
check an application, read/reply mentorship, add one record entry. The home stacks in
the same reading order; the rail collapses to a bottom bar of the 3–4 job
destinations; "what needs my attention" is the top of the fold. Full Career Record
editing is mobile-safe, desktop-comfortable.

---

## 4. EMPLOYER ARCHITECTURE (specified; not built this checkpoint)

**Governing question:** *"What do I need, and can I defend the decision I'm about to
make?"*
**Primary workspace:** the Employer Home — a decision surface.
**Primary objects:** Workspace → Role → Criteria → Evidence → Candidate → Decision.

- **Home** answers: which roles need a decision · where a decision is blocked and why ·
  which candidates cleared a stage · what changed. A work queue over active roles, not
  a metrics dashboard, not a funnel chart.
- **Role** is authored as *criteria + the evidence that would prove each criterion* —
  not a keyword requisition. Criteria are first-class, named, and distinct from any
  candidate's text.
- **Candidate** is evaluated against the *same* criteria as every other candidate.
  A candidate is never reduced to a score + avatar + status pill: the surface shows
  evidence present, evidence missing, assessment/context, and (for a decision) the
  rationale. Same human as the Individual's متقدم view; employer sees مرشح.
- **Hiring decision** is a durable artifact that keeps its justifying evidence
  attached. The القرارات archive is where "why did we hire X" stays answerable.
- **No Kanban ATS pipeline as the organizing metaphor.** A pipeline *view* may exist
  as one lens; it is not the workspace.
- **AI** summarizes evidence against criteria and flags gaps (decision support). It
  never ranks people and never advances/rejects. Every consequential step =
  inspectable preview + explicit human approval.
- **Onboarding** (R5) is the fixed sequence: account → verify email → organization
  details + representative verification → pending review → workspace. No entity search,
  no directory picker, no claim. Reconciliation machinery is invisible unless it
  changes the applicant's available action.
- **Mobile:** review a candidate, approve/deny a stage, respond to an applicant —
  mobile-primary. Deep role/criteria authoring and multi-candidate comparison —
  desktop-primary, mobile-safe.

---

## 5. UNIVERSITY ARCHITECTURE (specified; not built this checkpoint)

**Governing question:** *"How are our graduates doing, and what should we change?"*
**Primary workspace:** the University Home — an institutional intelligence overview.
**Primary objects:** Program/Cohort → Outcome → Coverage/missingness → Gaps → Report.

- **Home** answers: what changed in outcomes · how complete is the data · which
  programs need attention · where is evidence insufficient. Not a KPI dashboard.
- **Every number carries its basis** in the same visual unit: "بناءً على ٦٢ من أصل ٩٠
  خريجاً صرّحوا ببياناتهم." Coverage is not a footnote.
- **Data-truth is the experience** (R7): KNOWN renders with denominator; UNKNOWN says
  "غير معروف حالياً"; PARTIAL folds coverage inline; SUPPRESSED shows "لا يُعرض لصغر
  حجم العينة" as a rule correctly applied; INSUFFICIENT → the card does not render;
  NOT-YET-MEASURED → "لم يُقس هذا المؤشر بعد," slot architected, not faked.
- **Methodology** is contextual — attached to the metric/report, reachable in one step,
  never a standing section.
- **"Declared this university" ≠ "verified / employed."** The graduate relationship is
  declaration-only; no university-email verification.
- **Charts** only where there is real data, real comparison, and a real decision.
  University is the one place data-viz may be load-bearing; still no benchmarking
  theatre, no universal readiness score.
- **Mobile:** view outcomes, monitor coverage, see what changed — mobile-primary.
  Report building — desktop-primary.

---

## 6. STAFF ARCHITECTURE (specified; not built this checkpoint)

Operational. Dense, keyboard-capable, unapologetically internal. Primary surfaces are
**work queues** (reconciliation, corrections, moderation) + **audit**. Internal
vocabulary (`entity`, `reconciliation_state`, approved domains, canonical record) is
correct here and only here. Same design language as the public actors — different
operating density, not a different brand. No decorative overview; the home is the
highest-priority queue.

---

## 7. AI PLACEMENT (cross-actor)

No universal floating AI bubble. AI appears where the task needs it, always labeled by
register (fact / suggestion / inference / draft), always inspectable, never
autonomous for consequential actions.

| Surface | AI role | Category (R1-C P11) |
|---|---|---|
| Career Record | draft an entry from input; organize existing input; explain what a section needs | C drafting / F background / A assistance |
| Opportunity detail | explain fit against criteria; name relevant + missing evidence — **never a fit %** | E explanation / B support |
| Employer role/candidates | summarize candidate evidence against role criteria; flag gaps | B decision support |
| University outcomes | explain methodology and coverage in plain Arabic; describe a pattern without inventing a conclusion | E explanation |
| Opportunities (Abhathli) | background monitoring + matching; "وجدنا" only for literal results | D discovery / F background |

Banned everywhere: a score/ranking/"visibility chance"/trend a real system doesn't
back; autonomous screening or hiring decisions; first-person knowledge claims ("أعرف
أنّك…").

---

## 8. LOCALE & DIRECTION

- `lang` and `dir` are set **server-side** on `<html>` (read the locale from the
  middleware-set `x-pathname` header in the root layout), not only via a
  post-hydration client effect. Arabic font stack and zero-letter-spacing rules then
  apply on first paint.
- Navigation uses locale-aware `Link`/`usePathname` (`@/lib/i18n/navigation`) — AR
  routes stay AR, EN routes stay EN, no route resets language.
- RTL is the design default for every D1 surface; LTR is a validated mirror. Numerals,
  time, and mono stay LTR-isolated (existing `globals.css` rule).
- No `tracking-*` / letter-spacing on Arabic, ever (hard gate).

---

## 9. WHAT D1-C1 DOES NOT DECIDE (carried to later checkpoints / D-review)

- Exact Employer/University/Staff home layouts (models given, not composed).
- The precise Radar + Abhathli + Lammah composition inside الفرص (`NEEDS D1
  EXPERIMENT`, resolved with R4).
- How the Professional Layer surfaces connection/discovery without a feed (`NEEDS D1
  EXPERIMENT`, resolved with R3).
- Whether the public "Mentors" list and the "Directory/Catalog" read as the same kind
  of browsable list (open since R1-A §18).
- Final command-palette consolidation (engineering; four implementations exist).
- Commercial prominence of Plus — Founder decides after seeing R2.

---

## 10. PARALLEL ENGINEERING DEPENDENCIES (not solved in D1)

`PARALLEL_ENGINEERING_DEPENDENCY` — the legacy claim-model DB retirement
(`integration/retire-legacy-org-claim-model`) is IN PROGRESS in a separate working
tree (~60 uncommitted files). D1 does not touch DB schema, migrations, RLS,
claim-retirement functions, authorization contracts, or Supabase architecture. If a D1
surface depends on claim-era internals, that surface is retired, not redesigned, and
the dependency is recorded here. None encountered for R1/R2.

---

*End of D1 Experience Architecture. Companion: `D1_JID_DESIGN_LANGUAGE.md`,
`D1_REFERENCE_EXPERIENCES.md`.*
