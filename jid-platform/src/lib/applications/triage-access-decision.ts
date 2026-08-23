import { isPrivilegedStaffRole } from '@/lib/profile/visibility-rules'
import type { UserRole } from '@/lib/auth/rbac'

export type TriageViewer = {
  userId: string
  role: UserRole
  isStaff: boolean
  /** Owned business Profile id — current architecture ownership anchor. */
  businessProfileId: string | null
  /**
   * Directory company id from the owned Profile, or a legacy claimed_by
   * company used only when a job has no business_profile_id.
   */
  companyId: string | null
}

export type TriageJobRef = {
  id: string
  company_id: string | null
  business_profile_id: string | null
  title_ar: string
  title_en: string | null
  application_deadline: string | null
  applicant_count: number
}

export type TriageAccessDecision = 'allow' | 'unauthorized' | 'forbidden' | 'not_found'

/**
 * Pure ownership gate for applicant triage.
 *
 * Current contract: jobs belong to an owned business Profile
 * (`jobs.business_profile_id` → `business_profiles.owner_user_id`).
 * Directory `claimed_by` is not product ownership and must not grant
 * access to Profile-anchored jobs.
 */
export function decideJobTriageAccess(input: {
  viewer: TriageViewer | null
  job: TriageJobRef | null
}): TriageAccessDecision {
  if (!input.viewer) return 'unauthorized'
  if (!input.job) return 'not_found'

  if (input.viewer.isStaff || isPrivilegedStaffRole(input.viewer.role)) {
    return 'allow'
  }

  const jobProfileId = input.job.business_profile_id?.trim() || null
  if (jobProfileId) {
    return input.viewer.businessProfileId === jobProfileId ? 'allow' : 'forbidden'
  }

  // Transitional: legacy jobs with no Profile anchor, matching RLS 115/116.
  if (input.viewer.companyId && input.viewer.companyId === input.job.company_id) {
    return 'allow'
  }

  return 'forbidden'
}
