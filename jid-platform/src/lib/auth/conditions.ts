/**
 * Route condition checks — Section 5 / Section 11 Step 4
 */

import type { RouteCondition } from './guards'
import type { UserRole } from './rbac'

export type MentorStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended'

export type ConditionProfile = {
  id: string
  full_name: string | null
  phone_verified_at: string | null
  role: UserRole
}

export type ConditionContext = {
  profile: ConditionProfile
  mentorStatus: MentorStatus
}

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

/**
 * Evaluate synchronous route conditions for a guard match.
 * `organization_profile` is evaluated asynchronously in middleware (P-109).
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

      case 'organization_profile':
        throw new Error('organization_profile is evaluated asynchronously in middleware')
        break

      default: {
        const _exhaustive: never = condition
        return _exhaustive
      }
    }
  }

  return { ok: true }
}
