# WAVE 6 — HIRING EVIDENCE CONTRACT

**Status:** FROZEN (interface); implementation `IMPLEMENTED_IN_BRANCH`, remote apply
held on Wave 5 P1. Additive to the Wave 5 frozen hiring contract
(`../wave-5/WAVE_5_HIRING_CONTRACT.md`, checkpoint `70cbc30`).
**Freeze date:** 2026-08-29 (Asia/Riyadh)
**Branch:** `claude/wave6-hiring-evidence`

Wave 6 does not redefine Application, Applicant, Hiring Role, Hiring Criteria, Hiring
Stage, Outcome, or team authority. It defines the evidence *records* that
`hiring_evidence_attachments.evidence_record_id` points at, plus the anchored rubric
model and read-only comparison / decision-support shapes.

---

## 1. Canonical chain

```
ROLE ‹w5›  →  CRITERION ‹w5›  →  EVIDENCE  →  METHOD  →  RUBRIC  →  OBSERVATION  →  RATING  →  HUMAN DECISION ‹w5 Outcome›
```

Method ∈ `structured_screening | work_sample | structured_interview | reference_check | portfolio_review`
(`public.assessment_method_enum`). TypeScript: `ASSESSMENT_METHODS` in
`src/types/contracts/hiring-evidence.ts`.

---

## 2. Invariants (binding)

| # | Invariant | Enforced by |
| --- | --- | --- |
| I1 | No universal candidate score, match %, culture-fit, personality, rank, or hidden model ranking. | No aggregate column exists; `assertNoAggregate()`; contract tests; RLS has no such view |
| I2 | A rating exists only as `(evaluator, observation, rubric_version, anchor_point)`; never an aggregate. | `hiring_scorecard_ratings` shape; `record_hiring_rating` |
| I3 | Observation ≠ rating ≠ decision — three distinct records. | Separate tables; distinct RPCs |
| I4 | `evidence_found = false` and `anchor_point = null` ("insufficient evidence to rate") are valid, non-negative states. | `NOT NULL` on `evidence_found` with explicit false; nullable `anchor_point`; RPC rejects null `evidence_found` |
| I5 | Rubric versions, observations, ratings, decision-support are append-only; corrections append a superseding row with reason. | No `UPDATE`/`DELETE` RLS policy for non-service actors; `supersedes_*` columns; `publish_hiring_rubric_version` |
| I6 | Consequential decisions live only in the Wave 5 Outcome model, recorded by an accountable human. | `hiring_assessment_decision_support` has **no** outcome column; no Wave 6 RPC writes `applications.outcome` |
| I7 | Evidence contextual to ROLE + CRITERION + METHOD. | `hiring_rubrics` UNIQUE `(criterion_id, method)`; observation carries all three |
| I8 | No protected-attribute inference; screening cannot infer absent experience. | No such field/enum; AI forbidden-action list; review gate |
| I9 | Work samples carry no proctoring / camera / microphone / keystroke / plagiarism-verdict data. | No such columns; migration header prohibition |
| I10 | Evaluator independence: a peer sees another evaluator's evidence only after that evaluator's scorecard for the `(application, stage)` is `submitted`. Owner/hiring_admin may read anytime. | `hiring_evidence_peer_visible()`; `canSeePeerEvidence()` |

---

## 3. Tables (all `public`, RLS enabled, `anon` denied)

### 3.1 Anchored rubrics — `20260830120000_wave6_hiring_evidence_rubrics.sql`

| Table | Key columns | Notes |
| --- | --- | --- |
| `hiring_rubrics` | `hiring_role_id`→`hiring_roles`, `criterion_id`→`hiring_criteria`, `method`, `name_ar/en`, `state(draft/active/retired)`, `current_version_id` | UNIQUE `(criterion_id, method)` |
| `hiring_rubric_versions` | `rubric_id`, `supersedes_version_id`, `scale_points ∈ {3,4,5}`, `created_by` | append-only |
| `hiring_rubric_anchors` | `version_id`, `point ≥ 1`, `descriptor_ar/en` | UNIQUE `(version_id, point)`; append-only; BARS descriptors |

RPC `publish_hiring_rubric_version(p_rubric_id, p_scale_points, p_anchors jsonb)` → appends a
version + its anchors atomically, advances `current_version_id`, requires exactly
`scale_points` anchors covering `1..scale_points`, audits.

### 3.2 Method layer — `20260830120100_wave6_hiring_evidence_methods.sql`

| Table | Purpose |
| --- | --- |
| `hiring_assessment_plans` | screening checklist / interview plan per role + method |
| `hiring_assessment_plan_items` | criterion ↔ prompt map; `is_core`; `rubric_id`; `draft_state(human_authored/ai_drafted/human_approved)` |
| `hiring_work_sample_tasks` | employer-defined task; `instructions_*`, `expected_evidence_*`, `time_box_minutes`; no proctoring |
| `hiring_work_sample_submissions` | candidate response; `state(assigned/submitted/withdrawn/expired)`, `artifact_refs jsonb`, `consent jsonb`; UNIQUE `(task_id, application_id)` |
| `hiring_assessment_sessions` | one conducted interview/screening instance; `interviewer_refs jsonb` |

RPCs: `assign_work_sample` (employer), `submit_work_sample` / `withdraw_work_sample`
(candidate — the applicant owns write; deadline lapse → `expired`, never a rating).

