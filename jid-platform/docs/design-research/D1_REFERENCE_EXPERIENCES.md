# D1 — Reference Experiences

**Status:** all seven defined. **Only R1 and R2 implemented this checkpoint.**
R3–R7 are compositions for Founder/design review and for the next checkpoint —
not built as product code yet.

---

## R1 — PUBLIC FRONT DOOR — **IMPLEMENTED**

### Must prove
JID reads as **Saudi Career Infrastructure** within seconds — not a job board, ATS,
LinkedIn clone, or government portal. The Individual/Employer/University relationship
is understandable through the page's structure, not through three generic actor cards.

### What the current page does (before, zero design authority)
Hero (single-column, already decent) → `ProblemStatement` (3 pain cards) →
`ModulesShowcase` (8-tile feature grid: jobs/catalog/mentors/pulse/universities/
profiles/radar/cv) → `PdplTrustBar` → `Vision2030Section` (marketing paragraph) →
`CtaSection` (generic pre-footer slab). The three-actor relationship is never actually
explained — it's implied by scattered feature tiles.

### D1 composition (after)
Single reading path, RTL-first, no card-soup:

1. **Statement** (kept, refined) — eyebrow + one 6–12-word headline + one checkable
   subline ("جِد تربط الفرد، جهة التوظيف، والجامعة على سجل واحد للثقة المهنية")
   + situational entry action (فرد → أنشئ حسابك / جهة توظيف أو جامعة → ابدأ التحقق).
   No floating activity cards as the primary storytelling device.
2. **The relationship, as one system** (new — replaces the 8-tile module grid) — a
   single connected structure: the shared record of professional truth in the middle,
   with each actor's governing question and role stated around it — Individual (يبني
   ويتصرف), Employer (يعرّف الحاجة ويقرر), University (يفهم المخرجات). Presented as
   **three stacked/aligned rows sharing one spine element**, not three isolated cards —
   the *connection* is the point, not the count.
3. **What JID is not** (new, brief, honest) — one short paragraph: not a job board, not
   an ATS, not a social network — a plain differentiation statement, no comparison
   chart.
4. **How trust works** (replaces the PDPL badge-only bar with substance) — three plain
   facts, stated as sentences not badges: organizations are verified before they can
   participate; every published number states what it's based on; visibility is
   consent-governed, never silent. Links out to the PDPL policy for full legal detail.
5. **Entry** (replaces the generic CTA slab) — the same situational action from §1,
   restated once, inline, not a full-bleed marketing slab with a gradient or a giant
   headline repeat.
6. Footer (existing `PublicFooter`) carries the secondary links: opportunities,
   directory, universities, mentors, about, pulse.

**Removed:** the 8-tile module grid, the floating hero activity cards as primary
storytelling, the Vision 2030 marketing paragraph as a standalone section (folded to
one line inside "how trust works" if kept at all — see implementation notes), the
generic pre-footer CTA slab.

**Content register:** public/brand — distinctive, every claim checkable (R1-C §13).
No unsupported platform numbers, no superlatives.

---

## R2 — INDIVIDUAL HOME — **IMPLEMENTED**

### Must prove
"Home" = *where do I stand / what needs my attention / what changed / what can I do
next* — anchored to the Career Record as the spine, with Opportunities, Applications,
and Readiness shown as one system, not unrelated modules. No dashboard widget grid.

### What the current experience does (before, zero design authority)
There is no dedicated Individual home. `/me` → `/profile` → redirects to the person's
own **public profile projection** (`/profile/{id}`) — the same page an employer or the
public would see, reused as if it were a workspace.

### D1 composition (after)
New route, single focus column, RTL-first, becomes the post-login destination for the
`individual` role:

1. **Standing line** — plain-language reading of the Career Record's state (counts +
   verification + last-updated), never a score or %.
2. **What needs my attention** — 0–5 specific items, each one sentence + ≤1 action.
   Honest empty state if none.
3. **What changed** — bounded, typed, factual, finite. Not a feed.
4. **My Career Record at a glance** — spine summary + its derived views named as
   outputs (timeline, "how employers see me," "create a CV").
5. **Opportunities for me** — 3–4 matched opportunities with *why* + relevant/missing
   evidence; Abhathli named as background monitor; Lammah/Plus boundary appears here
   only, capability-first.
6. **My applications** — plain fixed-state status list.

Full detail: `D1_JID_EXPERIENCE_ARCHITECTURE.md` §3.2.

**Removed / forbidden:** widget grid, profile-completeness %, readiness score,
streaks, feed, decorative analytics, persistent upgrade pressure.

