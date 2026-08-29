# WAVE 6 — EVIDENCE ARCHITECTURE (DRAFT)

**Status:** DRAFT — Phase A. Every foreign key into the hiring model is **provisional**
until `WAVE_5_HIRING_CONTRACT_FROZEN <SHA>` lands and this document is reconciled (Phase B
step 3). Names marked `‹w5›` are owned by Wave 5 and must not be redefined here.

**Date:** 2026-08-29 · **Base:** `c51d7d3`

---

## 0. Philosophy (non-negotiable)

```
ROLE ‹w5›
  → CRITERIA ‹w5-owned identity, w6-extended with evidence spec›
    → EVIDENCE (what is requested / what is found)
      → METHOD (screening | work sample | structured interview | reference | …)
        → RUBRIC (anchored, criterion+method scoped, employer-defined, versioned)
          → OBSERVATION (an evaluator records what the evidence shows)
            → RATING (observation mapped to one rubric anchor, by a named human)
              → HUMAN DECISION ‹w5 Outcome› (consequential; never automated)
```

Invariants:

1. **No universal score.** No `candidate.score`, no match %, no cross-role/-criterion
   aggregate presented as objective truth. A rating exists **only** as
   `(evaluator, application ‹w5›, criterion ‹w5›, method, rubric_version, anchor)`.
2. **Observation ≠ rating ≠ decision.** Three distinct records; never collapsed.
3. **Missing evidence is a state, not a failure.** `evidence_found = false` is recordable
   and never auto-maps to a negative anchor.
4. **Human authority is structural.** Consequential transitions (`‹w5› Outcome`) require a
   human actor id and cannot be produced by a job, trigger, or AI call.
5. **Immutable history.** Observations, ratings, and rubric versions are append-only.
   Corrections append a superseding record with reason; nothing is edited in place or
   hard-deleted.
6. **Contextual to ROLE + CRITERION + METHOD** — always. No portable "JID competency truth"
   without a separately approved framework (not in Wave 6).

---

## 1. Dependency surface — what Wave 6 needs FROM Wave 5

Wave 6 will consume these. If Wave 5 names or shapes them differently, Wave 6 adapts to
Wave 5 (never the reverse). Listed as the **minimum interface Wave 6 requires**:

| # | Interface Wave 6 needs | Why | If absent in W5 contract |
| --- | --- | --- | --- |
| D1 | `‹w5›` **Application** identity — stable id, tenant/owner anchor (`business_profile_id`), candidate (`applicant_id` / profile), job/role link | Every observation, submission, scorecard FKs to an application | BLOCKER — do not implement |
| D2 | `‹w5›` **Hiring Role** identity — stable id scoped to an owned employer profile | Criteria and rubrics are defined per role | BLOCKER |
| D3 | `‹w5›` **Hiring Criteria** — id, role link, name (AR/EN), definition text; whether criteria are ordered/weighted is W5's call | Wave 6 attaches evidence-spec + method + rubric to each criterion | BLOCKER for criterion-scoped evidence; Wave 6 could fall back to free criteria it owns only if W5 explicitly has none (documented conflict) |
| D4 | `‹w5›` **Hiring Stage** — the pipeline node model (screening / assessment / interview / decision), stage id per application | Screening, work samples, and interviews are *conducted within a stage* | BLOCKER for stage-attached evidence; degrade to application-level attachment |
| D5 | `‹w5›` **Outcome** — the decision object + allowed transitions + who may make them | Wave 6 renders evidence *for* a decision and writes a decision-support record, never the decision | BLOCKER — Wave 6 must not create an Outcome type |
| D6 | `‹w5›` **Employer membership / evaluator identity** — how multiple humans belong to one employer profile with roles (owner / recruiter / hiring-manager / interviewer / viewer) | Evaluator authorization, interviewer assignment, independent inputs, "evaluator accountability" all require named non-owner actors | HIGH RISK if absent. Wave 6 needs *some* membership model. If W5 has none, this becomes a documented conflict and a candidate Wave 6-owned `hiring_collaborators` table scoped strictly under `business_profile_id` — proposed to Wave 5, not shipped unilaterally. |
| D7 | `‹w5›` disclosure/authorization linkage for employer access to candidate-submitted material | Reuse Wave 2 `disclosure_authorizations`; Wave 6 must know which authorization backs a given application | BLOCKER for anything touching candidate Career Record; work-sample submissions created *for* the employer are lower-sensitivity and Wave 6 can own their consent record |

**Ancestry check (Phase B step 2):** confirm the Wave 5 contract SHA is an ancestor of, or
cleanly mergeable into, `claude/wave6-hiring-evidence`'s base; record the exact merge base.

---

## 2. Wave 6 namespace

