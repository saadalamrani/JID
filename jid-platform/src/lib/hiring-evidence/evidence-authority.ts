import {
  AI_FORBIDDEN_ACTIONS,
  AI_PERMITTED_ACTIONS,
  type AiForbiddenAction,
  type AiPermittedAction,
} from '@/types/contracts/hiring-evidence'

/**
 * Pure authorization helpers for Wave 6 hiring evidence. These mirror the SQL
 * functions `can_record_hiring_evidence`, `can_access_hiring_workspace`, and
 * `hiring_evidence_peer_visible` so server routes can pre-check and return
 * consistent messages. The database RLS remains the enforcement boundary.
 */

/** Wave 5 hiring team roles (lowercase, matching `hiring_team_role_enum`). */
export type HiringTeamRole = 'owner' | 'hiring_admin' | 'recruiter' | 'interviewer' | 'viewer'

export type HiringEvidenceViewer = {
  userId: string
  isStaff: boolean
  /** The viewer's active membership role in the owning business profile, if any. */
  teamRole: HiringTeamRole | null
  /** True when the viewer is the owner_user_id of the owning business profile. */
  isProfileOwner: boolean
}

/** Roles allowed to record observations/ratings (adds interviewer to the write tier). */
const EVIDENCE_RECORDING_ROLES: readonly HiringTeamRole[] = [
  'owner',
  'hiring_admin',
  'recruiter',
  'interviewer',
]

/** Roles allowed to administer rubric/plan config and team membership. */
const WORKSPACE_WRITE_ROLES: readonly HiringTeamRole[] = ['owner', 'hiring_admin', 'recruiter']

/** Roles allowed to read every evaluator's evidence for calibration. */
const CALIBRATION_ROLES: readonly HiringTeamRole[] = ['owner', 'hiring_admin']

export function canReadHiringWorkspace(viewer: HiringEvidenceViewer): boolean {
  return viewer.isStaff || viewer.isProfileOwner || viewer.teamRole !== null
}

export function canWriteHiringWorkspace(viewer: HiringEvidenceViewer): boolean {
  if (viewer.isStaff || viewer.isProfileOwner) return true
  return viewer.teamRole !== null && WORKSPACE_WRITE_ROLES.includes(viewer.teamRole)
}

export function canRecordHiringEvidence(viewer: HiringEvidenceViewer): boolean {
  if (viewer.isStaff || viewer.isProfileOwner) return true
  return viewer.teamRole !== null && EVIDENCE_RECORDING_ROLES.includes(viewer.teamRole)
}

/**
 * Evaluator independence: another evaluator's observation/rating is visible to a
 * peer only after the owning evaluator has SUBMITTED their scorecard for that
 * (application, stage). Owners and hiring admins may always read for calibration.
 * An evaluator always sees their own work.
 */
export function canSeePeerEvidence(input: {
  viewer: HiringEvidenceViewer
  owningEvaluatorId: string
  owningEvaluatorScorecardSubmitted: boolean
}): boolean {
  if (input.viewer.userId === input.owningEvaluatorId) return true
  if (input.viewer.isStaff || input.viewer.isProfileOwner) return true
  if (input.viewer.teamRole !== null && CALIBRATION_ROLES.includes(input.viewer.teamRole)) {
    return true
  }
  return input.owningEvaluatorScorecardSubmitted
}

/* -------------------------------------------------------------------------- */
/* AI authority boundary                                                       */
/* -------------------------------------------------------------------------- */

const PERMITTED = new Set<string>(AI_PERMITTED_ACTIONS)
const FORBIDDEN = new Set<string>(AI_FORBIDDEN_ACTIONS)

export type AiAuthorityCheck =
  | { allowed: true; action: AiPermittedAction }
  | { allowed: false; action: AiForbiddenAction | string; reason: string }

/**
 * Gate every AI-assisted operation in the hiring evidence layer. Only the
 * enumerated assistive actions are allowed, and only when a human triggered the
 * request. Anything not explicitly permitted is refused (fail closed).
 */
export function checkAiAction(input: {
  action: string
  humanRequesterId: string | null
}): AiAuthorityCheck {
  if (!input.humanRequesterId) {
    return {
      allowed: false,
      action: input.action,
      reason: 'AI assistance requires a human requester; no automated/triggered AI calls.',
    }
  }
  if (FORBIDDEN.has(input.action)) {
    return {
      allowed: false,
      action: input.action as AiForbiddenAction,
      reason: `"${input.action}" is a prohibited AI action in the hiring evidence layer.`,
    }
  }
  if (PERMITTED.has(input.action)) {
    return { allowed: true, action: input.action as AiPermittedAction }
  }
  return {
    allowed: false,
    action: input.action,
    reason: `"${input.action}" is not an enumerated permitted AI action (fail closed).`,
  }
}

export class HiringEvidenceAuthorityError extends Error {
  readonly status: number
  constructor(message: string, status = 403) {
    super(message)
    this.name = 'HiringEvidenceAuthorityError'
    this.status = status
  }
}
