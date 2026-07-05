/**
 * Unified profile visibility rules — Section 6.3 / Section 12 Step 5
 *
 * Pure functions only (safe for client optimistic UI gates).
 * Does NOT reference commitment_score or any cross-company ranking data.
 */

import { PRIVILEGED_STAFF_ROLES, type UserRole } from '@/lib/auth/rbac'
import type { ProfileViewer, ProfileVisibilityInput } from './types'

export type { ProfileViewer, ProfileVisibilityInput } from './types'

const ANONYMOUS_VIEWER: ProfileViewer = {
  userId: null,
  role: null,
  companyId: null,
  isVerified: false,
  isAdmin: false,
  isMentorApproved: false,
}

export function createAnonymousViewer(): ProfileViewer {
  return { ...ANONYMOUS_VIEWER }
}

export function isPrivilegedStaffRole(role: UserRole | null): boolean {
  if (!role) return false
  return (PRIVILEGED_STAFF_ROLES as readonly string[]).includes(role)
}

/** Suspended or deleted — hidden from non-owner, non-staff viewers (Section 13). */
export function isProfileHiddenFromNonStaff(profile: ProfileVisibilityInput): boolean {
  if (profile.deleted_at) return true
  if (profile.suspended_at) return true
  if (profile.profile_state === 'suspended' || profile.profile_state === 'deleted') return true
  return false
}

/**
 * Whether `viewer` may see `profile`.
 * Returns false → UI shows ProfilePrivateGate.
 */
export function canViewerSeeProfile(
  viewer: ProfileViewer | null | undefined,
  profile: ProfileVisibilityInput,
): boolean {
  const v = viewer ?? ANONYMOUS_VIEWER

  if (v.userId && v.userId === profile.id) {
    return true
  }

  if (v.isAdmin || isPrivilegedStaffRole(v.role)) {
    return true
  }

  if (isProfileHiddenFromNonStaff(profile)) {
    return false
  }

  if (profile.visibility === 'public') {
    return true
  }

  if (
    v.role === 'company_admin' &&
    v.isVerified &&
    v.companyId !== null &&
    profile.visibility === 'discoverable' &&
    profile.show_profile_to_companies
  ) {
    return true
  }

  // Mentors: discoverable only — no bypass via show_profile_to_companies alone (Section 13)
  if (v.isMentorApproved && profile.visibility === 'discoverable') {
    return true
  }

  return false
}
