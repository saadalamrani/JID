# R1-C — D1 Design Input

**This is the direct brief for D1 (Experience Architecture / Design).**
Concise and operational. Full reasoning: `R1C_JID_EXPERIENCE_CONTENT_THESIS.md`.
Language authority: `R1B_JID_SAUDI_PRODUCT_LANGUAGE_SYSTEM.md`.

**Status:** `SYNTHESIS_COMPLETE` — D1 is cleared to begin. Not design-approved.

**Standing rule for D1:** the current UI has **zero design authority**. It is evidence of
features, states, data, contracts, and current workflow — never of layout, navigation,
hierarchy, component selection, visual composition, or interaction model. D1 re-solves
the experience. D1 preserves product truth.

---

## A. EXPERIENCE THESIS (one page)

JID is **Saudi career infrastructure**: one governed record of truth about the Saudi
employment relationship, viewed honestly and differently by three actors — the Individual
building professional truth and acting on opportunity, the Employer defining a need and
making a defensible hiring decision, the University understanding graduate outcomes well
enough to improve. Mentorship is a capability inside the Individual ecosystem, not a
fourth actor.

> **Using JID should feel like consulting a trusted registrar of your professional
> truth** — one that orients you in seconds, shows its evidence before its conclusions,
> tells you plainly what it does not know, and always points at a decision that you (or
> someone accountable) can defensibly make. It never manufactures activity to keep you
> there.

Ten auditable clauses:

1. **Orientation before detail** — each actor knows what this is / what needs attention /
   what changed / what they can do, in one read.
2. **One truth, many views** — every fact traces to one home; nothing copies it; two
   screens can never disagree.
3. **Evidence beats the badge** — any score/pill/conclusion is secondary to, and
   drillable to, its evidence.
4. **Honest about absence** — "not measured yet" / "based on 62 of 90" over a zero, a
   dash, a placeholder, or an invented proxy.
5. **Composed in Arabic, not converted** — native rhythm, trusted Saudi vocabulary,
   register by consequence, no sentence that needs its English to be understood.
6. **Technical truth stays behind the experience** — internal state/mechanics surface
   only when the user's available action actually changes.
7. **AI drafts / explains / discovers / organizes — never quietly decides** — every
   consequential action inspectable and human-authorized; AI never sounds more certain
   than its evidence.
8. **No keep-them-here mechanic** — no feed, likes, streaks, counters, activity streams.
9. **One path per relationship, staged, never duplicated.**
10. **Continuity** — state, position, and request status persist; re-explaining from zero
    is the failure JID exists to end.

---

## B. ACTOR MODEL

| Actor | AR name | Governing question | Core mental objects | Home model |
|---|---|---|---|---|
| **Individual** | فرد | "Where do I stand, and what do I do next?" | My professional truth (Career Record) · my standing (readiness) · opportunities for me · what's happening (status) · how I show up (projection) | Personal workspace + next actions, anchored to the Career Record |
| **Employer** | جهة توظيف (pre-workspace) → منشأة (operational) | "What do I need, and can I defend the decision I'm about to make?" | Workspace · Role · Criteria · Evidence · Candidate (مرشح) · Hiring decision | Decision surface / work queue over active roles |
| **University** | جامعة | "How are our graduates doing, and what should we change?" | Program/Cohort · Outcome (مخرجات) · Coverage/missingness · Gaps · Report | Institutional overview — outcomes headline **with coverage**, what changed |
| **Staff / Super Admin** | — (internal) | — | Verification requests · reconciliation · canonical record · corrections · audit | Work queue by priority |

- **Mentorship** = a relationship + mode on the Individual (being mentored / also
  mentoring). Restructure `/mentor` + `/mentors` under the Individual actor. Do **not**
  design toward a fourth actor.
- **Candidate vs. applicant** = the same human: مرشح from the employer's side, متقدم from
  the individual's side. Never conflate the two views.

---

## C. CORE OBJECTS