### 3.3 Observation → rating → scorecard → decision support — `20260830120200_wave6_hiring_evidence_observations.sql`

| Table | Key columns |
| --- | --- |
| `hiring_observations` | `source`, `source_table/id`, `application_id`, `criterion_id`, `method`, `evaluator_id`, `stage_id?`, `evidence_found bool`, `note_ar/en`, `citations jsonb`, `supersedes_observation_id?` — append-only |
| `hiring_scorecard_ratings` | `observation_id`, `rubric_version_id`, `anchor_point int?`, `evaluator_id`, `rationale_ar/en`, `supersedes_rating_id?` — append-only |
| `hiring_scorecards` | `application_id`, `stage_id?`, `evaluator_id`, `state(in_progress/submitted)`, `frozen_rating_ids jsonb` — UNIQUE `(application_id, stage_id, evaluator_id)` |
| `hiring_assessment_decision_support` | `application_id`, `stage_id?`, `requested_by`, `inputs_snapshot jsonb`, `summary_ar/en`, `missing_evidence jsonb`, `inconsistencies jsonb`, `ai_assist_ref jsonb?` — append-only, **no outcome column** |

RPCs: `record_hiring_observation` (also writes an idempotent `hiring_evidence_attachments`
row), `record_hiring_rating`, `submit_hiring_scorecard` (freezes `frozen_rating_ids`),
`generate_hiring_decision_support` (human `requested_by`; no outcome parameter).

---

## 4. Authorization

| Helper | Grants |
| --- | --- |
| `can_access_hiring_workspace(bp, false)` ‹w5› | read: owner ∪ any active member ∪ staff |
| `can_access_hiring_workspace(bp, true)` ‹w5› | config write: owner ∪ {hiring_admin, recruiter} ∪ staff |
| `can_manage_hiring_team(bp)` ‹w5› | team admin + calibration read: owner ∪ hiring_admin ∪ staff |
| `can_record_hiring_evidence(bp)` **‹w6, additive›** | record observations/ratings: owner ∪ {hiring_admin, recruiter, interviewer} ∪ staff |
| `hiring_evidence_peer_visible(app, stage, evaluator)` **‹w6›** | peer read of an evaluator's evidence — self always; owner/hiring_admin always; others only after that evaluator's scorecard `submitted` |

Tenant is always derived: `record → hiring_roles.business_profile_id`. Candidates have **no**
access to rubrics, plans, observations, ratings, scorecards, or decision support; their only
write surface is their own `hiring_work_sample_submissions` row via RPC.

---

## 5. AI authority (`AI_PERMITTED_ACTIONS` / `AI_FORBIDDEN_ACTIONS`)

**May** (human-triggered, audited, output only to `hiring_assessment_decision_support.*` or
`plan_item.prompt` with `draft_state = ai_drafted`): summarize evidence, identify missing
evidence, organize notes, compare an observation to explicit anchor descriptors, draft
questions from approved criteria, flag inconsistent evaluator evidence, prepare interviewer
briefing, explain a recommendation's provenance.

**May not**: score a human as truth, infer personality/protected attributes, reject, hire,
modify/delete evidence, fabricate notes, override an evaluator, rank by a hidden model, make
a consequential external decision. `checkAiAction()` fails closed on anything unlisted and on
any call without a human requester. No DB trigger or cron invokes a model.

---

## 6. Binary outcomes

| Token | State | Evidence |
| --- | --- | --- |
| `STRUCTURED_SCREENING` | IMPLEMENTED_IN_BRANCH | `hiring_assessment_plans/items` (method `structured_screening`), `record_hiring_observation` |
| `WORK_SAMPLES` | IMPLEMENTED_IN_BRANCH | `hiring_work_sample_tasks/submissions` + assign/submit/withdraw RPCs; no proctoring |
| `STRUCTURED_INTERVIEWS` | IMPLEMENTED_IN_BRANCH | plans/items/`is_core`, `hiring_assessment_sessions`, observation→rating separation |
| `ANCHORED_RUBRICS` | IMPLEMENTED_IN_BRANCH | `hiring_rubrics/versions/anchors` + `publish_hiring_rubric_version` + `validateRubricAnchors` |
| `SCORECARDS` | IMPLEMENTED_IN_BRANCH | `hiring_scorecards` + `submit_hiring_scorecard` freeze; independence gate |
| `EVIDENCE_COMPARISON` | IMPLEMENTED_IN_BRANCH | `buildEvidenceComparisonGrid` (no aggregation) |
| `HIRING_EVIDENCE` (auditability) | IMPLEMENTED_IN_BRANCH | append-only tables + `_write_audit_log` on every consequential event |
| `HUMAN_DECISION_AUTHORITY` | VERIFIED (static/tests) | no Wave 6 path writes `applications.outcome`; decision-support has no outcome column; AI boundary tests green |

`P0 = NONE` · `P1 = held on Wave 5` · `PRODUCTION_TOUCHED = NO`

---

## 7. Change control

Post-freeze changes to this contract must be additive or explicitly versioned. The Wave 6
migration files must not be applied to `jid-nonprod` until Wave 5's final integration lineage
exists, the migration lane is reconciled, one independent RLS/schema review passes, and a
disposable PG17 replay is green (see `WAVE_6_CLOSEOUT_REPORT.md`).