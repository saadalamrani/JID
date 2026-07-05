/**
 * Route condition checks — Section 5 / Section 11 Step 4
 */

import type { RouteCondition } from './guards'
import type { UserRole } from './rbac'

export type MentorStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended'

export type EntityClaimStatus =
  | 'none'
  | 'pending'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type ConditionProfile = {
  id: string
  full_name: string | null
  phone_verified_at: string | null
  role: UserRole
}

export type ConditionContext = {
  profile: ConditionProfile
  mentorStatus: MentorStatus
  entityClaimStatus: EntityClaimStatus
  temporaryCompanyAccess: TemporaryCompanyAccess | null
}

export type TemporaryCompanyAccess = {
  companyId: string
  entityState: string
  claimRequestedAt: string
  claimedBy: string
}

export const TEMPORARY_COMPANY_ACCESS_MS = 24 * 60 * 60 * 1000

export type ConditionFailure = {
  ok: false
  failed: RouteCondition
}

export type ConditionResult = { ok: true } | ConditionFailure

export function isProfileComplete(profile: ConditionProfile): boolean {
  return Boolean(profile.full_name?.trim())
}

export function isPhoneVerified(profile: ConditionProfile): boolean {
  return profile.phone_verified_at !== null
}

export function isMentorApproved(mentorStatus: MentorStatus): boolean {
  return mentorStatus === 'approved'
}

export function isEntityClaimApproved(entityClaimStatus: EntityClaimStatus): boolean {
  return entityClaimStatus === 'approved'
}

/**
 * Section 5.5 — 24h temporary company portal access while claim is pending review.
 */
export function hasTemporaryCompanyAccess(context: ConditionContext): boolean {
  const access = context.temporaryCompanyAccess
  if (!access) return false
  if (access.claimedBy !== context.profile.id) return false
  if (access.entityState !== 'pending_review') return false

  const requestedAt = new Date(access.claimRequestedAt).getTime()
  if (Number.isNaN(requestedAt)) return false

  const elapsed = Date.now() - requestedAt
  return elapsed >= 0 && elapsed < TEMPORARY_COMPANY_ACCESS_MS
}

export function isEntityClaimApprovedOrTemporary(context: ConditionContext): boolean {
  return isEntityClaimApproved(context.entityClaimStatus) || hasTemporaryCompanyAccess(context)
}

/**
 * Evaluate all route conditions for a guard match.
 * Returns the first failing condition, or `{ ok: true }`.
 */
export function checkConditions(
  conditions: readonly RouteCondition[],
  context: ConditionContext,
): ConditionResult {
  for (const condition of conditions) {
    switch (condition) {
      case 'phone_verified':
        if (!isPhoneVerified(context.profile)) {
          return { ok: false, failed: condition }
        }
        break

      case 'profile_complete':
        if (!isProfileComplete(context.profile)) {
          return { ok: false, failed: condition }
        }
        break

      case 'mentor_status':
        if (!isMentorApproved(context.mentorStatus)) {
          return { ok: false, failed: condition }
        }
        break

      case 'entity_claim_status':
        if (!isEntityClaimApprovedOrTemporary(context)) {
          return { ok: false, failed: condition }
        }
        break

      default: {
        const _exhaustive: never = condition
        return _exhaustive
      }
    }
  }

  return { ok: true }
}