All Wave 6 tables use the prefix **`assessment_`** (the method layer) and **`scorecard_`**
(the rating layer), plus **`work_sample_`**. Rationale: `hiring_*` and `application_*` are
Wave 5 territory; `career_evidence*` is Wave 2 candidate-owned territory. Keeping a distinct
prefix makes the ownership boundary unambiguous in RLS, audit `entity_type`, and grep.

TypeScript contracts live in `src/lib/assessment/**` (`server-only`). Enums mirror DB
exactly.

---

## 3. Data model (DRAFT tables)

> All tables: `id uuid pk`, `created_at`, `updated_at`, RLS enabled, `anon` denied,
> staff via `is_privileged_staff()`, tenant scoping via `business_profile_id` resolved
> through the `‹w5›` application/role. Append-only tables omit `UPDATE`/`DELETE` policies
> entirely for non-staff.

### 3.1 Rubric layer (employer-defined, versioned, immutable)

**`assessment_rubric`**
| col | type | notes |
| --- | --- | --- |
| `business_profile_id` | uuid → business_profiles | owner tenant |
| `role_ref` | jsonb reference `{type:'hiring_role', id}` ‹w5› | provisional until D2 |
| `criterion_ref` | jsonb reference ‹w5› | provisional until D3 |
| `method` | `assessment_method_enum` | `SCREENING | WORK_SAMPLE | STRUCTURED_INTERVIEW | REFERENCE_CHECK | PORTFOLIO_REVIEW` |
| `name_ar` / `name_en` | text | criterion-as-scored label |
| `current_version_id` | uuid → assessment_rubric_version | advanced only via successor RPC |
| `state` | `DRAFT | ACTIVE | RETIRED` | RETIRED keeps history |

**`assessment_rubric_version`** (append-only)
| col | type | notes |
| --- | --- | --- |
| `rubric_id` | uuid → assessment_rubric | |
| `supersedes_version_id` | uuid null | successor lineage |
| `scale_points` | int | e.g. 3 or 5; employer choice |
| `created_by` | uuid | human |
| `rubric_ref` | jsonb | `private.jid_is_reference_json` guarded |

**`assessment_rubric_anchor`** (append-only, child of version)
| col | type | notes |
| --- | --- | --- |
| `version_id` | uuid → assessment_rubric_version | |
| `point` | int | 1..scale_points |
| `descriptor_ar` / `descriptor_en` | text | behavioral, evidence-referenced, level-distinct (BARS method) |

*Pattern source:* IMS CASE `CFRubric / CFRubricCriterion / CFRubricCriterionLevel`;
immutability via the Wave 2 `advance_*_policy` successor pattern.

### 3.2 Method layer

**`assessment_plan`** — an interview/screening plan for a role
| `business_profile_id`, `role_ref ‹w5›`, `method`, `name_*`, `state` |

**`assessment_plan_item`** — criterion ↔ question/prompt mapping (append-only per version)
| `plan_id`, `criterion_ref ‹w5›`, `rubric_id → assessment_rubric`, `prompt_ar/en`,
`is_core boolean` (consistent core vs optional follow-up), `sort_order` |

**`work_sample_task`**
| `business_profile_id`, `role_ref ‹w5›`, `title_*`, `instructions_*`, `expected_evidence_*`,
`rubric_id`, `time_box_minutes int null`, `state` |
No proctoring fields. No camera/mic/keystroke columns — ever.

**`work_sample_submission`** (append-only; candidate-facing)
| `task_id`, `application_ref ‹w5›`, `submitted_by` (candidate profile), `submitted_at`,
`artifact_refs jsonb` (URLs / repo links / uploaded file refs), `candidate_note_*`,
`consent_ref jsonb` (candidate acknowledged the task terms), `status` (`ASSIGNED | SUBMITTED | WITHDRAWN | EXPIRED`) |
Candidate may withdraw a submission (candidate rights). Deadline lapse → `EXPIRED`, never
auto-scored.

**`assessment_session`** — one conducted instance of a plan/interview
| `plan_id`, `application_ref ‹w5›`, `stage_ref ‹w5›`, `scheduled_at null`,
`conducted_at null`, `status` (`PLANNED | CONDUCTED | CANCELLED`), `interviewer_refs jsonb`
(evaluator ids — from D6) |

### 3.3 Observation → rating layer (append-only, the core)

**`assessment_observation`**
| col | notes |
| --- | --- |
| `source` | `SCREENING | WORK_SAMPLE | INTERVIEW_SESSION | REFERENCE` |
| `source_ref` | jsonb → the submission / session / screening record |
| `application_ref ‹w5›`, `criterion_ref ‹w5›`, `method` | context triple |
| `evaluator_id` | uuid — named human (D6) |
| `evidence_requested_ref` | jsonb null → plan_item / task expected evidence |
| `evidence_found` | boolean | **false is valid and terminal-neutral** |
| `note_ar` / `note_en` | text | free-text observation (what the evidence shows) |
| `attachments` | jsonb | links to submission artifacts / transcript excerpts the evaluator cites |
| `supersedes_observation_id` | uuid null | corrections append |
| `recorded_at` | timestamptz | |

