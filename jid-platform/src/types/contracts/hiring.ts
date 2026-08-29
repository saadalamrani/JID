/** Wave 5 frozen hiring workflow contract. Keep changes additive after freeze. */
export const HIRING_STAGE_KINDS = [
  'APPLIED',
  'REVIEW',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'CLOSED',
] as const
export type HiringStageKind = (typeof HIRING_STAGE_KINDS)[number]

export const CANDIDATE_VISIBLE_STATUSES = [
  'SUBMITTED',
  'IN_REVIEW',
  'ACTION_REQUIRED',
  'INTERVIEW',
  'OFFER',
  'NOT_SELECTED',
  'HIRED',
  'WITHDRAWN',
] as const
export type CandidateVisibleStatus = (typeof CANDIDATE_VISIBLE_STATUSES)[number]

export const HIRING_OUTCOMES = [
  'HIRED',
  'NOT_SELECTED',
  'WITHDRAWN',
  'ROLE_CANCELLED',
] as const
export type HiringOutcome = (typeof HIRING_OUTCOMES)[number]

export const HIRING_AUDIT_EVENT_TYPES = [
  'APPLICATION_SUBMITTED',
  'STAGE_TRANSITIONED',
  'CANDIDATE_STATUS_CHANGED',
  'OUTCOME_RECORDED',
  'APPLICATION_WITHDRAWN',
  'NOTE_ADDED',
  'EVIDENCE_ATTACHED',
] as const
export type HiringAuditEventType = (typeof HIRING_AUDIT_EVENT_TYPES)[number]

export const HIRING_EVIDENCE_KINDS = [
  'SCREENING_RESPONSE',
  'WORK_SAMPLE',
  'INTERVIEW_OBSERVATION',
  'RUBRIC_OBSERVATION',
  'SCORECARD',
  'ASSESSMENT_RESULT',
] as const
export type HiringEvidenceKind = (typeof HIRING_EVIDENCE_KINDS)[number]

export type HiringCriteriaDefinition = {
  id: string
  hiringRoleId: string
  labelAr: string
  labelEn: string
  descriptionAr?: string
  descriptionEn?: string
  evidenceKinds: HiringEvidenceKind[]
  required: boolean
  sortOrder: number
}

export type HiringStageDefinition = {
  id: string
  hiringRoleId: string
  kind: HiringStageKind
  labelAr: string
  labelEn: string
  candidateVisibleStatus: CandidateVisibleStatus
  sortOrder: number
  terminal: boolean
}

export type HiringEvidenceAttachmentRef = {
  applicationId: string
  criterionId?: string
  stageId?: string
  kind: HiringEvidenceKind
  evidenceRecordId: string
  recordedBy: string
  recordedAt: string
}

/** External Lammah tracking never becomes an employer-owned application. */
export type ApplicationOrigin = 'JID_NATIVE' | 'EXTERNAL_TRACKED'
