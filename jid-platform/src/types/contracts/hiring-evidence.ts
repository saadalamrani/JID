/**
 * Wave 6 — Hiring Evidence contract (ADDITIVE to the Wave 5 frozen hiring contract).
 *
 * Wave 5 (`./hiring.ts`) owns Application, Applicant, Hiring Role, Hiring Criteria,
 * Hiring Stage, Outcome, team authority, and the `hiring_evidence_attachments` pointer
 * table. Wave 6 does NOT redefine any of those. Wave 6 defines the evidence *records*
 * that `HiringEvidenceAttachmentRef.evidenceRecordId` points at, plus the anchored
 * rubric model and the read-only comparison / decision-support shapes.
 *
 * Philosophy (non-negotiable):
 *   ROLE -> CRITERION -> EVIDENCE -> METHOD -> RUBRIC -> OBSERVATION -> RATING -> HUMAN DECISION
 *
 * Invariants encoded here:
 *  - No universal candidate score. A rating exists only as
 *    (evaluator, application, criterion, method, rubricVersion, anchorPoint).
 *  - Observation, rating, and decision are three distinct records; never collapsed.
 *  - `evidenceFound === false` and `anchorPoint === null` ("insufficient evidence to
 *    rate") are valid, first-class, non-negative states.
 *  - Rubric versions and observations/ratings are append-only. Corrections append a
 *    superseding record with a reason; nothing is edited in place.
 *  - Consequential decisions live in the Wave 5 Outcome model. Wave 6 only produces
 *    decision *support*, always attributed to a human requester.
 */

import type { HiringEvidenceKind } from './hiring'

/* -------------------------------------------------------------------------- */
/* Method + rubric vocabulary                                                 */
/* -------------------------------------------------------------------------- */

/** How a criterion is examined. Scopes rubrics and observations. */
export const ASSESSMENT_METHODS = [
  'STRUCTURED_SCREENING',
  'WORK_SAMPLE',
  'STRUCTURED_INTERVIEW',
  'REFERENCE_CHECK',
  'PORTFOLIO_REVIEW',
] as const
export type AssessmentMethod = (typeof ASSESSMENT_METHODS)[number]

/**
 * Maps a Wave 6 method to the Wave 5 `HIRING_EVIDENCE_KINDS` value used when the
 * resulting record is attached via `hiring_evidence_attachments`. Kept explicit so the
 * Wave 5 CHECK constraint list stays the single source of truth for attachment kinds.
 */
export const METHOD_TO_EVIDENCE_KIND: Readonly<Record<AssessmentMethod, HiringEvidenceKind>> = {
  STRUCTURED_SCREENING: 'SCREENING_RESPONSE',
  WORK_SAMPLE: 'WORK_SAMPLE',
  STRUCTURED_INTERVIEW: 'INTERVIEW_OBSERVATION',
  REFERENCE_CHECK: 'ASSESSMENT_RESULT',
  PORTFOLIO_REVIEW: 'RUBRIC_OBSERVATION',
} as const

export const RUBRIC_STATES = ['DRAFT', 'ACTIVE', 'RETIRED'] as const
export type RubricState = (typeof RUBRIC_STATES)[number]

/** Employer-chosen scale size. Small, odd scales keep anchors distinguishable. */
export const RUBRIC_SCALE_POINTS = [3, 4, 5] as const
export type RubricScalePoints = (typeof RUBRIC_SCALE_POINTS)[number]

/* -------------------------------------------------------------------------- */
/* Anchored rubric                                                            */
/* -------------------------------------------------------------------------- */

/**
 * An anchored rubric is scoped to exactly one (hiring role, criterion, method). Its
 * meaning is carried by its current version's anchors. Employers define job-specific
 * criteria; JID does not ship a universal competency framework.
 */