**`scorecard_rating`** (append-only)
| col | notes |
| --- | --- |
| `observation_id` | uuid → assessment_observation | a rating **must** cite an observation |
| `rubric_version_id` | uuid → assessment_rubric_version | the exact version used |
| `anchor_point` | int null | the chosen anchor; NULL = "insufficient evidence to rate" (explicit, allowed) |
| `evaluator_id` | uuid | same human as the observation, normally |
| `rationale_ar` / `rationale_en` | text | why this anchor, referencing the observation |
| `supersedes_rating_id` | uuid null | |
| `rated_at` | timestamptz | |

**`scorecard`** — a per-evaluator, per-application collation (a view/rollup, minimal state)
| `application_ref ‹w5›`, `evaluator_id`, `stage_ref ‹w5›`, `state`
(`IN_PROGRESS | SUBMITTED`), `submitted_at null` |
On `SUBMITTED`: the set of `scorecard_rating` ids is frozen into an immutable snapshot
(`create_*_snapshot` pattern). Other evaluators' scorecards are **not visible before your
own is submitted** (independence — pattern from FreeATS, standard structured-hiring rule).

### 3.4 Decision-support layer (NOT the decision)

**`assessment_decision_support`** (append-only, generated on request)
| `application_ref ‹w5›`, `stage_ref ‹w5›`, `requested_by` (human),
`inputs_snapshot jsonb` (which scorecards/observations were in scope),
`summary_ar/en` (evidence summary — may be AI-drafted, see §5),
`missing_evidence jsonb`, `inconsistencies jsonb` (conflicting evaluator evidence flagged),
`generated_at` |
This record **never** contains a recommended Outcome value that the system would apply. It
is read by a human who then acts in the `‹w5›` Outcome model.

### 3.5 Audit

Every consequential event (`rubric version advanced`, `scorecard submitted`, `observation
superseded`, `work sample assigned/submitted/withdrawn`, `decision support generated`,
`evaluator assigned`) writes `public._write_audit_log(evaluator, 'assessment.<event>',
'<table>', id, old, new, meta, null, null)`. Audit rows are the retention-compliant
evaluation record (EEOC ≥1yr / 2yr federal-contractor analog; JID retention policy ref).

---

## 4. Authorization & isolation (RLS sketch)

| Actor | Can |
| --- | --- |
| Employer **owner** (`business_profiles.owner_user_id`) | full CRUD on rubrics/plans/tasks for own profile; read all scorecards on own applications *after* they are submitted, or always if `‹w5›` role permits |
| Employer **evaluator/interviewer** (D6 membership) | read plans/rubrics for assigned role; create own observations/ratings; read/submit **own** scorecard; **cannot** read peers' unsubmitted scorecards; cannot edit rubrics |
| Employer **viewer** (D6) | read submitted scorecards + decision support; no writes |
| **Candidate** (`applicant_id`) | read own assigned `work_sample_task` + own `work_sample_submission`; create/withdraw own submission; **no** access to observations, ratings, scorecards, rubrics, decision support |
| **Another business** | nothing — hard tenant isolation via `business_profile_id` |
| **Individual / public / anon** | nothing |
| **Staff** (`is_privileged_staff()`) | read for governance; writes only through audited staff RPCs |

RLS negatives to test explicitly: cross-business read of rubric/observation/scorecard;
evaluator reading peer unsubmitted scorecard; candidate reading any evaluation row;
candidate reading another candidate's task/submission; unauthenticated read of any table;
evaluator of role A rating an application for role B; owner of business B mutating business
A's rubric.

Tenant resolution is always **derived** (`application_ref → ‹w5› → business_profile_id`),
never trusted from the client.

---

## 5. AI authority boundary

| AI **may** (assistive, logged, human-triggered) | AI **may not** |
| --- | --- |
| Summarize observations/evidence for a stage | Emit or apply an Outcome / recommendation the system acts on |
| Identify missing requested evidence | Score a human as universal truth |
| Organize / cluster evaluator notes | Infer personality, traits, protected attributes |
| Compare an observation's text to the explicit rubric anchor descriptors and show which anchor language it matches | Auto-write a `scorecard_rating.anchor_point` |
| Draft interview questions **from approved criteria** for human review | Reject or hire |
| Flag inconsistent evaluator evidence across scorecards | Modify/delete an observation or rating; fabricate notes |
| Prepare an interviewer briefing pack | Override evaluator input; rank candidates by a hidden model |
| Explain *why* a decision-support summary was generated (inputs, method) | Make any consequential external decision |