Experience object model (not schema). Full connections table: Thesis Part 4.

- **Individual** — the person. Never "a candidate" (that's an employer's *view*).
- **Career Record (السجل, L2)** — THE canonical spine: education, experience, one skill
  registry, certifications. Everything references it; nothing copies it. Never a CV;
  never a "profile page."
- **Evidence (إثبات/إثباتات, L3)** — owner-initiated proof-of-work, private by default.
  Not the Directory (الدليل); not hiring-pipeline docs (there are none).
- **Career Timeline (L4)** — a view of the spine + authored milestones. Never a feed.
- **Readiness (جاهزية)** — an honest reading of what's present/absent to reach a goal.
  Never a score, %, or "profile strength" bar.
- **Expression / projection (L6)** — every public/recruiter/CV rendering, always derived,
  never stored as truth. **CV** = one ephemeral dated snapshot.
- **Opportunity (فرصة)** — the unit of "something to act on." Not "وظيفة" as default; not
  a job-board listing as the front door.
- **Application (متقدم view)** — "where do I stand" on a submitted act.
- **Organization — three states:** Directory/Catalog record (reference data, registry
  grammar) → Profile (self-authored identity, immersion grammar) → Workspace (authorized
  operating context). Never blur them; nothing operational anchors to a Directory record.
- **Verification request** — carries a representative's evidence *before* a workspace
  exists. Not an "account"; not a "claim."
- **Role** — a need defined as **criteria + the evidence that would prove them**. Not a
  keyword list.
- **Hiring criteria** / **Hiring evidence** / **Hiring decision** — distinct, named
  objects. The decision keeps its evidence attached. Never collapse criteria and
  candidate evidence into one block.
- **Program / Cohort** · **Graduate relationship (إعلان/ارتباط, declaration-only)** ·
  **Outcome (مخرجات)** · **Coverage/missingness (first-class)** · **Outcomes report
  (every number drillable)**.
- **Consent grant** — every disclosure is a named, per-purpose, revocable grant. Never a
  blanket toggle; never inferred from silence.
- **Professional Layer** — governed substrate for identity / discovery / connection.
  Never a feed.
- **Internal (Staff only):** `entity`, `reconciliation_state`, `approved domains`,
  canonical/authorized record, audit trail.

---

## D. PRIMARY JOBS

**Individual (5):** I1 build & keep current my professional truth in one place · I2
understand where I stand and what's missing · I3 find opportunities that genuinely fit ·
I4 act on an opportunity and know honestly what happened · I5 project the right version
of my story for a context.
*Supporting:* mentorship, consent grants, Professional Layer connection. *Contextual:*
take an assessment. *Future:* external evidence linking. *Advanced:* Career Canvas.

**Employer (5):** E1 establish an authorized workspace (verify, not claim) · E2 define a
role as criteria + proving evidence · E3 evaluate candidates against the same criteria ·
E4 make a hiring decision that stays documented · E5 communicate outcomes honestly
(rejection = reason + next step).
*Supporting:* team/workspace, Profile. *Contextual:* per-role assessment, paid visibility
(with no-distortion disclosure). *Future:* conversation-evidence capture.

**University (4):** U1 see what's known/unknown/changed for a cohort · U2 understand
outcomes per program · U3 connect an outcome to an institutional/career-support decision
· U4 produce a report whose every number survives scrutiny.
*Supporting:* employer alignment, Profile. *Contextual:* methodology/coverage detail.

**Staff (4):** reconcile verification requests · review Career Record corrections ·
moderate · maintain the audit trail.

---

## E. HIERARCHY (not navigation — hierarchy)

**Individual** — PRIMARY: Career Record (persistent center) · "what needs my attention"
home · Opportunities-for-me · My applications/status. SECONDARY: readiness · timeline ·
evidence · mentorship · consent settings · CV/projection generation. CONTEXTUAL:
assessment (in an opportunity) · CV rendering (in an application/export) · Abhathli task
def (in Opportunities) · Professional Layer profile detail. BACKGROUND: Abhathli matching
· Lammah ingestion · notifications.