**Content register:** Individual — warm, direct, second-person, non-judgmental
(R1-C §13).

---

## R3 — CAREER RECORD (specified for next checkpoint)

**Must prove:** one spine, many views; a not-yet-live layer (Career Canvas, external
Evidence linking) is architected for, never faked as complete.

**Composition direction:** the record as **structured sections** on one page
(education, experience, skills registry, certifications, evidence), not a card wall
and not a form wizard. Each section: facts stated plainly, an "add" affordance, and a
visible trace of what's verified vs. self-declared. A persistent "views of this
record" rail names Timeline, "how others see me" (Profile projection, per active
consent grants), and "create a CV" as **outputs**, not siblings. Career Canvas renders
as a clearly-labeled not-yet-available section (advanced/future), never a dead link or
placeholder data. Evidence Vault section shows owner-private items with a plain
"external linking not available yet" state where relevant.

**Proves:** R1-C P1 (one spine), P12 (flexibility needs a floor — guided first-run for
an empty record), P2 (evidence legibility).

---

## R4 — OPPORTUNITY DETAIL + APPLY (specified for next checkpoint)

**Must prove:** JID is not a job board; assessments and AI live in context, not as
destinations; application status is honest even when the answer is silence.

**Composition direction:** opportunity framed by what it is, why it may matter to this
specific person (criteria vs. their record — readiness in context, not a fit %), what
evidence is relevant/missing, and one clear action. A configured assessment appears
inline as a step of applying, never a separate destination. After acting, the person
lands on their tracked application with a real, honest status — never a fabricated
"under review by 3 recruiters" theatre. Radar/Abhathli/Lammah are named where relevant
(how this was found / how to find more like it), never as separate product islands.

**Proves:** R1-C P7 (AI contextual, labeled), P3 (honest status), differentiation
territory T2/T5.

---

## R5 — ORGANIZATION ONBOARDING (specified for next checkpoint)

**Must prove:** verification-and-reconciliation replaces claim entirely; internal
machinery stays invisible; high-consequence register (Nafath/Qiwa-adjacent) works as
an experience, not just as copy.

**Composition direction:** account → verify email → organization details +
representative verification (one form, staged as named steps) → pending review →
workspace, each step titled for what it is, each a short named-action script. No
entity search, no directory picker, no claim, anywhere. Reconciliation state is never
shown as a token — only as plain status ("قيد المراجعة") and, if it changes the
applicant's available action, the specific next step. Uses the shipped `2d234d5` copy
as **functional evidence** of what already works (e.g. calibration examples 28/31/32
in the Language System), not as design authority for layout.

**Proves:** R1-C P4 (one staged path), P10 (technical truth behind the experience), P9
(procedural-plain register).

---

## R6 — EMPLOYER HIRING WORKSPACE (specified for next checkpoint)

**Must prove:** role = criteria + evidence; candidates compared against the *same*
criteria; the decision keeps its evidence; AI supports, never decides.

**Composition direction:** a role's working view = criteria list (named, distinct) +
a candidate list/table (not a Kanban board) where each candidate row shows evidence
present/missing against those same criteria. Opening a candidate = a split detail
view: criteria on one side, evidence + AI-summarized alignment (labeled, inspectable)
on the other. A decision is recorded with its rationale and stays attached to the
candidate + role permanently (visible from القرارات later). Mobile: read the
evidence, approve/decline a stage — desktop-primary for authoring criteria and
multi-candidate comparison.

**Proves:** R1-C P2 (evidence beats the badge), P7 (tiered AI), differentiation
territory T2.

---

## R7 — UNIVERSITY OUTCOMES (specified for next checkpoint)

**Must prove:** data truth is an experience — coverage inside the number, missingness
named, suppression shown as a rule, a card that disappears cleanly when data is
insufficient.

**Composition direction:** institutional overview leads with the outcomes headline
*with its coverage stated in the same unit*, then program/cohort rows. At least three
states demonstrated on one screen or one program's detail: a KNOWN metric (with
denominator), a PARTIAL/coverage-gap metric (coverage named, not hedged), and a
SUPPRESSED metric (named as a rule correctly applied, not an error). Methodology is
one step away from the metric it explains, never a standing tab. No benchmarking
theatre, no universal readiness score.

**Proves:** R1-C P3 (missing > approximate), P10 (methodology contextual),
differentiation territory T3.

---

*End of Reference Experiences. R1/R2 implementation and evidence: see
`D1_PREVIEW_EVIDENCE.md` and the working tree at
`integration/jid-d1-experience-design-direction`.*