export type HiringRubric = {
  id: string
  hiringRoleId: string
  /** Wave 5 `hiring_criteria.id`. */
  criterionId: string
  method: AssessmentMethod
  nameAr: string
  nameEn: string
  state: RubricState
  currentVersionId: string | null
  createdAt: string
  updatedAt: string
}

/** Append-only. A change publishes a new version that supersedes its predecessor. */
export type HiringRubricVersion = {
  id: string
  rubricId: string
  supersedesVersionId: string | null
  scalePoints: RubricScalePoints
  createdBy: string
  createdAt: string
}

/**
 * One behaviorally-anchored level. Descriptors are behavioral, evidence-referenced, and
 * level-distinct (BARS method). `point` runs 1..scalePoints; higher is "more/stronger
 * evidence of the required behavior", never "a better person".
 */
export type HiringRubricAnchor = {
  id: string
  versionId: string
  point: number
  descriptorAr: string
  descriptorEn: string
}

export type HiringRubricWithAnchors = HiringRubricVersion & {
  anchors: readonly HiringRubricAnchor[]
}

/* -------------------------------------------------------------------------- */
/* Method layer — plans, questions, screening items, work-sample tasks         */
/* -------------------------------------------------------------------------- */

export const PLAN_STATES = ['DRAFT', 'ACTIVE', 'RETIRED'] as const
export type PlanState = (typeof PLAN_STATES)[number]

/** A reusable screening checklist or interview plan for one role + method. */
export type AssessmentPlan = {
  id: string
  hiringRoleId: string
  method: Extract<AssessmentMethod, 'STRUCTURED_SCREENING' | 'STRUCTURED_INTERVIEW'>
  nameAr: string
  nameEn: string
  state: PlanState
  createdBy: string
  createdAt: string
  updatedAt: string
}

/**
 * A criterion <-> prompt mapping inside a plan. `isCore` prompts are asked of every
 * candidate for consistency; non-core prompts are optional follow-ups. Each item may
 * pin the rubric used to rate the resulting observation.
 */
export type AssessmentPlanItem = {
  id: string
  planId: string
  /** Wave 5 `hiring_criteria.id`. */
  criterionId: string
  rubricId: string | null
  promptAr: string
  promptEn: string
  /** Evidence the employer expects this prompt to surface. Never a required "pass" gate. */
  expectedEvidenceAr: string | null
  expectedEvidenceEn: string | null
  isCore: boolean
  sortOrder: number
  /** AI-drafted prompts land here until a human publishes them. */
  draftState: 'HUMAN_AUTHORED' | 'AI_DRAFTED' | 'HUMAN_APPROVED'
}

export const WORK_SAMPLE_TASK_STATES = ['DRAFT', 'ACTIVE', 'RETIRED'] as const
export type WorkSampleTaskState = (typeof WORK_SAMPLE_TASK_STATES)[number]

/**
 * An employer-defined work sample. No proctoring, camera, microphone, keystroke, or
 * plagiarism-verdict fields exist or may be added. `timeBoxMinutes` is guidance a
 * candidate sees, not an enforced lockout.
 */