**Employer** — PRIMARY: active roles · "what needs a decision" home · the hiring
workspace for a role. SECONDARY: candidate evidence/comparison · hiring decisions archive
· workspace/team settings · org Profile. CONTEXTUAL: assessment config · applicant
comms · paid-visibility toggle+disclosure · verification/reconciliation status (only
while pending). BACKGROUND: matching · notifications.

**University** — PRIMARY: institutional outcomes overview (coverage stated) · "what
changed." SECONDARY: program/cohort detail · employer-alignment view · reports · Profile.
CONTEXTUAL: methodology/coverage/suppression explanation (attached to the metric) · a
consented graduate record. BACKGROUND: aggregation · coverage computation.

**Explicit rulings:**
- **CV is not a primary destination** — it is a dated output of the Career Record,
  reached in context.
- **Assessments are not persistent navigation** — contextual to an opportunity or hiring
  process.
- **University methodology is not a primary section** — it is contextual evidence
  attached to metrics and reports.
- **"Explore opportunities" + "Jobs" → one surface.** **"Mentorship" + "Mentors" → one
  job under the Individual.**

---

## F. EXPERIENCE PRINCIPLES (audit checklist — 12)

Each has a failure example in Thesis Part 22. Use these to reject screens.

1. **One spine, many views, never two truths.**
2. **Evidence is more legible than the badge that stands for it.**
3. **A missing number is more honest than an approximate one.**
4. **One path per relationship, staged, never duplicated.**
5. **Home answers "what needs me now," never "what data do we have."**
6. **Density is chosen per actor, on purpose.**
7. **AI drafts, explains, discovers, organizes — never quietly decides.**
8. **No mechanic exists whose only job is to keep someone there.**
9. **Composed in Arabic, register by consequence.**
10. **Technical truth stays behind the experience.**
11. **Consent is specific, revocable, never inferred from silence.**
12. **Flexibility needs a floor** (strong guided first-run + opinionated defaults).

---

## G. LANGUAGE / REGISTER MATRIX

Full system: `R1B_JID_SAUDI_PRODUCT_LANGUAGE_SYSTEM.md`. Operative summary:

| Context | Register | Experience implication | Reject |
|---|---|---|---|
| Public / brand | Distinctive Saudi voice, every claim checkable | Front door states what JID *is*, for whom, verifiably; one checkable claim per headline | Job-board framing ("بوابتك نحو الفرص"); superlatives |
| Individual | Warm, human, direct; MSA baseline, warmth via word choice | Names action + evidence + next decision, never a judgment; routine actions not over-explained | "اكتشف إمكاناتك" / "unlock your potential"; motivational cliché |
| Employer | Precise, professional, decision-oriented | Role / criteria / evidence / decision as distinct things | "ذكاء التوظيف" / "talent intelligence" badge words |
| University | Institutional, clear, evidence-oriented, **not** bureaucratic | Coverage inside the number; "not measured yet" plainly; مخرجات only once real | Apologetic caveats appended after a figure |
| High-consequence (verification / consent / legal / Staff / hiring outcomes) | Procedural plainness, Nafath/Qiwa-adjacent | Script of named sequential actions; policy before/after, never inside the step | Legal contingency clauses in an action label; cleverness |
| Staff | Dense, operational, internal vocabulary OK | `entity`, reconciliation state, approved domains fine *here only* | Warmth-signaling; marketing register |
| AI-generated | Its own register, always distinguishable | fact / suggestion / inference / draft each carry their marker | "وجدنا" for a conclusion about a person; "I know you…" |

