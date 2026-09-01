# R1-C — JID Experience & Content Thesis

**Phase:** R1-C (Synthesis only — no visual design, no frontend implementation, no
product code, no database changes, no `messages/*.json` changes)
**Status:** `SYNTHESIS_COMPLETE` — not design-approved, not founder-accepted; those
happen later.
**Required inputs, integrated:**
- `R1A_JID_PRODUCT_USER_HRTECH_RESEARCH.md` + `R1A_SOURCE_LEDGER.md`, governance-amended
  state at/after `c755b77a92bb47ee4bcb272bc5099cdfcbc0be68`.
- `R1B_JID_SAUDI_CONTENT_LANGUAGE_RESEARCH.md` + `R1B_JID_SAUDI_PRODUCT_LANGUAGE_SYSTEM.md`
  + `R1B_SOURCE_LEDGER.md`, R1-B.1 amended state at/after
  `4ae7dd881fd3d3c4cce13964f5f08c2da7f28851`.
- Organization-onboarding correction read as current product truth (not merged):
  implementation `2d234d5b514ffc95ac333997370b4d4589cd1052`, closeout
  `60cdb54f2683995f51a0140273b3a9de9fa5858e`.
- `JID_Agent_Operating_Constitution.md` (Articles 0–12) as governing product law.

**Companion file:** `R1C_D1_DESIGN_INPUT.md` — the operational brief D1 designs from.
This file is the reasoning; that file is the instruction set.

---

## HOW TO READ THIS DOCUMENT

Every load-bearing claim below carries one of five provenance tags, so an inference is
never mistaken for an adopted decision:

| Tag | Meaning |
|---|---|
| **[FOUNDER_DECISION]** | Already decided by the Founder or the Constitution. Not reopened here. |
| **[CURRENT_PRODUCT_TRUTH]** | What the shipped product (or the just-shipped org-onboarding correction) actually does today. |
| **[RESEARCH_EVIDENCE]** | Grounded in R1-A / R1-B findings (which carry their own PRIMARY / DIRECTIONAL grading — not re-litigated here). |
| **[SYNTHESIS_INFERENCE]** | This phase's own conclusion, drawn by resolving the inputs against each other. Defensible, not authoritative. |
| **[FUTURE_HYPOTHESIS]** | A direction to test in D1 or later, explicitly not adopted. |

Where R1-A or R1-B graded something as a *supported inference* or a *hypothesis to test*
(most prominently: how Saudi younger professionals specifically differ from the global
Gen-Z evidence base), this file keeps that grading and does not promote it.

---

## 1. EXECUTIVE THESIS

JID is **Saudi career infrastructure**: one governed record of truth about the Saudi
employment relationship, viewed honestly and differently by the three actors who depend
on it — the Individual building professional truth and acting on opportunity, the
Employer defining a need and making a defensible hiring decision, and the University
understanding graduate outcomes well enough to improve. Mentorship is a capability inside
the Individual ecosystem, not a fourth actor. [FOUNDER_DECISION]

R1-A's core finding is that the Founder's rejection of the current experience is a
**coherence problem, not a styling problem**: two eras of the product run at once (a
retired "search a catalog row and claim it" model still gates surfaces alongside the
"verify and reconcile" model the Founder has adopted), and the product is still organized
around database entities and shipped workstreams rather than user intent. A prior
token-conformance pass already proved that fixing colors and classes cannot fix what the
Founder is reacting to. [RESEARCH_EVIDENCE] [CURRENT_PRODUCT_TRUTH]