export type WorkSampleTask = {
  id: string
  hiringRoleId: string
  criterionId: string | null
  rubricId: string | null
  titleAr: string
  titleEn: string
  instructionsAr: string
  instructionsEn: string
  expectedEvidenceAr: string | null
  expectedEvidenceEn: string | null
  timeBoxMinutes: number | null
  state: WorkSampleTaskState
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const WORK_SAMPLE_SUBMISSION_STATES = [
  'ASSIGNED',
  'SUBMITTED',
  'WITHDRAWN',
  'EXPIRED',
] as const
export type WorkSampleSubmissionState = (typeof WORK_SAMPLE_SUBMISSION_STATES)[number]

/**
 * A candidate's response to an assigned task. Candidate-facing and candidate-owned for
 * write: the candidate may submit and may withdraw. Deadline lapse -> `EXPIRED`, never
 * an automatic negative rating.
 */
export type WorkSampleSubmission = {
  id: string
  taskId: string
  /** Wave 5 `applications.id`. */
  applicationId: string
  submittedBy: string
  assignedAt: string
  dueAt: string | null
  submittedAt: string | null
  state: WorkSampleSubmissionState
  /** URLs / repo links / uploaded-file references. No inline candidate documents copied. */
  artifactRefs: readonly { label: string; href: string }[]
  candidateNoteAr: string | null
  candidateNoteEn: string | null
  /** Candidate acknowledged the task terms before starting. */
  consentRef: { acknowledgedAt: string; termsRef: string } | null
}

export const ASSESSMENT_SESSION_STATES = ['PLANNED', 'CONDUCTED', 'CANCELLED'] as const
export type AssessmentSessionState = (typeof ASSESSMENT_SESSION_STATES)[number]

/** One conducted instance of an interview/screening plan for one application. */
export type AssessmentSession = {
  id: string
  planId: string
  applicationId: string
  /** Wave 5 `hiring_stages.id` this session belongs to. */
  stageId: string | null
  state: AssessmentSessionState
  scheduledAt: string | null
  conductedAt: string | null
  /** Evaluator user ids assigned to conduct/observe. */
  interviewerRefs: readonly string[]
  createdBy: string
  createdAt: string
}

/* -------------------------------------------------------------------------- */
/* Observation -> rating layer (append-only, the core)                         */
/* -------------------------------------------------------------------------- */

export const OBSERVATION_SOURCES = [
  'STRUCTURED_SCREENING',
  'WORK_SAMPLE',
  'INTERVIEW_SESSION',
  'REFERENCE_CHECK',
] as const
export type ObservationSource = (typeof OBSERVATION_SOURCES)[number]

/**
 * What one evaluator recorded that one piece of evidence shows, against one criterion,
 * via one method. Append-only. `evidenceFound === false` is terminal-neutral.
 */
export type HiringObservation = {
  id: string
  source: ObservationSource
  /** Points at the screening response / submission / session that produced this. */
  sourceRef: { table: string; id: string }
  applicationId: string
  criterionId: string
  method: AssessmentMethod
  evaluatorId: string
  planItemId: string | null
  workSampleTaskId: string | null
  evidenceRequestedAr: string | null
  evidenceRequestedEn: string | null
  evidenceFound: boolean
  noteAr: string | null
  noteEn: string | null
  /** Links to the exact artifacts / transcript excerpts the evaluator cites. */
  citations: readonly { label: string; href: string }[]
  supersedesObservationId: string | null
  recordedAt: string
}

/**
 * An evaluator's mapping of ONE observation to ONE rubric anchor. A rating cannot exist
 * without an observation. `anchorPoint === null` means "insufficient evidence to rate"
 * and is explicit and allowed. There is no aggregate across ratings.
 */
export type HiringScorecardRating = {
  id: string
  observationId: string
  rubricVersionId: string
  anchorPoint: number | null
  evaluatorId: string
  rationaleAr: string | null
  rationaleEn: string | null
  supersedesRatingId: string | null
  ratedAt: string
}

export const SCORECARD_STATES = ['IN_PROGRESS', 'SUBMITTED'] as const
export type ScorecardState = (typeof SCORECARD_STATES)[number]

/**
 * A per-evaluator, per-application collation for one stage. Before your own scorecard is
 * `SUBMITTED` you cannot see other evaluators' unsubmitted scorecards (independence).
 * On submit, the set of rating ids is frozen into an immutable snapshot.
 */
export type HiringScorecard = {
  id: string
  applicationId: string
  stageId: string | null
  evaluatorId: string
  state: ScorecardState
  submittedAt: string | null
  /** Frozen rating id set, populated on submit. */
  frozenRatingIds: readonly string[] | null
  createdAt: string
}

/* -------------------------------------------------------------------------- */
/* Read-only comparison + decision support (NOT a decision)                    */
/* -------------------------------------------------------------------------- */

/** One cell of the comparison grid: an application's evidence for one criterion+method. */
export type EvidenceComparisonCell = {
  applicationId: string
  criterionId: string
  method: AssessmentMethod
  rubricVersionId: string | null
  /** Distinct submitted anchor points from distinct evaluators. NOT summed or averaged. */
  submittedAnchorPoints: readonly (number | null)[]
  observationCount: number
  evidenceFoundCount: number
  evidenceMissingCount: number
}

export type EvidenceComparisonRow = {
  applicationId: string
  applicantRef: string
  cells: readonly EvidenceComparisonCell[]
}

/**
 * Column ordering follows Wave 5 `hiring_criteria.sortOrder`. The grid never renders a
 * per-application total, rank, or recommendation.
 */
export type EvidenceComparisonGrid = {
  hiringRoleId: string
  stageId: string | null
  criteria: readonly { criterionId: string; labelAr: string; labelEn: string }[]
  rows: readonly EvidenceComparisonRow[]
}

/**
 * Human-requested, append-only. May contain AI-drafted prose in the summary/flags, but
 * NEVER a recommended `HiringOutcome` the system would apply. A human reads this, then
 * acts in the Wave 5 Outcome model.
 */
export type AssessmentDecisionSupport = {
  id: string
  applicationId: string
  stageId: string | null
  requestedBy: string
  /** Which scorecards / observations were in scope when generated. */
  inputsSnapshot: {
    scorecardIds: readonly string[]
    observationIds: readonly string[]
  }
  summaryAr: string | null
  summaryEn: string | null
  missingEvidence: readonly {
    criterionId: string
    method: AssessmentMethod
    detailEn: string
    detailAr: string
  }[]
  inconsistencies: readonly {
    criterionId: string
    detailEn: string
    detailAr: string
    evaluatorIds: readonly string[]
  }[]
  /** Model + prompt identity when any field was AI-assisted. Null when fully human. */
  aiAssistRef: { modelRef: string; generatedAt: string } | null
  generatedAt: string
}

/* -------------------------------------------------------------------------- */
/* AI authority boundary (enumerated, enforced in services + RLS + RPC)        */
/* -------------------------------------------------------------------------- */

export const AI_PERMITTED_ACTIONS = [
  'SUMMARIZE_EVIDENCE',
  'IDENTIFY_MISSING_EVIDENCE',
  'ORGANIZE_NOTES',
  'COMPARE_OBSERVATION_TO_ANCHORS',
  'DRAFT_QUESTIONS_FROM_CRITERIA',
  'FLAG_INCONSISTENT_EVIDENCE',
  'PREPARE_INTERVIEWER_BRIEFING',
  'EXPLAIN_RECOMMENDATION_PROVENANCE',
] as const
export type AiPermittedAction = (typeof AI_PERMITTED_ACTIONS)[number]

export const AI_FORBIDDEN_ACTIONS = [
  'SCORE_HUMAN_AS_TRUTH',
  'INFER_PERSONALITY',
  'INFER_PROTECTED_ATTRIBUTE',
  'REJECT_CANDIDATE',
  'HIRE_CANDIDATE',
  'MODIFY_OR_DELETE_EVIDENCE',
  'FABRICATE_NOTES',
  'OVERRIDE_EVALUATOR_INPUT',
  'RANK_BY_HIDDEN_MODEL',
  'MAKE_CONSEQUENTIAL_EXTERNAL_DECISION',
] as const
export type AiForbiddenAction = (typeof AI_FORBIDDEN_ACTIONS)[number]

/** Where AI output is allowed to be written. Anything else is a boundary violation. */
export const AI_WRITABLE_TARGETS = [
  'assessment_decision_support.summary',
  'assessment_decision_support.missing_evidence',
  'assessment_decision_support.inconsistencies',
  'assessment_plan_item.prompt(draftState=AI_DRAFTED)',
] as const
export type AiWritableTarget = (typeof AI_WRITABLE_TARGETS)[number]
