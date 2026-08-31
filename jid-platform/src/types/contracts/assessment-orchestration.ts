export const ASSESSMENT_ASSIGNMENT_STATES = [
  'invited', 'ready', 'started', 'completed', 'expired', 'withdrawn',
  'cancelled', 'technical_failure', 'provider_failure',
] as const

export type AssessmentAssignmentState = (typeof ASSESSMENT_ASSIGNMENT_STATES)[number]
export type AssessmentAction =
  | 'consent' | 'start' | 'complete' | 'withdraw' | 'cancel'
  | 'technical_failure' | 'provider_failure'

export const FAILURE_STATES: readonly AssessmentAssignmentState[] = [
  'technical_failure', 'provider_failure',
]

export function isCandidateNegativeEvidence(_state: AssessmentAssignmentState): boolean {
  return false
}

export function maySetHiringOutcomeFromAssessment(): false {
  return false
}