**Terminology locks (do not restyle):** فرصة (not وظيفة default) · الملف التعريفي ·
أنشئ (not استلم/claim — banned) · عادي / بلس tiers · الدليل/الكتالوج = Directory/Catalog ·
جهة توظيف (pre-workspace) → منشأة (operational) · مساحة العمل (plain, not "معتمدة" to
users) · حالة for "where do I stand" · تحقق for verification · موافقة default for
approval/consent, اعتماد = formal register of the same · إثبات/إثباتات = Evidence Vault
proper noun (ordinary دليل = "clue/evidence" in a sentence is fine) · graduate relation =
إعلان/ارتباط (never "verified via university email").

**AR/EN parity:** share meaning and which fact is stated, not sentence structure. Equal
depth in both locales, always.

---

## H. DESIGN QUALITY CRITERIA

"Modern JID" = measurable. For each: good vs. fake modernity (full table: Thesis Part
23).

orientation speed · hierarchy (focus/recede) · continuity (state persists) · purposeful
density (per actor) · contextual actions (action where the object is) · progressive
disclosure (rationale one step from what it explains) · native Arabic behavior (composed,
register by consequence, RTL structural) · evidence legibility (readable on any device) ·
low-form friction (staged, specific-verb CTAs, ask once) · purposeful motion (clarifies
state; respects `prefers-reduced-motion`) · trust surface (verified vs. declared obvious;
whose view obvious; reversibility stated) · AI restraint (contextual, labeled,
inspectable) · mobile intent (check-and-respond first-class) · honest emptiness ("not
measured yet"; cards disappear cleanly).

**Fake modernity to avoid:** a beautiful hero that says nothing actionable; uniform card
grids; one density platform-wide; a standing "Methodology" mega-section; translated flat
register; decorative motion; "AI" badges everywhere; desktop squeezed to 375px; zeros and
"coming soon" over absent data.

---

## I. RECOMMENDED D1 REFERENCE EXPERIENCES (7)

Design these first. Together they prove JID's future experience language across all three
actors.

| # | Reference experience | Actor |
|---|---|---|
| R1 | **Public front door** (homepage) | Public |
| R2 | **Individual Home** | Individual |
| R3 | **Career Record** (the spine, with a not-yet-live layer visible) | Individual |
| R4 | **Opportunity detail + apply** (with a contextual assessment) | Individual |
| R5 | **Organization onboarding** (account → verify email → org details + representative verification → pending/reconciliation → workspace) | Employer / University |
| R6 | **Employer hiring workspace for one role** (role criteria + candidate evidence comparison + a documented decision) | Employer |
| R7 | **University outcomes** (institutional overview + one program's outcome with coverage/missingness/suppression) | University |

---

## J. WHAT EACH REFERENCE EXPERIENCE MUST PROVE

| # | Product question it proves | Design principle it must test | What can inherit from it later |
|---|---|---|---|
| **R1 Public front door** | JID reads as *infrastructure*, not a job board or government portal, on first contact | P9 (Arabic register by consequence; one checkable claim), P5-adjacent (orientation), Quality: orientation speed | All public/marketing surfaces; the brand register; the actor-split entry pattern |
| **R2 Individual Home** | "Home" = what needs my attention / what changed / what I can do — not a widget grid | P5 (home model), P1 (anchored to the spine), P8 (no feed), Quality: purposeful density | Employer & University homes (same "attention/changed/action" spine, different model); the notification-to-attention-item pattern |
| **R3 Career Record** | The spine doctrine is livable: one truth, many views; a not-yet-live layer is architected for without being faked | P1 (one spine, many views), P12 (flexibility needs a floor), P2 (evidence legibility), `FUTURE_COMPATIBLE_NOT_FAKE_LIVE` | CV/Timeline/Evidence/projection as views; every "detail of a record object" surface; the guided first-run pattern |
| **R4 Opportunity detail + apply** | Assessments and AI discovery live *in context*, not as destinations; application status is honest ("even if the answer is silence") | P7 (AI contextual, labeled), Assessments contextual not nav, P3 (honest status), Quality: contextual actions | Every "act on an object then track it" flow; the Radar/Abhathli/Lammah composition; the honest-status pattern |
| **R5 Organization onboarding** | Verification-and-reconciliation replaces claim entirely; internal machinery stays invisible; high-consequence register works | P4 (one staged path), P10 (technical truth behind the experience), P9 (procedural-plain register), P11-adjacent (what the applicant must confirm) | The staged-flow pattern for all multi-step flows; the high-consequence register; the "plain status, not a state token" rule |
| **R6 Employer hiring workspace** | Role = criteria + evidence; candidates evaluated against the *same* criteria; the decision keeps its evidence; AI supports but never decides | P2 (evidence beats the badge), P7 (tiered AI approval), criteria ≠ candidate-evidence as distinct objects, P6 (density for a power user) | University report surfaces (evidence-attached, drillable); any comparison/decision surface; the tiered-AI-approval interaction |
| **R7 University outcomes** | Data-truth as *experience behavior*: coverage inside the number, missingness named, suppression as a rule, a card that disappears cleanly | P3 (missing > approximate), P10 (methodology contextual not a section), Quality: honest emptiness | Every metric/stat surface platform-wide; the "coverage rides with the number" unit; the drill-to-basis pattern |

---

## K. D1 QUESTIONS TO SOLVE

Design questions (not Founder product decisions, not engineering):

1. Exact navigation architecture per actor (hierarchy is given; nav is not).
2. Concrete home layout per actor (models given: personal workspace / decision surface /
   institutional overview / work queue).
3. Global search vs. contextual actions vs. command palette — where each applies; which
   actors get a command palette (Staff yes; Individual/public only if behavior supports
   it — do not assume "command palette = modern").
4. Persistent vs. contextual action placement, concretely, per surface.
5. Information density, concretely, per actor.
6. Mobile navigation pattern (no fixed sidebars; check-and-respond first).
7. How object relationships are shown so the product reads as one system, not islands.
8. How Radar + Abhathli (background) + Lammah (Plus source) compose into **one**
   opportunity surface (`NEEDS D1 EXPERIMENT`).
9. How the Professional Layer surfaces identity / governed discovery / governed
   connection **without a feed** (`NEEDS D1 EXPERIMENT`).
10. Whether a public "Mentors" list and the org "Directory/Catalog" should read as the
    same kind of browsable reference list or genuinely different (open since R1-A §18).
11. How `/mentor` + `/mentors` is restructured under the Individual actor.
12. First-run / guided-default patterns for the Career Record, the Employer role setup,
    and the University report.

---

## L. NON-NEGOTIABLE PRODUCT CONSTRAINTS

D1 works within all of these (Constitution + Founder decisions):

1. Exactly **three public actors**; Mentorship is an Individual capability; Staff/Super
   Admin internal.
2. **Directory ≠ owned Profile** — registry grammar vs. immersion grammar; no direct
   organization write path to a Directory row.
3. **Career Record spine** — one fact lives in one place; everything else references.
4. **Data-truth doctrine** — no number/badge/claim without a real, traceable,
   currently-existing source; cards disappear cleanly; every number drillable; no
   fabricated trends.
5. **Privacy constitution** — owner owns every datum; read-path server-side enforcement;
   every disclosure a specific, revocable, per-purpose grant; projections are separate
   server-computed views.
6. **Anti-feed constitution** — zero social-network mechanics on individual-facing
   surfaces, ever.
7. **Human authorization** — verification and AI both stop short of consequential
   decisions; approve ≠ own.
8. **Declaration-only** graduate–university relationship — no university-email
   verification, ever.
9. **Organization onboarding sequence is fixed:** account → verify email → org details +
   representative verification → internal reconciliation → authorized workspace. No
   public claim/search, in any form.
10. **Arabic-first structural default** — equal-depth bilingual; zero letter-spacing on
    Arabic; Latin digits; RTL structural; locked font families; Asia/Riyadh everywhere.
11. **Terminology lock** (Section G).
12. **Zero-document hiring pipeline** — applications carry no files; Evidence Vault does
    not leak into hiring.
13. **One shared instance** of platform chrome — one notification bell, one logo, one
    command palette, one Smart Header, one sidebar pattern.

---

## M. THINGS D1 MUST NOT COPY FROM CURRENT UI

The current UI has zero design authority. Specifically do not carry over:

- **Feature-island navigation** — "Explore opportunities" + "Jobs" as separate items;
  "Mentorship" + "Mentors" as separate items; `/profile`, `/profile/cv`, `/radar`,
  `/screenings` as sibling destinations.
- **The dashboard-first landing** as a shared template across Individual / Employer /
  University.
- **Any claim-model surface or copy** — "claim," "reapply," "find your entity," "do you
  represent this organization?", "ownership," `المطالبات`, `ملكية` framing.
- **Database vocabulary in user-facing strings** — `entity` / `كيان`, `directory_id`,
  reconciliation state names, "authorized/معتمدة workspace" shown to the org's own user.
- **The four separate command-palette implementations** — design for the one Article 7
  mandates.
- **Translationese copy** — strings that read as translations of a schema name; flat
  register; legal clauses in microcopy moments.
- **"Not live yet" layers presented as complete** or backed by placeholder data / dead-end
  destinations.
- **Current route names as an organizing principle** for anything.

---

## N. THINGS D1 MUST NOT BREAK

- Privacy boundaries and read-path enforcement (no fetch-then-hide).
- Data truth — never introduce a fabricated number, unmeasured %, or invented trend to
  fill a layout.
- The Career Record as the single source of professional truth.
- University aggregation honesty — coverage/missingness first-class; suppression floors;
  "declared" ≠ "verified/employed."
- Human authorization — no design that implies AI or automated screening decides.
- Actor separation — no surface that reintroduces a fourth public actor.
- Directory ≠ owned Profile.
- The anti-feed constitution.
- Existing routes (no new 404s/redirect breakage), existing RLS, existing shared chrome
  components.
- Arabic typography rules (zero letter-spacing), i18n discipline (no hardcoded strings),
  semantic tokens (no raw hex), accessibility baseline, zero horizontal overflow.

---

## O. LEGACY DB / ENGINEERING DEPENDENCIES D1 SHOULD NOT TURN INTO UX

These are **implementation dependencies**, tracked for future execution. D1 must design
as if they are already resolved — never design *around* them, never surface them.

```
PRODUCT_CLAIM_MODEL        = REJECTED
PUBLIC_CLAIM_ONBOARDING    = REMOVED (shipped 2d234d5b5..., closeout 60cdb54...)
LEGACY_DB_CLAIM_RETIREMENT = PARALLEL_ENGINEERING_WORK / IN PROGRESS
                             (branch: integration/retire-legacy-org-claim-model)
```

Not D1's concern, and not to be reflected in any design:

- Residual `claimed_by` / `entity_state` machinery still gating jobs, applications,
  screening, billing, comms across 31+ migrations.
- `commitment_score` still present in 5 historical migrations (concept is banned —
  Article 8).
- Staff "Claims queue" vs "Verification requests" duplication.
- Claim-adjacent copy the org-onboarding commit didn't sweep: Staff command-palette
  `المطالبات`, Staff dashboard `ملكية` framing, public unclaimed-listing "do you
  represent this organization?" prompt, `مطالبة` in Edge Function email templates,
  `entity` wording in the Staff checklist.
- 200+ hardcoded Arabic strings outside the i18n system.
- Four command-palette implementations to consolidate into one.

D1 designs the **verification-and-reconciliation** experience only. If D1 encounters a
surface that only makes sense under the claim model, that surface is retired, not
redesigned.

---

*End of D1 Design Input. No product code, database, migration, `messages/*.json`,
component, route, or design token was changed to produce this document. D1 is cleared to
begin experience architecture; D1 must not implement product code, database changes, or
`messages/*.json` changes.*