Mechanics: AI output lands only in `assessment_decision_support.summary_*` /
`missing_evidence` / `inconsistencies`, or as a *draft* question in `assessment_plan_item`
pending human `is_core`/publish. Every AI call writes an audit row with the model ref and
the human requester. No DB trigger or cron invokes a model. `scorecard_rating` INSERT
requires `auth.uid() = evaluator_id` (a human session), enforced in RLS + RPC.

---

## 6. Privacy & fairness analysis (design, not a legal claim)

| Principle | Wave 6 design response |
| --- | --- |
| **Data minimization** | Observations store evaluator judgement + cited artifacts, not raw candidate PII copies. Work-sample submissions store artifact *references*. No new copy of Career Record. |
| **Purpose limitation** | Employer access to candidate-disclosed material rides existing `disclosure_authorizations` (`recipient_type=BUSINESS`, purpose bound). Wave 6 never widens an authorization. |
| **Candidate rights** | Candidate sees and can withdraw own work-sample submissions; task terms + consent recorded. Evaluation deliberations are employer working product (not candidate-facing) — consistent with the coarse `applications` model today; any candidate-facing disclosure of ratings is a deliberate later decision, not a default. |
| **Retention** | Ratings/observations/scorecard snapshots carry a `retention_policy_ref`; audit log is the durable defensible record. Deletion is governed (append-only + policy), never ad hoc. |
| **Explainability** | Every rating → observation → cited evidence → rubric anchor is a walkable chain. Decision support states its inputs. |
| **Evaluator accountability** | `evaluator_id` on every observation/rating; append-only corrections with reason; audit trail. |
| **Protected-attribute inference** | No field, enum, or AI task infers age, gender, ethnicity, disability, nationality, religion, marital/family status, or proxies. Screening cannot infer "experience not present". |
| **Accessibility** | AR/EN, RTL/LTR, keyboard, semantic landmarks on all Wave 6 surfaces; rubric descriptors localized. |
| **Consistent method** | Core questions (`is_core`) are the same across candidates for a role/plan version; rubric version is pinned per rating so comparisons are like-for-like. |
| **Evidence-based comparison** | Comparison view aligns candidates by `(criterion, method, rubric version)` showing anchors + observations side by side — never a summed ranking. |
| **Adverse-impact posture** | Structured method is itself the mitigation (research: structured interviews d≈0.23 vs ≈0.56). Wave 6 does not compute adverse-impact statistics (that is hiring intelligence — Wave 8) but records the structured evidence that makes such analysis possible later. |

**No compliance claim.** Wave 6 documents design intent toward PDPL (KSA) / GDPR-style
principles and US structured-hiring guidance; it does not assert legal compliance, which
requires separate verified review.

---

## 7. Product surface (Wave 6, minimal)

- Employer: rubric builder (criterion + method + anchors), interview/screening plan builder,
  work-sample task builder, "conduct" surfaces (screening checklist, interview evidence
  capture, work-sample review), my-scorecard, submitted-scorecards comparison, decision-support
  panel (read → act in Wave 5 Outcome UI).
- Candidate: assigned work-sample task view + submission + withdraw.
- All within `src/app/[locale]/…`; employer surfaces under the Wave 5 hiring workspace shell.

---

## 8. Out of scope (Wave 7+, do not build)

Recorded-interview capture/storage/playback, transcription pipelines, external assessment
*providers*/vendors and provider gating, specialist psychometric instruments, assessment
*orchestration* engine (multi-stage automation), talent sourcing, cross-company benchmarking,
adverse-impact analytics, any candidate score product.

---

## 9. Open questions for Phase B reconciliation

1. Does Wave 5 model **Hiring Stage** as a graph, a list, or just an enum on Application?
   (Shapes D4 and where sessions/screening attach.)
2. Does Wave 5 provide **evaluator membership** (D6) or only single-owner? Determines
   whether Wave 6 proposes `hiring_collaborators` to Wave 5.
3. Are **Hiring Criteria** weighted/ordered in Wave 5? Wave 6 stays neutral (no weighting in
   ratings) but the comparison view layout follows Wave 5's criterion ordering.
4. Does Wave 5's **Outcome** model already have a "decision support / notes" slot Wave 6
   should write into, or does Wave 6 own `assessment_decision_support` standalone?
5. Wave 5 disclosure linkage (D7): is there an `application ↔ disclosure_authorization`
   pointer, or must Wave 6 resolve it?
6. Naming: if Wave 5 uses `hiring_*`/`evaluation_*` for anything, confirm no collision with
   `assessment_*` / `scorecard_*`.

Reconciliation output goes into `WAVE_6_EVIDENCE_CONTRACT.md` at closure.