R1-B's core finding is the same failure seen through language: JID's copy was authored by
**translating the schema's name for a concept**, not by describing what the user is
experiencing — its own former homepage told a representative to "find your entity and
submit a claim on the profile," which is a `SELECT` followed by an `INSERT` spoken in the
imperative. The just-shipped org-onboarding rewrite proves the fix is tractable: the new
copy ("Individual? Create your account. Represent an employer or university? Register the
organization's details and your role as representative, then submit a verification
request.") is native, staged, and honest. [RESEARCH_EVIDENCE] [CURRENT_PRODUCT_TRUTH]

**R1-C's synthesis:** the redesign's job is to make one coherent product — organized
around user jobs, speaking Arabic natively, showing evidence before conclusions, and
never manufacturing motion, numbers, or urgency — out of a set of capabilities that were
each built and named in isolation. The positioning is already written and already
well-differentiated. What does not yet exist is an *experience* that embodies it. This
document defines what that experience must be. `D1` decides how it is structured and
designed.

---

## 2. JID EXPERIENCE DEFINITION — "WHAT SHOULD USING JID FEEL LIKE?"

Not visually. Experientially. This is written to be **violable** — a future design can be
rejected for breaching any clause.

> **Using JID should feel like consulting a trusted registrar of your professional
> truth** — one that orients you in seconds, shows you its evidence before its
> conclusions, tells you plainly what it does not know, and always points at a decision
> that you (or someone accountable) can defensibly make. It never manufactures activity
> to keep you there.

Operational clauses, each auditable:

1. **Orientation before detail.** Within one screen and one read, each actor knows: what
   this is, what needs their attention, what changed, and what they can do now. A surface
   that requires study before it can be acted on has failed. [RESEARCH_EVIDENCE: R1-A
   S12; R1-B §6]
2. **One truth, many views.** Every fact about a person or organization traces to exactly
   one place it lives. Every other surface *references* it; nothing copies it. If two
   screens can disagree about the same fact, the design is wrong. [FOUNDER_DECISION:
   Constitution Article 3 spine doctrine]
3. **Evidence is more legible than the badge that stands for it.** Any score, status
   pill, or conclusion is secondary to — and drillable to — the evidence behind it. A
   black-box number is a defect. [FOUNDER_DECISION: Article 4] [RESEARCH_EVIDENCE: R1-A
   S8]
4. **Honest about absence.** When JID does not know something, it says so in plain words
   ("not measured yet," "based on 62 of 90") rather than showing a zero, a dash, a
   placeholder, or an invented proxy. A missing number outranks an approximate one.
   [FOUNDER_DECISION: Article 4] [RESEARCH_EVIDENCE: R1-B §12]
5. **Composed in Arabic, not converted to it.** Every string reads as though written by a
   Saudi professional who does this work — native rhythm, the vocabulary Saudi
   institutions already use, no sentence that needs its English counterpart to be
   understood. Register shifts by consequence (procedural-plain for
   verification/consent/legal; warmer for the Individual; precise for the Employer;
   institutional-not-bureaucratic for the University; dense for Staff).
   [RESEARCH_EVIDENCE: R1-B §1–2, §21]
6. **Technical truth stays behind the experience.** `directory_id`,
   `reconciliation_state`, RLS, catalog linkage, ownership mechanics, verification
   internals — none of these are user concepts. They surface only when the user's
   available action actually changes because of them. [RESEARCH_EVIDENCE: R1-B §22]
7. **AI drafts, explains, discovers, and organizes — it never quietly decides.** Every
   consequential AI action is inspectable and human-authorized before it takes effect;
   only low-stakes, reversible actions apply automatically and visibly. AI never sounds
   more certain than its evidence. [FOUNDER_DECISION: Article 4] [RESEARCH_EVIDENCE: R1-A
   S2/S18; R1-B §13–14]
8. **No mechanic exists whose only job is to keep someone there.** No feed, no likes, no
   streaks, no counters, no "recent activity." Every recurring-use surface is justified
   by utility that compounds the more honestly it is maintained. [FOUNDER_DECISION:
   Article 3/8]
9. **One path per relationship, staged, never duplicated.** An Individual, Employer, or
   University can never land on two structurally different routes to the same outcome.
   [RESEARCH_EVIDENCE: R1-A §10.1] [FOUNDER_DECISION: org-onboarding sequence]
10. **Continuity.** JID remembers where the user was, what state a request is in, and
    what they last did. Re-explaining yourself from zero is the failure this whole
    product exists to end. [RESEARCH_EVIDENCE: R1-A §5 Individual JTBD]

**Institutional seriousness** is the through-line: JID is compared, implicitly, against
Absher / Tawakkalna / Nafath / Qiwa — government-grade identity and employment services
Saudi users already trust. It must feel at least that serious about identity and data,
without adopting bureaucratic sentence construction. [RESEARCH_EVIDENCE: R1-A S5; R1-B
§6]

---

## 3. THREE ACTOR MENTAL MODELS

Derived from R1-A's actor model and JTBD, R1-B's actor-register findings, and the Saudi
employment-platform precedent (Taqat / Jadarat / Qiwa each map to one job-to-be-done, not
one database table). Deliberately **not** organized around current route or feature
names. [RESEARCH_EVIDENCE: R1-A §3/§5/§11; R1-B §5/§9]

### 3.1 Individual — "Where do I stand, and what do I do next?"

The Individual does **not** think in "Profile," "CV," "Radar," "Applications" as separate
places. They think in a small number of intents:

- **My professional truth** — the accumulated, honest record of what I've done and can
  do. (One thing. The spine.)
- **My standing** — where that record puts me right now, and what's missing to get
  further. (A reading, never a manufactured score.)
- **Opportunities for me** — roles worth my attention, matched to my truth.
- **What's happening** — the status of things I've submitted, in plain words.
- **How I show up** — the specific version of my story a given context needs.

Mentorship sits inside this as a **relationship and a mode** ("I am being mentored" / "I
also mentor"), not a separate destination. [FOUNDER_DECISION]

**Synthesis inference:** the Individual's home is a personal workspace answering "what
needs my attention / what changed / what can I do," anchored to the Career Record — not a
dashboard of widgets. [SYNTHESIS_INFERENCE, from R1-A §10.5 + §13 + §17.4]

### 3.2 Employer — "What do I need, and can I defend the decision I'm about to make?"

The core mental objects are **Role → Criteria → Evidence → Candidates → Decision**, in a
**Workspace** the organization had to prove it is authorized to hold. The Employer does
not think in "applicant list management"; they think in "which of these people meets the
bar I set, and will the reasoning survive three weeks from now." [RESEARCH_EVIDENCE: R1-A
§5/§13/§14; S14 structured-hiring]

- **Workspace** — the authorized organizational context. Obtained by verification +
  internal reconciliation, never by claiming a directory row. [FOUNDER_DECISION]
- **Role** — not a keyword list; a definition of what evidence would prove someone can do
  this.
- **Candidate** — a person seen *from the employer's side* (مرشح), the same human the
  Individual sees as their own application (متقدم). Never conflate the two views. [RESEARCH_EVIDENCE:
  R1-B §10]
- **Hiring decision** — an artifact that keeps its justifying evidence attached to it.

### 3.3 University — "How are our graduates doing, and what should we change?"

The core mental objects are **Cohort / Program → Outcomes → Coverage → Gaps → Institutional
decision**. The University does not think in route names or "methodology pages"; they
think in "what is known, what is unknown, what changed, and what can a program or
career-support decision act on." [RESEARCH_EVIDENCE: R1-A §4/§5/§13; S6/S20; R1-B §9/§12]

- **Cohort / Program** — the unit of analysis.
- **Outcome (مخرجات)** — where graduates actually went, with coverage stated *inside* the
  number, never appended as an apology. The term is standard academic Arabic and is
  currently absent from JID copy because the capability is largely aspirational.
  [RESEARCH_EVIDENCE: R1-B §9] [CURRENT_PRODUCT_TRUTH]
- **Coverage / missingness** — a first-class, expected state, not an exception.
- **Report** — an external-facing artifact whose every number survives being drilled
  into.

The University must never confuse "who declared this university on their profile"
(a consent-governed graduate relationship, declaration-only per Article 8) with "who is
verified / employed." [FOUNDER_DECISION]

---

## 4. EXPERIENCE OBJECT MODEL

A conceptual model for **experience** purposes — not database schema. It exists so D1
avoids building feature islands: every object below names what it connects to and what it
must never be confused with.

### 4.1 Shared / cross-actor objects

| Object | Who cares | Why | Connects to | Never confuse with |
|---|---|---|---|---|
| **Individual** | All actors | The person whose professional truth JID holds | Career Record, Application, Candidate view, Mentorship, Graduate relationship | A "candidate" (that is the employer's *view* of an Individual, not a different entity) |
| **Organization** — three states | Employer, University, Staff, public | JID knows organizations before they show up, and after they prove themselves | Directory record ⇢ Profile ⇢ Workspace | Treating a Directory record as an owned identity; treating a Workspace as automatically public |
| **Directory / Catalog record** | Staff, public (reference) | Reference data JID maintains regardless of whether the org participates | Reconciliation, Profile | An owned Profile — registry grammar vs. immersion grammar [FOUNDER_DECISION: Article 2] |
| **Verification request** | Employer/University applicant, Staff | The one object that carries a representative's evidence before an org workspace exists | Organization (as evidence), Staff decision, Workspace | An "account"; a "claim" (that model is extinct) |
| **Opportunity (فرصة)** | Individual, Employer | The unit of "something to act on" | Role (employer side), Application, Radar, Assessment | "وظيفة/job" as the default term; a job-board listing as JID's front door [FOUNDER_DECISION: Article 6; R1-A §16] |
| **Consent grant** | Individual (owner), every non-owner viewer | Every disclosure is a named, revocable, per-purpose grant | Career Record, Evidence, Graduate relationship, Professional Layer | A blanket "share my data" toggle; silence as consent [FOUNDER_DECISION: Article 5] |
| **Verification (تحقق)** | All actors | Confirming an identity or a stated fact is real | Verification request, Career Record entries, Organization | "Approval/ownership grant" — verification and ownership are sequential, separate events [FOUNDER_DECISION: Article 2] |

### 4.2 Individual-side objects

| Object | Who cares | Why | Connects to | Never confuse with |
|---|---|---|---|---|
| **Career Record** — the spine (L2) | Individual (owner); Employer & University via governed projections | THE canonical professional truth: education, experience, one skill registry, certifications | Everything — CV, Timeline, Evidence, Readiness, Opportunity match all reference it | A CV (that is one disposable rendering); a "profile page" (that is a projection) |
| **Evidence (إثبات/إثباتات, L3)** | Individual (owner, private by default) | Owner-initiated proof-of-work assets | Career Record entries, governed projections | The Directory (الدليل — different root-word job); hiring-pipeline documents (the zero-document hiring doctrine is untouched) [FOUNDER_DECISION: Article 3] |
| **Career Timeline (L4)** | Individual | System milestones (pointers, never copies) + authored milestones | Career Record | A feed or "recent activity stream" — banned [FOUNDER_DECISION: Article 3] |
| **Readiness (جاهزية)** | Individual | An honest reading of "what's here, what's missing to reach X" | Career Record, Opportunity criteria | A score, percentage, ranking, or "profile strength" bar — none may render without a real measurement system [FOUNDER_DECISION: Article 4] |
| **Expression / projection (L6)** | Individual (author), Employer/University/public (viewers) | Every public / recruiter / CV rendering — always derived, never stored as truth | Career Record, Consent grant | The Career Record itself; a "second profile to maintain" |
| **CV** | Individual | One ephemeral, dated snapshot rendering | Career Record (pure renderer) | A live view of the profile; a source of truth [FOUNDER_DECISION: Article 3] |
| **Application (متقدم view)** | Individual | "Where do I stand" on something I submitted | Opportunity, Assessment, Hiring decision, Status | The employer's "candidate" view of the same act |
| **Mentorship relationship** | Individual (both sides) | A governed guidance relationship layered onto the Individual ecosystem | Career Record (context), Professional Layer, Opportunity (sometimes) | A fourth public actor; a marketplace listing [FOUNDER_DECISION] |
| **Professional Layer** | Individual, Employer (governed), University (governed) | Governed professional identity, discovery, and connection — the non-feed substrate | Career Record, Opportunity, Mentorship, Employer | A social network: no feed, likes, counters, popularity ranking, pay-to-win reach [FOUNDER_DECISION: Article 3/8] |

### 4.3 Employer-side objects

| Object | Who cares | Why | Connects to | Never confuse with |
|---|---|---|---|---|
| **Workspace** | Employer team, Staff | The authorized operating context; everything operational anchors here, never to a Directory record | Role, Team, Verification request, Profile | The Directory record; a "claimed listing" [FOUNDER_DECISION: Article 2] |
| **Role** | Hiring manager, recruiter | The definition of a need *as criteria + the evidence that would prove them* | Opportunity, Criteria, Candidate, Assessment | A keyword/requisition list |
| **Hiring criteria** | Employer | The bar, named explicitly as distinct from any one candidate's text | Role, Evidence, Hiring decision | Candidate evidence — never collapse the two into one block [RESEARCH_EVIDENCE: R1-B §16] |
| **Candidate (مرشح view)** | Employer | A person evaluated against the same criteria as every other | Role, Criteria, Hiring evidence, Application (the other side) | The Individual's own "application" view |
| **Hiring evidence** | Employer, and defensibility after the fact | What justified a decision, generated as a byproduct of the process | Criteria, Hiring decision | Documents received through the pipeline (there are none — zero-document doctrine) |
| **Hiring decision** | Employer, compliance/defensibility | A durable artifact that keeps its evidence attached | Candidate, Criteria, Hiring evidence | A transient pipeline stage |

### 4.4 University-side objects

| Object | Who cares | Why | Connects to | Never confuse with |
|---|---|---|---|---|
| **Program / Cohort** | Career center, program leadership, accreditation | The unit outcomes are measured against | Outcome, Coverage, Graduate relationship | An enrollment roster |
| **Graduate relationship (إعلان/ارتباط)** | Individual (owner), University | A declared, consent-governed link between a graduate and their university | Career Record, Consent grant, Outcome | "Verified via university email" — that workflow does not exist and must never be built [FOUNDER_DECISION: Article 6/8] |
| **Outcome (مخرجات)** | University | Where graduates went, always paired with its coverage basis | Program/Cohort, Coverage, Report | A complete census; a marketing statistic |
| **Coverage / missingness** | University, accreditation | The denominator and what's unknown — first-class, not a caveat | Outcome, Report | An error state; something to apologize for |
| **Outcomes report** | University leadership, external stakeholders | An external-facing artifact where every number is drillable | Outcome, Coverage, methodology | An annual PDF that gets filed and never acted on |

### 4.5 Internal objects (Staff / Super Admin)

`Reconciliation state`, `authorized/canonical organization`, `approved domains`,
`entity` (a Directory row abstraction), `audit trail`. These are **operational reality
for Staff** and legitimate on Staff surfaces — but they are `INTERNAL_ONLY` and must
never surface as user-facing concepts for the three public actors. [RESEARCH_EVIDENCE:
R1-B §19] [FOUNDER_DECISION: Article 2]

---

## 5. PRIMARY JOBS

Per actor: the small set of **primary** jobs (the experience is organized around these).
Everything else is `SUPPORTING`, `CONTEXTUAL`, `ADVANCED`, or `FUTURE`. Derived from
R1-A §5 JTBD, not from feature names.

### 5.1 Individual — primary (5)

| # | Primary job | Derived from |
|---|---|---|
| I1 | **Build and keep current my professional truth in one place**, without re-entering it everywhere | R1-A §5 "answer once, well, reuse everywhere"; Article 3 spine |
| I2 | **Understand where I stand and what's missing** to reach a specific goal | R1-A §5 "help me see what evidence I have and what's missing" |
| I3 | **Find opportunities that genuinely fit** my truth | R1-A §5; Radar/Abhathli current capability |
| I4 | **Act on an opportunity and know honestly what happened** — even if the answer is silence | R1-A §5 "tell me honestly what happened" |
| I5 | **Project the right version of my story** for a specific context without editing the underlying record | R1-A §5 "project the right one"; Article 3 L6 |

**Supporting:** get / give mentorship (S); manage consent grants (S); connect on the
Professional Layer (S). **Contextual:** take an assessment (only when an opportunity or
hiring process calls for it). **Future:** link external evidence into the Evidence Vault
(`FUTURE_COMPATIBLE_NOT_FAKE_LIVE`). **Advanced:** Career Canvas / aspiration mapping.

### 5.2 Employer — primary (5)

| # | Primary job | Derived from |
|---|---|---|
| E1 | **Establish an authorized workspace** by proving the organization and my role — verification, not claim | Founder org-onboarding decision; closeout doc |
| E2 | **Define a role as criteria + the evidence that would prove it** | R1-A §5 "what evidence would actually prove someone can do it" |
| E3 | **Evaluate candidates against the same criteria and evidence** | R1-A §5 "compare the same evidence against the same criteria" |
| E4 | **Make a hiring decision that stays documented** with its justifying evidence attached | R1-A §5 "let the evidence stay attached to the decision" |
| E5 | **Communicate outcomes to applicants honestly**, including rejection with a reason and a next step | R1-A §5; R1-B calibration ex. 15 (rejection-detail model) |

**Supporting:** manage team & workspace settings; maintain the organization Profile
(immersion grammar). **Contextual:** configure an assessment for a specific role;
paid-tier visibility for a specific opportunity (with the no-distortion disclosure).
**Advanced:** cross-role analytics. **Future:** conversation-evidence capture
(Metaview-style) — `FUTURE_HYPOTHESIS`, only ever under Article 5 consent.

### 5.3 University — primary (4)

| # | Primary job | Derived from |
|---|---|---|
| U1 | **See what is known / unknown / changed for a graduating cohort** without a partial number pretending to be complete | R1-A §5 "tell me clearly what is known, what is unknown, and what changed" |
| U2 | **Understand real outcomes per program**, not anecdote | R1-A §4 academic/program leadership need |
| U3 | **Connect an outcome to an institutional or career-support decision** | R1-A §5 "connect that back to something a decision can act on" |
| U4 | **Produce an external-facing report whose every number survives scrutiny** | R1-A §4 accreditation stakeholders; S20 |

**Supporting:** understand employer alignment / demand gaps; maintain the University
Profile. **Contextual:** methodology / coverage detail (attached to a metric, not a
standing section). **Future:** continuous (vs. annual) outcomes refresh — direction, not
a shipped capability.

### 5.4 Staff — primary (4)

Reconcile organization verification requests (link/create canonical record, or flag);
review Career Record correction suggestions; moderate; maintain the audit trail. Staff
gets density, speed, keyboard operability, and internal vocabulary by design.
[RESEARCH_EVIDENCE: R1-A S7; R1-B §9]

---

## 6. EXPERIENCE HIERARCHY

Per actor: `PRIMARY` (persistent, always reachable), `SECONDARY` (one level in),
`CONTEXTUAL` (appears where relevant, not in nav), `BACKGROUND` (runs without a
destination). This is hierarchy, **not** final navigation. [SYNTHESIS_INFERENCE built on
R1-A §11 + Article 3]

### 6.1 Individual

| Level | Surfaces |
|---|---|
| PRIMARY | The Career Record (the spine, as the persistent center); "what needs my attention" home; Opportunities-for-me; My applications/status |
| SECONDARY | Readiness view; Career Timeline; Evidence; Mentorship; Consent/visibility settings; Expression/CV generation |
| CONTEXTUAL | A specific assessment (inside an opportunity); a specific CV rendering (inside an application or export); Abhathli task definition (inside Opportunities); Professional Layer profile detail |
| BACKGROUND | Abhathli monitoring & matching; Lammah external-opportunity ingestion (Plus); notification generation |

**Explicit answers to R1-A's hierarchy questions:**
- **Is "CV" a primary destination?** No. The CV is one dated projection/output of the
  Career Record, reached in context (an application, an export). Making it a peer nav
  item recreates the "second source of truth" the spine doctrine forbids.
  [SYNTHESIS_INFERENCE] [FOUNDER_DECISION: Article 3]
- **Should "Assessments" always live in navigation?** No. An assessment is contextual to
  an opportunity or a hiring process. It appears when it is relevant and is otherwise not
  a place. [SYNTHESIS_INFERENCE, from R1-A §5 + §11]

### 6.2 Employer

| Level | Surfaces |
|---|---|
| PRIMARY | Active roles (the working set); "what needs a decision" home; the hiring workspace for a given role |
| SECONDARY | Candidate evidence / comparison for a role; hiring decisions (archive with evidence attached); workspace & team settings; organization Profile |
| CONTEXTUAL | Assessment configuration for a role; applicant communication; paid visibility toggle + disclosure; verification/reconciliation status (only while pending) |
| BACKGROUND | Candidate-criteria matching; notifications |

### 6.3 University

| Level | Surfaces |
|---|---|
| PRIMARY | Institutional outcomes overview (with coverage stated); "what changed / what needs attention" |
| SECONDARY | Program / cohort outcome detail; employer-alignment view; reports; University Profile |
| CONTEXTUAL | Methodology / coverage / suppression explanation (attached to the specific metric); a single graduate's consented record (where a grant exists) |
| BACKGROUND | Outcome aggregation; coverage computation |

**Explicit answer:** University methodology is **contextual evidence attached to
metrics and reports**, not a primary section. A standing "Methodology" tab implies the
methodology is the product; the metric is the product, and its basis rides inside it.
[SYNTHESIS_INFERENCE, from R1-B §12 + Article 4]

### 6.4 Staff

PRIMARY: work queues (reconciliation, corrections, moderation). SECONDARY: entity/record
detail, audit trail, history. Density and keyboard-first are correct here and only here
by default.

---

## 7. FEATURE-ISLAND RECONCILIATION

R1-A identified feature-island risk: capabilities shipped as independent workstreams,
each getting its own nav slot, so the product "feels like multiple products joined
together." Below, every Individual-side capability named in the brief is reconciled.
Classifications: `MERGE CONCEPTUALLY` / `KEEP DISTINCT` / `CONTEXTUALIZE` / `DEMOTE` /
`FUTURE-COMPATIBLE` / `NEEDS D1 EXPERIMENT`. No capability is deleted without product
justification; not every capability is a nav item. [SYNTHESIS_INFERENCE on R1-A §10.2 /
§11 + Article 3]

| Capability | What it actually is | Verdict | Reasoning |
|---|---|---|---|
| **Career Record** | The canonical spine (L2) | **PRIMARY CORE OBJECT** | Constitutionally "THE canonical spine." The persistent center of the Individual experience. |
| **Career Timeline** | A view of the spine + authored milestones (L4) | **CONTEXTUALIZE** as a view onto the Career Record | It is a lens on the same truth, not a separate place. Must never become a "recent activity" feed. |
| **CV** | An ephemeral dated rendering (L6) | **DEMOTE** to an output/action of the Career Record | Peer-nav status makes it a rival source of truth. Reached in context (application, export). |
| **Profile** | The public/recruiter projection (L6, "Expression") | **CONTEXTUALIZE** as a governed projection | It is what others see, computed server-side per consent — not a thing the Individual separately maintains. |
| **Evidence (Vault)** | Owner-initiated proof-of-work assets (L3) | **KEEP DISTINCT** + **FUTURE-COMPATIBLE** | A real, distinct object (not hiring docs, not the Directory). External linking is "not live yet" — architect for it, never fake it as complete. |
| **Radar** | The opportunity-monitoring / discovery surface | **KEEP DISTINCT** as an Individual PRIMARY surface; **MERGE** with "Jobs"/"Explore opportunities" | R1-A found "Explore opportunities" and "Jobs" as two nav items for one job. Collapse to one opportunity surface; Radar is its name/spine. |
| **Abhathli (ابحثلي)** | Background "search-for-me" matching assistant | **CONTEXTUALIZE** inside the opportunity surface + **BACKGROUND** | Not a standalone "Ask AI" destination. Task defined once, in context; results surface inside Radar. [R1-A §12] |
| **Lammah (لمّة)** | Plus-tier external-opportunity ingestion/feed | **CONTEXTUALIZE** inside the opportunity surface; **NEEDS D1 EXPERIMENT** on how the tier gate is expressed | Same discovery job, different source and tier. Must lead with what it does, not "Plus-exclusive." [R1-B ex. 23] |
| **Applications** | Status tracking of submitted acts (متقدم view) | **KEEP DISTINCT** as an Individual PRIMARY surface | "Where do I stand" is a top-5 job (I4). Distinct from Opportunities (act) vs. Applications (track). |
| **Assessments** | Evaluation instruments | **CONTEXTUALIZE** inside an opportunity / hiring process | Never persistent nav. Appears when an opportunity or employer process requires it. |
| **Professional Layer** | Governed professional identity / discovery / connection substrate | **CONTEXTUALIZE** as substrate, **NEEDS D1 EXPERIMENT** on how it surfaces without a feed | Preserve (Article 3/8 bans mechanics, not the layer). It is not a destination shaped like LinkedIn's home. |
| **Mentorship / Mentors** | A relationship + mode on the Individual actor | **MERGE CONCEPTUALLY** (the current "Mentorship" + "Mentors" split is one job) + **CONTEXTUALIZE** under the Individual | R1-A: not a fourth actor. Current `/mentor` + `/mentors` route group is IA/implementation debt for D1 to restructure — without designing toward a fourth actor. |

**Employer/University islands** are lighter (less route-level evidence gathered), but the
same rule applies: the org-onboarding fork (claim vs. verification) was itself an
island — one intent, two structurally different paths — now resolved in product by the
shipped correction, and D1 must not reintroduce it. [CURRENT_PRODUCT_TRUTH]

---

## 8. RETURN VALUE

Why each actor comes back — defined as `RETURN TRIGGER` (what brings them),
`RETURN VALUE` (what they get), `USER CONTROL` (how they govern it). Engagement for its
own sake, feed addiction, notification spam, and vanity metrics are rejected outright.
[FOUNDER_DECISION: Article 3/8] [RESEARCH_EVIDENCE: R1-A §13; S15]

### 8.1 Individual

- **Return triggers:** a real status change on something submitted (an application moved,
  a decision landed); a genuinely-matched new opportunity; a mentorship message; a
  meaningful gap in readiness became closeable (a new certificate type is now
  recognized). All **event-driven and specific** — never "you have an update."
- **Return value:** a Career Record that is more useful the longer it's maintained;
  honest visibility into live applications (the thing job seekers say they never get);
  an evolving, accurate answer to "where do I stand." External validation: Eightfold's
  internal career-pathing is used *voluntarily and repeatedly* with no feed mechanic.
  [RESEARCH_EVIDENCE: R1-A §13; S4]
- **User control:** per-purpose, revocable visibility grants; notification channel &
  type control per event type; the ability to see and hide (never fabricate)
  system-derived timeline entries.

### 8.2 Employer

- **Return triggers:** a candidate cleared a stage and needs a decision; a role's
  criteria are met by someone new; an applicant is awaiting a response.
- **Return value:** not "more candidates" — **decision support under volume**. The last
  hiring decision's documented evidence is genuinely useful the next time a similar
  decision comes up. Fewer tools to stitch together. [RESEARCH_EVIDENCE: R1-A §13; S14/S19]
- **User control:** who on the team sees/decides what; whether paid visibility is on for
  a role (with the disclosure that it never distorts matching).

### 8.3 University

- **Return triggers:** coverage on a cohort improved (more graduates declared); an
  outcome shifted; a reporting cycle is approaching; an employer-alignment gap widened.
- **Return value:** outcomes intelligence a program or career-support decision can act
  on, refreshed between reporting cycles — not a once-a-year PDF. [RESEARCH_EVIDENCE:
  R1-A §13; S6/S20]
- **User control:** which views are internal vs. external-facing; how coverage and
  suppression are presented (never hidden).

---

## 9. TRUST MODEL

Per actor: what must be **obvious**, **explainable**, **private**, **consented**, backed
by **methodology**, backed by **provenance/evidence**, and what must **never be inferred
silently**. Synthesizes Articles 2/4/5, R1-A §12/§14, R1-B §11/§13/§22.

### 9.1 Cross-cutting (all actors)

| Dimension | Rule |
|---|---|
| **Obvious** | Whether something is verified vs. self-declared; whose view you are looking at (owner vs. projection); whether an action is reversible. |
| **Explainable** | Every number drillable to its basis; every AI output labeled by register (fact / suggestion / inference / draft); every verification decision carries its reason. |
| **Private by default** | The Individual owns every datum; Evidence Vault is private by default; a non-owner projection is a separate server-computed view, never the owner payload with CSS hiding parts. [FOUNDER_DECISION: Article 5] |
| **Consented** | Every disclosure to any other actor is a named, per-purpose, revocable grant. A generic "share" toggle is insufficient where per-purpose switches already exist. |
| **Never inferred silently** | No score, ranking, "visibility chance," trend arrow, or claim about a person that they did not author or evidence. No consent assumed from silence. No ownership assumed from a domain or name match. |

### 9.2 Individual

- **Obvious:** which parts of my record are verified; who can currently see what; that a
  CV is a dated snapshot, not live.
- **Consent:** per-alma-mater and per-audience visibility, at the granularity that
  already exists.
- **Provenance:** every timeline entry and evidence item shows its origin (system-derived
  vs. authored); authored entries are declaratory, never dressed as more certain than
  they are.
- **Never inferred:** readiness is a reading of what's present/absent, never a hidden
  numeric rank; the graduate–university relationship is declaration-only — no
  university-email verification, ever.

### 9.3 Employer

- **Obvious:** that a workspace is authorized (not that the org "claimed" anything); that
  candidate evidence is the same evidence every candidate is measured against.
- **Explainable / methodology:** any rubric score or fit assessment is drillable to what
  was measured and by whom; a hiring decision's evidence stays attached.
- **Private:** applications, interviews, offers, internal completion state never leak
  into a non-owner payload.
- **Never inferred:** matching never silently ranks people on unmeasured attributes; paid
  visibility never changes match order (and the UI says so plainly).

### 9.4 University

- **Obvious:** the coverage/denominator behind every figure; that "declared this
  university" ≠ "verified/employed."
- **Methodology:** attached to each metric and report, on demand — not a standing
  section, never absent.
- **Provenance:** an individual graduate's record is visible only where a consent grant
  exists; aggregates apply a suppression floor on public surfaces.
- **Never inferred:** no fabricated trend without a real historical snapshot; no
  employment claim the measurement doesn't support.

---

## 10. DATA-TRUTH MODEL

How the experience *behaves* — not just what the copy says — for each information state.
Implements Article 4 and R1-B §12 / Language System §15. [FOUNDER_DECISION +
RESEARCH_EVIDENCE]

| State | Experience behavior | Copy behavior |
|---|---|---|
| **KNOWN** | Render the value **with its basis in the same visual unit** — the denominator rides with the number, not in a footnote. Drillable to its explanation wherever privacy allows. | "Based on {n} of {total} graduates who declared their data, {finding}." |
| **UNKNOWN** | State it plainly as a normal fact. Do **not** show 0, "—", "N/A", or a spinner-forever. Offer the action that would change it if one exists (e.g., "declare your data"). | "Not currently known." |
| **PARTIAL** | Fold into KNOWN — show the fraction inline; never a separate "partial" badge that reads as a defect. The missing portion is named ("no data for the other 28"). | Coverage inside the sentence; missingness named, not hedged. |
| **STALE** | Show the value with its as-of date visibly attached; if a fresher computation is pending, say so. Never present stale as current. | "As of {date}." For CVs: "a version as of {date} — does not update automatically." |
| **SUPPRESSED** (privacy floor) | Render the row/label but not the value, framed as **a rule correctly applied**, not an error or a gap. | "Not shown — sample size too small to display." |
| **NOT APPLICABLE** | The element does not render at all for this context. No empty shell "for consistency." | (nothing) — or, if context demands, "does not apply here." |
| **INSUFFICIENT** (a source exists but is too thin to be honest) | The card/stat does **not render**. It is never replaced by a proxy metric invented on the spot. If context requires acknowledging it: name it. | "No data available for this indicator yet." |
| **NOT YET MEASURED** (mechanism doesn't exist) | `FUTURE_COMPATIBLE_NOT_FAKE_LIVE`: architect the slot, do not present it as live, do not back it with placeholder data or a dead-end destination. | "This indicator has not been measured yet." |

**Governing test:** a card either has real content or it does not render. It is never
"always shown with a fallback." A missing number is more honest than an approximate one.

---

## 11. AI EXPERIENCE MODEL

Where AI belongs in JID, by category. Each JID opportunity is classified, then bounded by:
what AI **may do**, what it **must explain**, what the user **must authorize**, what it
**must never decide**. AI is not reduced to a floating chatbot — a standalone "Ask AI"
destination is rejected. [FOUNDER_DECISION: Article 4] [RESEARCH_EVIDENCE: R1-A §12/§17.6;
R1-B §13–14]

| Category | JID surfaces | AI may… | Must explain | User must authorize | AI must never… |
|---|---|---|---|---|---|
| **A. Contextual assistance** | Readiness gaps; "what would strengthen this application"; form-fill suggestions from the Career Record | Suggest inline, at the moment of use | That it's a suggestion ("اقتراح/نقترح"), and what in the record it's based on | Applying any suggestion that changes the record | Phrase a suggestion as an instruction; act on the record silently |
| **B. Decision support** | Employer candidate summaries; criteria-match explanations | Summarize evidence against criteria; surface what's present/absent | Which evidence maps to which criterion; its own uncertainty | Every step that ends or advances a candidacy — inspectable preview + explicit approval | Rank or score people on unmeasured attributes; auto-advance or auto-reject |
| **C. Drafting** | CV variants; a first-draft role description; a first-draft outreach message | Produce a labeled **draft** ("مسودة") | That it is a draft awaiting human review | Publishing/sending/saving the draft as final | Present a draft as final; send anything itself |
| **D. Discovery** | Abhathli (background opportunity matching); Lammah (external-opportunity ingestion) | Monitor and surface matches inside the surface the user already uses | Why a match surfaced (which criteria); that "وجدنا" = literal found results, not a conclusion about the person | Defining the matching task once (in context); acting on a match | Apply for anything on the user's behalf; imply a match is an endorsement |
| **E. Explanation** | Methodology/coverage plain-language explainers; "why am I seeing this"; verification-status explanations | Restate a real, existing computation in plain Arabic | That it is explaining an existing rule/number, not generating a new one | — (read-only) | Explain a number that has no real source (there is nothing to explain — it shouldn't render) |
| **F. Background organization** | Turning owner-provided unstructured signal into structured Evidence/record entries; de-duplication suggestions | Organize what already exists; propose structure | That it organized existing input; show the before/after | Committing the reorganization | Invent an entry, a skill, a date, or a credential that the input didn't contain |
| **G. Should NOT use AI** | Any score/ranking/"visibility chance"/trend a real system doesn't back; autonomous candidate screening or hiring decisions; the graduate–university relationship; verification approvals | — | — | — | Exist. These are prohibited by Article 4 / the human-authorization rule regardless of whether AI or a human would produce them. |

**Absolute:** no first-person claim of independent knowledge about a person ("I know you
are…"). The honest register is always "based on your data…" / "we inferred…". Every
AI-authored string is visually and lexically distinguishable from human-authored product
copy. [RESEARCH_EVIDENCE: R1-B §14]

---

## 12. PROFESSIONAL LAYER

**Experience purpose** [FOUNDER_DECISION that the layer survives; SYNTHESIS_INFERENCE on
its shape]: the Professional Layer is the **governed substrate** for professional
identity, discovery, and connection — the thing that lets an Individual be *found* and
*connect* for real professional reasons, under their own control. It is not a
destination shaped like a social network's home.

**It may support:**
- **Professional identity** — a governed, consent-scoped projection of the Career Record
  that others can discover (an Individual choosing to be discoverable to employers /
  universities / specific audiences).
- **Governed discovery** — an employer or a mentor finding a relevant person through
  criteria, where the person opted into that visibility.
- **Governed connection** — a declared, consent-governed relationship (graduate ↔
  university; Individual ↔ mentor; Individual ↔ people/orgs they choose), each a named
  grant, each revocable.
- **Contextual professional activity** — activity that is *about* a real professional
  object (a mentorship thread, a declared relationship, an application conversation) —
  never activity whose purpose is visibility itself.

**It must reject** (Article 3/8, zero exceptions): a distribution/engagement feed;
likes, reactions, comments as engagement; follower graphs and follower counts; vanity
popularity or "profile strength" gamification; engagement ranking; attention
optimization; pay-to-win reach.

**Natural intersections** (where D1 should let it show, without a feed):
- **Career Record** — the layer *is* a governed projection of the spine; it never stores
  its own copy.
- **Opportunity** — a governed connection or a mentor relationship can be legitimate
  context for an opportunity match or an introduction.
- **Employer** — governed discovery is how an employer reaches an opted-in candidate
  outside a specific application.
- **Mentorship** — mentorship is one governed-connection *type* on this layer, not a
  parallel system.

**Failure test:** if a Professional Layer surface would still make sense with the
professional objects removed — i.e., it works purely as a place to accumulate audience —
it has become a social network and must be rejected.

---

## 13. CONTENT / REGISTER MODEL

R1-B's register matrix, converted to experience implications. Register **shapes** the
experience; it does not decorate it. The register shifts by **consequence and context**,
not by actor mood — and never slides into government bureaucratic sentence construction
anywhere. [RESEARCH_EVIDENCE: R1-B §1–2, §8, §21; Language System §1–4]

| Context | Register | Experience implication | Failure mode |
|---|---|---|---|
| **Public / brand** | Distinctive Saudi professional voice, every claim checkable | The front door states what JID *is* and for whom, verifiably — one checkable claim per headline. Not a search box over listings. | "بوابتك نحو الفرص" / "gateway to opportunities" — a job-board frame in brand dress [R1-A §16; R1-B §14] |
| **Individual** | Warmer, human, direct, action-oriented; MSA baseline, warmth via word choice not slang | Second-person, names the action + the evidence + the next decision, never a judgment. Routine actions are not over-explained. | "اكتشف إمكاناتك" / "unlock your potential" — an evaluative claim with no measurement [R1-B §20] |
| **Employer** | Precise, professional, decision-oriented | Names role, criteria, evidence, decision as distinct things. No "talent intelligence" / "ذكاء التوظيف" badge words. | Collapsing criteria and candidate evidence into one undifferentiated block [R1-B §16] |
| **University** | Institutional, clear, evidence-oriented, **not** bureaucratic; comfortable stating unknowns | Coverage stated inside the number; "not measured yet" said plainly; مخرجات used only once the capability is real. | A figure with an apologetic caveat appended after it, or a "coming soon" where "not measured yet" is the truth |
| **High-consequence** (verification, consent, legal, Staff decisions, hiring outcomes) | Procedural plainness, Nafath/Qiwa-adjacent — named sequential actions, no cleverness | A verification/consent flow is a script of named actions (request → match/confirm → result); policy explanation lives before or after the step, never inside it. | Legal contingency clauses stacked into an action label (current consent-withdrawal copy) [R1-B §11] |
| **Staff** | Dense, operational, unambiguous, unapologetically internal | Internal vocabulary (`entity`, reconciliation state, approved domains) is fine here and only here. No warmth-signaling. | Warmth or marketing register leaking onto a work queue |
| **AI-generated** | Its own register, always distinguishable by certainty markers | Fact / suggestion / inference / draft each carry their required marker; "وجدنا" reserved for literal search results. | An inference phrased as a discovery ("وجدنا أنك…") |

**The checkable test (R1-B §2, §15):** does the Arabic sentence's structure reveal it was
composed in English first? A sentence that needs its English counterpart to be understood
has already failed, regardless of whether every word is correct Arabic.

**Do not** copy media-editorial style (Thmanyah's register — wrong for an operational
product). **Do not** imitate government sentence construction (adopt the *vocabulary* —
تحقق، حالة، طلب، موافقة، منشأة — not the passive-voice contingency-stacking).

---

## 14. TECHNICAL TRUTH vs USER TRUTH

**Principle (operational):** *technical truth does not require technical copy.* A fact
can be essential to the system's integrity without being something the user needs to read
at the moment of their decision. [RESEARCH_EVIDENCE: R1-B §22]

**The test:** before showing an explanation of *how* the system works, ask — *does the
user have a different action available depending on this explanation?* If no, it belongs
in Staff / engineering / help documentation, not the user-facing sentence. The
user-facing sentence states only the plain consequence that changes their expectation
("review is manual," "you'll be notified," "nothing is published automatically").

| Internal concept | Default | Must be explained when… |
|---|---|---|
| `directory_id` / catalog linkage | Never surfaced. The user has a workspace or a pending request, not a "directory id." | Never to the public actor. Staff only. |
| `reconciliation_state` | Never surfaced as a state name. | The user's timeline/expectation depends on it — expressed as plain status ("under review," "needs more information from you") not the internal token. |
| RLS / authorization mechanics | Never. Privacy is enforced server-side; the user never sees the mechanism. | Never. |
| Ownership mechanics (approve ≠ own; verification vs. ownership as sequential events) | Behind the experience. The user sees "verified," then later "workspace ready." | Only if the user must *do* something between the two events. |
| Domain / name matching | Never narrate the matching mechanism. | State only the plain fact: "a matching domain helps review; it is not automatic approval." Not *how* matching would otherwise work. |
| Verification internals (evidence columns, Staff RPCs) | Staff only. | Never for the applicant — they fill the form the same way regardless. |
| "Authorized/معتمدة workspace" (the qualified form) | Staff/internal-state vocabulary. The org's own user sees plain "the workspace / مساحة العمل." | Staff reconciliation context only. |

**When internal truth MUST surface:** consent decisions (who sees what, for which
purpose, whether reversible — always, before the decision); a status the user is waiting
on (as plain status, not a token); a reason a decision went the way it did (rejection
reason + next step); a required user action ("we need X from you to proceed").

---

## 15. PROGRESSIVE DISCLOSURE

What JID reveals at each level. Not final interaction components — a disclosure policy.
[SYNTHESIS_INFERENCE on R1-A §10.5 + Article 4 + R1-B §22]

| Level | Individual | Employer | University | Staff |
|---|---|---|---|---|
| **IMMEDIATELY** | What needs my attention; where I stand (headline); my next action | Roles needing a decision; what changed | Institutional outcomes headline **with coverage**; what changed | Queue state; what's assigned to me |
| **ON DEMAND** | Full Career Record detail; readiness breakdown; timeline history | Full candidate evidence; decision history | Per-program detail; report builder | Full record/audit detail |
| **IN CONTEXT** | An assessment (inside an opportunity); a CV rendering (inside an export/application); AI rationale (next to the suggestion) | Assessment config (inside a role); AI candidate-summary rationale; paid-visibility disclosure | Methodology / coverage / suppression explanation (next to the metric); a consented graduate record | Reconciliation options (inside a request) |
| **ONLY ADVANCED USERS** | Career Canvas / aspiration mapping; bulk record operations; external evidence linking (future) | Cross-role analytics; API/integrations | Continuous-refresh configuration; cross-cohort comparison | — |
| **ONLY STAFF** | `entity` / directory linkage; reconciliation state names; approved-domains; RLS-level facts; correction-queue internals | (same, for their org's reconciliation) | (same) | All internal vocabulary |

**Rule:** methodology, assessment detail, verification evidence, AI rationale, candidate
evidence, and University missingness are **IN CONTEXT** by default — reachable in one step
from the thing they explain, never a standing top-level section, never buried more than
one step down.

---

## 16. HOME EXPERIENCE MODEL

Not every actor needs a conventional dashboard. Decorative dashboard behavior (card grids
that display data with no implied decision) is rejected. [RESEARCH_EVIDENCE: R1-A §10.5 /
§17.4; S12] Every home must answer: **what needs my attention? what changed? what can I
do? what matters now?**

| Actor | "Home" means | Model | Not |
|---|---|---|---|
| **Individual** | My professional workspace, opened to what needs me | **Personal workspace + next actions**, anchored to the Career Record. Surfaces: attention items (application moved, mentorship reply, closeable readiness gap), recent changes, one clear next action. | A widget grid; a feed; a "profile completeness" bar |
| **Employer** | The decisions waiting on me | **Decision surface / work queue** over active roles: candidates at a decision point, applicants awaiting a response, roles with new criteria matches. | A metrics dashboard; "recruiting funnel" vanity charts |
| **University** | The state of our graduates right now | **Institutional overview** — outcomes headline *with coverage stated*, what changed since last look, coverage gaps that are now closeable, alignment gaps. | An annual-report screen; charts with no drill-path and no implied action |
| **Staff** | My work | **Work queue** — assigned reconciliations/corrections/moderation, by priority. | Anything decorative |

**Synthesis inference:** the Individual and University homes are the two highest-risk
surfaces for reverting to "card soup," because both have a lot of *data* that could be
shown. The discipline is: show it only if it points at a decision or an action, or if it
is the single orienting headline. [SYNTHESIS_INFERENCE]

---

## 17. MOBILE PRINCIPLES

What genuinely changes on mobile — not "desktop squeezed to 375px." [RESEARCH_EVIDENCE:
R1-A S1 (mobile-first for the individual/younger audience); §16 (mobile ≠ shrunken
desktop); R1-B — Saudi mobile-first expectation carried as inference, not verified]

| Job | Mobile stance | Rationale |
|---|---|---|
| **Individual: check status, respond to an opportunity, read/reply to mentorship, add one record entry** | **Mobile-primary** | These are the frequent, short, in-the-moment jobs. Slow/clunky here is read as disrespect. |
| **Individual: full Career Record editing, Career Canvas, comparing CV renderings** | Mobile-**safe**, desktop-comfortable | Longer, considered work — must not be broken on mobile, but density can differ. |
| **Employer: review a candidate, approve/deny a stage, respond to an applicant** | **Mobile-primary for the decision step** | A hiring manager deciding between finalists can do that on a phone if the evidence is legible. |
| **Employer: define a role's criteria, configure an assessment, workspace setup** | Desktop-primary, mobile-safe | Dense setup work; mobile completion possible but not optimized. |
| **University: view outcomes, monitor coverage, see what changed** | **Mobile-primary for viewing** | Leadership checks state on the move. |
| **University: build a report, configure methodology views** | Desktop-primary | Composition work. |
| **Staff: all queues** | Desktop-primary, mobile-safe for triage | Density and keyboard operability are the point. |

**Mobile intent / priority / density / interaction / navigation / forms / tables /
decision tasks:**
- **Intent:** on mobile, the user came to *check* or *respond*, not to *administer*.
  Lead with attention items and status.
- **Density:** one primary thing per view; supporting detail one tap away. Never the
  desktop table verbatim.
- **Forms:** staged short steps (already the org-onboarding pattern), one decision per
  screen, specific-verb CTAs, no front-loaded wizard.
- **Tables / data:** on mobile, a table becomes a prioritized list of records with the
  decision-relevant field surfaced; full table is a deliberate "view as table" action.
- **Decision tasks:** the evidence a decision needs must be legible on a phone (Article
  4's "evidence more legible than the badge" applies doubly here) — if it isn't, the
  decision step stays desktop.
- **Navigation:** no fixed sidebars; no hover-dependent essentials; zero horizontal
  overflow (Constitution Article 7).

---

## 18. DIFFERENTIATION TERRITORIES

Four experience opportunity territories (not visual concepts). For each: `USER PROBLEM`,
`JID ADVANTAGE`, `WHAT MAKES IT DISTINCT`, `WHAT WOULD MAKE IT GO GENERIC`. Derived from
R1-A §14 + R1-B. [SYNTHESIS_INFERENCE grounded in RESEARCH_EVIDENCE]

### T1 — Career evidence as living professional infrastructure

- **User problem:** I re-explain my professional life from zero every time an opportunity
  appears; my history reads as the wrong category; nobody believes what I say I can do.
- **JID advantage:** the Career Record spine + Evidence Vault + governed projections —
  one truth, maintained once, projected many ways, backed by verification.
- **Distinct:** it is *infrastructure that other categories sit downstream of*, not a
  profile page. The record accumulates value the longer it's honestly maintained.
- **Goes generic if:** it becomes a CV builder with a nicer UI; if projections start
  storing their own copies; if "profile completeness" gamification appears.

### T2 — Employer decision surfaces centered on role criteria and evidence

- **User problem:** decision paralysis between finalists; no defensible trail; the same
  candidate re-entered across seven tools.
- **JID advantage:** Role-as-criteria + evidence-against-the-same-criteria + a hiring
  decision that keeps its evidence attached.
- **Distinct:** the unit of work is *the criteria and the evidence*, not the applicant
  list. Structured/auditable is category-standard (Greenhouse); executed through JID's
  evidence model it becomes distinctive.
- **Goes generic if:** it becomes an ATS pipeline board; if criteria and candidate text
  collapse into one blob; if AI starts auto-ranking people.

### T3 — Institutional outcomes intelligence that states its own coverage

- **User problem:** a partial number gets treated as "the number"; a metric with no way
  to see what's behind it; can't act on an annual PDF.
- **JID advantage:** outcomes with coverage/missingness as first-class, drillable,
  refreshed between cycles, connected to a decision.
- **Distinct:** the honesty *is* the product. Cornell/Johns Hopkins/Jisc publish
  caveated dashboards; JID makes the caveat structural and the number actionable.
- **Goes generic if:** it becomes a reporting export; if coverage moves to a footnote; if
  "declared this university" gets silently counted as "employed."

### T4 — Organization onboarding as verification-and-reconciliation, not claim

- **User problem:** "find your entity and submit a claim" made a representative translate
  a database operation back into intent; two onboarding models competing for the same
  screen.
- **JID advantage:** account → verify email → organization details + representative
  verification → internal reconciliation → authorized workspace. The organization proves
  itself; JID reconciles internally; the user never touches the Directory.
- **Distinct:** the internal machinery (directory linkage, reconciliation) is invisible;
  the user experiences proving who they are, then getting a workspace.
- **Goes generic if:** reconciliation state leaks into user copy; if "search for your
  organization" returns in any form; if the applicant is shown the matching mechanism.

### T5 — An Arabic-native professional register that shows evidence before conclusions

- **User problem:** bilingual products that are English-with-Arabic-attached; sentences
  that need their English counterpart to be understood; government-portal stiffness.
- **JID advantage:** register that varies by consequence, built on the trusted vocabulary
  Saudi employment/identity services already use, composed in Arabic first.
- **Distinct:** language *shapes* the experience (named sequential actions in
  high-consequence flows; coverage inside the number; warmth by word choice) rather than
  decorating it.
- **Goes generic if:** one flat register is applied everywhere; if it drifts editorial
  (Thmanyah) on operational surfaces or bureaucratic anywhere; if copy is translated from
  English strings.

---

## 19. STOP

Patterns JID must stop, each supported by research or current-product truth. (Max 15.)

1. **Exposing database/architecture concepts to users** — `entity`, `claim`,
   `directory_id`, reconciliation state, "authorized workspace" as a user phrase. [R1-A
   §10.1/§10.4; R1-B §1/§19]
2. **Turning every capability into a navigation destination** — CV, Timeline,
   Assessments, Mentors, "Explore opportunities" vs "Jobs" as separate items. [R1-A
   §10.2/§11]
3. **Two structurally different paths to the same outcome** — the claim-vs-verification
   onboarding fork. [R1-A §10.1] [CURRENT_PRODUCT_TRUTH: resolved in product, must not
   return]
4. **Card-soup dashboards with no implied decision.** [R1-A §10.5; S12]
5. **Translating the schema's name for a concept instead of describing the user's
   moment.** [R1-B §1]
6. **Any Arabic sentence that needs its English counterpart to be understood.** [R1-B §2]
7. **Legal / bureaucratic register in a UX-microcopy moment** — contingency clauses
   stacked into a consent action label. [R1-B §11/§15]
8. **Fabricated or approximated metrics** — "visibility chance," invented trend arrows,
   unmeasured proficiency bars, a zero/dash/placeholder standing in for absent data.
   [Article 4; R1-A §16]
9. **Vanity / engagement mechanics** — feeds, likes, followers, streaks, "profile
   strength," activity streams. [Article 3/8; S15]
10. **A standalone "Ask AI" chatbot destination** competing for nav space. [R1-A §12/§16]
11. **AI that decides** — auto-advance/auto-reject candidates, auto-apply, silent record
    changes, any score/ranking of people. [Article 4; R1-A §12; S18]
12. **Front-loaded onboarding wizards** that collect every field a workspace will ever
    need in one pass. [R1-A §16; S17]
13. **Excessive enterprise/ATS sidebar density imported onto Individual or public
    surfaces.** [R1-A §16; S1/S17]
14. **Mobile as a shrunken desktop** — a responsive squeeze of a dense layout instead of
    a mobile-considered hierarchy. [R1-A §16; S1]
15. **Narrating an internal safeguard the user can't act on** — telling the applicant how
    domain matching works when their form-filling doesn't change either way. [R1-B §22]

---

## 20. START

Patterns JID must start, actionable at the product-experience / design-system level.
(Max 15.)

1. **Anchor the Individual experience to the Career Record as the persistent center**;
   make CV / Evidence / Timeline / projections *views onto it*. [Article 3; R1-A §11]
2. **Make every home a "what needs my attention / what changed / what can I do"
   surface**, actor-specific, never a shared dashboard template. [R1-A §10.5/§17.4]
3. **Put coverage/denominator inside the number's own visual unit** for every University
   metric. [R1-B §12; Article 4]
4. **Render information states honestly** — "not measured yet," "based on 62 of 90,"
   suppressed-as-a-rule — and let cards disappear cleanly when data is absent. [Article
   4; R1-B §15]
5. **Design verification/consent flows as scripts of named sequential actions**, policy
   before or after, never inside the step. [R1-B §5/§6/§11]
6. **Label every AI output by register** (fact / suggestion / inference / draft) with its
   required marker, visually distinct from human copy. [R1-B §13/§14]
7. **Stage every multi-step flow into short, individually-named steps** with
   specific-verb CTAs. [R1-A §15; R1-B §7/§8]
8. **Compose Arabic first**, from the user's intent, using the trusted Saudi
   employment/identity vocabulary; shift register by consequence. [R1-B §1/§2/§21]
9. **Keep the internal machinery invisible** — surface plain status and plain
   consequences, not tokens or mechanisms. [R1-B §22]
10. **Make role criteria and candidate evidence distinct, named objects** on every
    hiring surface, with every score drillable to what was measured and by whom. [R1-B
    §16; Article 4]
11. **Consolidate the opportunity experience** — one surface, with Abhathli (background)
    and Lammah (Plus source) inside it, not three destinations. [R1-A §10.2]
12. **Consolidate to one command palette / global-search pattern** (Article 7 already
    mandates it; four exist). [R1-A §10.4]
13. **Calibrate information density per actor on purpose** — dense for Staff/recruiter,
    minimal for a first-time Individual or public visitor. [R1-A §15; S7/S8/S21]
14. **Design mobile around "check and respond"** for the Individual and the Employer
    decision step; keep composition work desktop-primary but mobile-safe. [R1-A S1/§16]
15. **Preserve the Professional Layer as a governed substrate** (identity, discovery,
    connection) surfaced through real professional objects — never a feed. [Article
    3/8; R1-A §14/§19]

---

## 21. PROTECT

Existing product principles that must survive the redesign. A "modern redesign" that
breaks any of these has failed. [FOUNDER_DECISION / Constitution]

1. **Actor separation** — exactly three public actors (Individual, Employer, University);
   Mentorship is a capability on the Individual; Staff/Super Admin are internal.
2. **Directory ≠ owned Profile** — reference data (registry grammar) vs. self-authored
   identity (immersion grammar), never blurred; no direct write path to a Directory row
   for organizations.
3. **The Career Record spine doctrine** — one fact lives in exactly one place; everything
   else references, never copies.
4. **The data-truth doctrine** — no number/badge/claim without a real, traceable,
   currently-existing source; cards disappear cleanly; every number drillable.
5. **The privacy constitution** — owner owns every datum; enforcement on the read path,
   server-side; every disclosure a specific, revocable, per-purpose grant; separate
   server-computed projections, never client-hidden owner payloads.
6. **The anti-feed constitution** — zero social-network mechanics on individual-facing
   surfaces, ever.
7. **Human authorization** — verification and AI both stop short of consequential
   decisions; approve ≠ own; no autonomous screening.
8. **Declaration-only graduate–university relationship** — no university-email
   verification, no mandatory attestation queues, ever.
9. **University aggregation honesty** — coverage/missingness first-class; suppression
   floors on public aggregates; "declared" ≠ "verified/employed."
10. **Arabic-first as structural default** — equal-depth bilingual content; zero
    letter-spacing on Arabic; Latin digits; RTL as a structural default, not a skin.
11. **The terminology lock** — فرصة (not وظيفة as default); الملف التعريفي; أنشئ (not
    استلم/claim); عادي/بلس tiers; the graduate relationship as إعلان/ارتباط.
12. **Zero-document hiring pipeline** — applications carry no files; Evidence Vault is a
    different, owner-governed thing and must not leak into hiring.

---

## 22. FINAL EXPERIENCE PRINCIPLES

Twelve. Each merges an R1-A experience principle with an R1-B language principle. Each is
specific enough to audit a future screen against. Format: **Principle — Why — Design
implication — Content implication — Failure example.**

### P1. One spine, many views, never two truths
- **Why:** the product "feels like multiple products joined together" because facts are
  duplicated across surfaces; the spine doctrine is constitutional. [R1-A §1/§11; Article
  3]
- **Design:** the Career Record is the persistent center of the Individual experience;
  CV, Timeline, Evidence, projections, readiness all *reference* it. Employer/University
  see governed projections, never a copy.
- **Content:** a fact is phrased once, at its home; elsewhere it is cited ("from your
  Career Record"), never re-stated as if independently known.
- **Failure:** a "CV" nav item that becomes a second place to edit your history; a
  timeline card that stores its own copy of a job title.

### P2. Evidence is more legible than the badge that stands for it
- **Why:** the highest-trust B2B category (fintech) wins on showing the real number, not
  a badge; Article 4 requires drillability. [R1-A §17.2; S8]
- **Design:** any score/status/conclusion is visually secondary to, and one tap from, its
  evidence. On mobile the evidence a decision needs must be legible on the phone.
- **Content:** name what was measured and by whom next to any evaluative statement; no
  bare adjective or score.
- **Failure:** a candidate "fit: strong" pill with no attached breakdown; a readiness
  percentage with no "what's behind this."

### P3. A missing number is more honest than an approximate one
- **Why:** users distrust unexplained numbers more than honestly absent ones; established
  university-reporting practice states coverage. [R1-A §17.7; S2/S20; R1-B §12]
- **Design:** absent data → the card does not render (no zero, no placeholder). Partial
  data → coverage inside the number's unit. Suppressed → shown as a rule correctly
  applied.
- **Content:** "not measured yet" / "based on 62 of 90" / "not shown — sample too small"
  as plain statements, never caveats appended after the figure.
- **Failure:** a "0%" employment rate that actually means "no data"; a "coming soon" over
  a metric that has no measurement mechanism.

### P4. One path per relationship, staged, never duplicated
- **Why:** two onboarding models competing for the same screen was the single largest
  stated-vs-shipped gap. [R1-A §10.1] [Founder org-onboarding decision]
- **Design:** account → verify email → organization details + representative verification
  → internal reconciliation → authorized workspace, as named short steps. No claim path,
  no directory search, anywhere.
- **Content:** each step titled for what it is ("تفاصيل جهة التوظيف," "طلب التحقق من صفة
  الممثل"); no مطالبة/claim vocabulary; "جهة توظيف" before the workspace, "منشأة"
  operationally after.
- **Failure:** a "find your organization" search reappearing; a "reapply to your claim"
  screen.

### P5. Home answers "what needs me now," never "what data do we have"
- **Why:** dashboards fail from undifferentiated clutter, not missing features. [R1-A
  §10.5/§17.4; S12]
- **Design:** each actor's home leads with attention items, recent changes, and one clear
  next action — actor-specific model (personal workspace / decision surface /
  institutional overview / work queue), never a shared template.
- **Content:** attention items are specific ("your application to X moved to under
  review"), never "you have 3 updates."
- **Failure:** a 12-widget card grid; a "profile 60% complete" bar as the hero.

### P6. Density is chosen per actor, on purpose
- **Why:** dense is right for Staff/recruiter workflows; a first-time graduate needs the
  opposite; both are legitimate strategies. [R1-A §17.5; S7/S8/S21]
- **Design:** Staff/employer-power surfaces get dense, keyboard-capable layouts; the
  Individual and public surfaces default to focus + recede, not more information.
- **Content:** Staff copy is dense and internal; Individual copy is warm, direct, and
  omits the obvious.
- **Failure:** an ATS-grade sidebar on the Individual home; a sparse, hand-holding layout
  on the Staff reconciliation queue.

### P7. AI drafts, explains, discovers, and organizes — it never quietly decides
- **Why:** trust in AI rises when it explains and stages, falls when it's a black box;
  consequential people-facing actions need a visible human-approved step. [R1-A §17.6;
  S2/S18; R1-B §14]
- **Design:** consequential AI actions get an inspectable preview + explicit
  authorization; only low-stakes reversible actions apply automatically and visibly; AI
  is contextual, never a standalone destination.
- **Content:** every AI string carries its register marker (اقتراح / يبدو أن / مسودة);
  "وجدنا" only for literal results; never "I know you…".
- **Failure:** an "AI shortlisted these 5" with no rationale and no undo; a floating
  chatbot as a nav item.

### P8. No mechanic exists whose only job is to keep someone there
- **Why:** anti-feed is constitutional and zero-exception; even the category's reference
  platform is retreating from vanity metrics. [Article 3/8; S15]
- **Design:** every recurring-use surface is justified by compounding utility; return is
  driven by real, specific events, not by a feed or a counter.
- **Content:** notifications name the specific change and the one available action, never
  "come back and see what's new."
- **Failure:** a "recent activity" stream; a streak; a follower count anywhere.

### P9. Composed in Arabic, register by consequence
- **Why:** translationese is the copy-level version of the same schema-first failure;
  register must shift by consequence, never flat, never bureaucratic. [R1-B §1/§2/§21]
- **Design:** high-consequence flows (verification/consent/legal/Staff/hiring outcomes)
  are procedural-plain scripts; Individual surfaces are warmer; the public front door
  carries a distinctive but checkable voice.
- **Content:** write from intent, not from an English string; use the trusted Saudi
  vocabulary; one checkable claim per marketing headline.
- **Failure:** a verification step written in editorial voice; an Individual empty state
  written like a government notice; a hero line that's a job-board frame in Arabic dress.

### P10. Technical truth stays behind the experience
- **Why:** the engineering team's need to reason about a boundary was mistaken for the
  user's need to read about it. [R1-B §22]
- **Design:** surface plain status and plain consequences; keep mechanisms, state tokens,
  and linkage in Staff/help docs.
- **Content:** "review is manual"; "nothing is published automatically" — not "a name or
  domain match does not grant access."
- **Failure:** "your reconciliation_state is pending_review"; narrating the matching
  algorithm to an applicant.

### P11. Consent is specific, revocable, and never inferred from silence
- **Why:** the single most important engineering rule; a generic toggle is insufficient
  where per-purpose switches exist. [Article 5; R1-B §11]
- **Design:** every disclosure moment states who sees what, for which purpose, and
  whether it can be undone — *before* the decision, at the granularity that already
  exists.
- **Content:** "you can withdraw this from settings" (a checkable fact), not "you may be
  able to change this later."
- **Failure:** one "share my data" switch governing multiple audiences; consent assumed
  because the user didn't object.

### P12. Flexibility needs a floor
- **Why:** a structure as flexible as the seven-layer profile (or a university's many
  programs, an employer's many role types) reads as an empty canvas without opinionated
  defaults. [R1-A §17.10; S11]
- **Design:** every multi-story surface ships with a strong guided first-run and
  opinionated defaults; the blank state is never "add sections."
- **Content:** the first-run path names concrete first actions ("add your most recent
  role"), not "customize your profile."
- **Failure:** a new Individual dropped onto an empty seven-panel builder; a new
  University shown an empty report canvas.

---

## 23. DEFINITION OF MODERN JID

"Modern / new-generation" translated into measurable qualities. The Founder does **not**
want generic SaaS modernization. For each: what good looks like / what fake modernity
looks like. [SYNTHESIS_INFERENCE grounded in R1-A §15/§17, R1-B §1, S7/S8]

| Quality | What good looks like | What fake modernity looks like |
|---|---|---|
| **Orientation speed** | Each actor knows what/attention/changed/next in one read | A beautiful hero that says nothing actionable |
| **Hierarchy** | Focus/recede — current task in full detail, orientation recedes | Everything the same weight in a card grid; or key info hidden behind extra clicks |
| **Continuity** | State, position, and request-status persist across sessions and devices | "Start over" every visit; losing form progress |
| **Purposeful density** | Dense where the user is a professional doing volume work; spare where they're not | One uniform density platform-wide; ATS density on a graduate's home |
| **Contextual actions** | The action appears where the object is (assess inside an opportunity) | A global toolbar of actions divorced from context; deep menu-diving |
| **Progressive disclosure** | Methodology / rationale / evidence one step from what they explain | A standing "Methodology" mega-section; or no way to see behind a number |
| **Native Arabic behavior** | Composed-in-Arabic rhythm; register by consequence; RTL structural; mixed-script where genuinely technical | Translated strings; flat register; RTL as a mirrored afterthought; letter-spacing on Arabic |
| **Evidence legibility** | The evidence behind any claim is easy to find and read, on any device | Badges and pills standing in for the evidence |
| **Low-form friction** | Staged short steps, specific-verb CTAs, ask once | A 20-field wizard; "متابعة" on every button |
| **Purposeful motion** | Motion clarifies state change; `prefers-reduced-motion` respected | Decorative animation; motion as "polish" with no informational job |
| **Trust surface** | Verified vs. declared is obvious; whose view you see is obvious; reversibility is stated | Trust implied by visual polish alone; ambiguous data provenance |
| **AI restraint** | AI is contextual, labeled, inspectable, human-authorized | An "AI" badge on everything; a chatbot bolted to the corner |
| **Mobile intent** | Check-and-respond jobs are first-class on the phone | Desktop layout squeezed; decision evidence unreadable on mobile |
| **Honest emptiness** | "Not measured yet" / "not available" said plainly; cards disappear cleanly | Zeros, dashes, "coming soon," fake empty destinations |

---

## 24. OPEN ISSUES / CLASSIFICATION

Every open issue reviewed and classified: `ALREADY DECIDED` / `DESIGN DECISION` /
`ENGINEERING DECISION` / `GENUINE FOUNDER DECISION`. The Founder is not asked to decide
anything already settled.

### 24.1 Already decided (do not reopen)

- Three public actors; Mentorship as an Individual-layered capability. [Constitution;
  R1-A §3]
- The product claim model is rejected; public claim/search onboarding is removed.
  [Founder decision; shipped `2d234d5`]
- Organization onboarding sequence: account → verify email → org details + representative
  verification → internal reconciliation → authorized workspace. [Founder decision]
- Anti-feed constitution; data-truth doctrine; privacy constitution; Directory ≠ Profile;
  Career Record spine; declaration-only graduate relationship; terminology lock.
  [Constitution]
- AI is assistive, explainable, human-authorized (mechanism: tiered approval by
  reversibility). [Constitution Article 4; R1-A]
- Register varies by consequence; MSA baseline; trusted Saudi vocabulary. [R1-B / R1-B.1]

### 24.2 Design decisions (D1 owns)

- Exact navigation architecture for each actor (this file gives hierarchy, not nav).
- The concrete home model per actor (personal workspace / decision surface /
  institutional overview / work queue — shapes given, not laid out).
- Global search vs. contextual actions vs. command palette — where each applies, and
  which actors get a command palette (Staff yes; public/Individual only if behavior
  supports it).
- Information density per actor, concretely.
- Mobile navigation pattern.
- How object relationships are presented so the product reads as one system.
- How Radar / Abhathli / Lammah compose into one opportunity surface (`NEEDS D1
  EXPERIMENT`).
- How the Professional Layer surfaces (identity/discovery/connection) without a feed
  (`NEEDS D1 EXPERIMENT`).
- Whether a public "Mentors" directory and the organization "Directory/Catalog" read to
  users as the same kind of browsable reference list or genuinely different (R1-A §18
  open design item).
- How the `/mentor` + `/mentors` route group is restructured under the Individual actor
  (without designing toward a fourth actor).

### 24.3 Engineering decisions (implementation planning owns)

- Depth of legacy claim-model DB retirement (UI/gating layer vs. fuller schema
  migration) — choose the smallest coherent architecture that removes the public claim
  dependency without weakening any security/data contract. [R1-A §18]
- Retiring the residual `claimed_by` / `entity_state` machinery still gating jobs,
  applications, screening, billing, comms (31+ migrations). [R1-A §10.1]
- Removing `commitment_score` from the 5 historical migrations that still carry it. [R1-A
  §1]
- Consolidating the four command-palette implementations into the one Article 7
  mandates. [R1-A §10.4]
- Sweeping the residual claim-adjacent copy the org-onboarding commit didn't touch:
  Staff command-palette "المطالبات," Staff dashboard "ملكية" framing, the public
  unclaimed-listing "do you represent this organization?" prompt, "مطالبة" in Edge
  Function email templates, "entity" wording in the Staff checklist. [R1-B ex. 16/17/34;
  closeout doc P2/P3]
- Moving 200+ hardcoded Arabic strings into the i18n system. [R1-A §10.4]

### 24.4 Genuine Founder decisions (materially different valid directions research
cannot resolve)

- **How prominent the paid tier (بلس / Plus) is in the Individual experience.** Two
  materially different business/product-rights directions remain valid: (a) Plus features
  (e.g., Lammah external opportunities) are visible but understated, keeping the
  Individual experience feeling equitable and infrastructure-like; (b) Plus is a
  first-class, consistently-surfaced upgrade path. Research establishes the *constraints*
  (no pay-to-win visibility, no distortion of matching, every claim checkable) but not
  the *commercial posture*. This is a Founder call. [GENUINE_FOUNDER_DECISION]

Beyond this, R1-C did not surface a genuine unresolved Founder product-direction
decision. The most significant remaining *knowledge* gap — how Saudi younger
professionals specifically differ from the global Gen-Z evidence base — is a **research
gap to close with targeted primary user research**, not a Founder decision, and R1-A/R1-B
both flag it honestly as `DESIGN HYPOTHESIS TO TEST`.

### 24.5 Legacy claim retirement status

```
PRODUCT_CLAIM_MODEL            = REJECTED            [Founder decision; Constitution Article 2/8]
PUBLIC_CLAIM_ONBOARDING        = REMOVED             [shipped: 2d234d5b5..., closeout 60cdb54...]
LEGACY_DB_CLAIM_RETIREMENT     = PARALLEL_ENGINEERING_WORK / IN PROGRESS
                                 (branch: integration/retire-legacy-org-claim-model)
                                 Remaining: residual claimed_by/entity_state gating in 31+ migrations;
                                 commitment_score in 5 historical migrations; Staff "Claims queue"
                                 vs "Verification requests" duplication; claim-adjacent copy in
                                 Staff palette / Staff dashboard / public unclaimed-listing prompt /
                                 Edge Function email templates; four command-palette implementations.
```

D1 must **not** design around `claimed_by` / `entity_state`, must **not** treat legacy DB
names as product concepts, and must **not** reopen claim-based onboarding. Legacy claim
retirement is recorded here only as an implementation dependency for future execution.

### 24.6 R1-C targeted verifications

**None performed.** No contradiction between R1-A, R1-B, R1-B.1, and current product
truth required a narrow verification to resolve. The inputs were internally consistent
once the org-onboarding correction was read as current product truth (R1-B.1 had already
reconciled against it). The one substantive knowledge gap (Saudi younger-professional
language/behavior) is out of scope for a synthesis phase and is explicitly carried
forward as a hypothesis, per R1-A §18 and R1-B §7/§20.

---

## QUALITY TEST (self-check, not self-approval)

1. **Could D1 reconstruct a coherent product from this file + the D1 Design Input if
   every current screen disappeared?** Yes — actor mental models, object model, primary
   jobs, hierarchy, home models, and 12 auditable principles define the product
   independent of current routes.
2. **Would that product still unmistakably be JID?** Yes — the Career Record spine,
   Directory ≠ Profile, data-truth doctrine, anti-feed, consent-governed visibility,
   University coverage honesty, verification-not-claim onboarding, and Arabic-native
   register are all load-bearing and preserved.
3. **Are Individual, Employer, University clearly different experiences within one
   system?** Yes — three distinct mental models, three distinct home models, three
   distinct registers, sharing one object model and one set of principles.
4. **Is the product organized around user jobs, not database/routes?** Yes — Parts 3, 5,
   6, 7 all explicitly re-derive from intent and mark current route/feature names as
   non-authoritative.
5. **Does Saudi language shape the experience rather than decorate it?** Yes — Part 13
   ties register to consequence and to concrete experience behavior (named-action
   scripts, coverage-inside-the-number, technical-truth-behind-the-experience).
6. **Is JID differentiated from LinkedIn / ATS / job board / government portal?** Yes —
   Part 18's five territories each name what would make it collapse into one of those.
7. **Are AI, evidence, privacy, and data truth integrated structurally?** Yes — Parts 9,
   10, 11, and principles P2/P3/P7/P10/P11, not as an appendix.
8. **Can a future design be objectively rejected for violating the thesis?** Yes — Part 2
   clauses and Part 22 principles each carry a failure example.

**Status: `SYNTHESIS_COMPLETE`.** Not `DESIGN_APPROVED`, not `UX_APPROVED`, not
`FOUNDER_ACCEPTED`. Founder and design acceptance happen later.

---

*End of R1-C Experience & Content Thesis. No product code, database, migration,
`messages/*.json`, component, route, or design token was changed to produce this
document. No screens were designed. Companion file: `R1C_D1_DESIGN_INPUT.md`.*
