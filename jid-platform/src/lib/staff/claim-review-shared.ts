import { emailDomainMatchesAllowed } from '@/lib/entity/domains'
import { PENDING_CLAIM_STATUSES } from '@/lib/staff/claims'

export type RelatedClaimHistoryItem = {
  id: string
  company_name: string
  status: string
  claim_type: string
  created_at: string
  reviewed_at: string | null
  relation: 'same_user' | 'same_entity'
}

export function buildDefaultClaimChecklist(
  businessEmail: string,
  domains: string[],
  claimantTitle: string | null,
  relatedHistory: RelatedClaimHistoryItem[],
): Record<string, boolean> {
  const hasDuplicate = relatedHistory.some((item) =>
    ['approved', 'pending', 'pending_review', 'under_review', 'submitted'].includes(item.status),
  )

  return {
    domain_match: emailDomainMatchesAllowed(businessEmail, domains),
    entity_exists: false,
    linkedin_verified: false,
    job_reasonable: Boolean(claimantTitle?.trim() && claimantTitle.trim().length >= 2),
    no_duplicates: !hasDuplicate,
  }
}

export function isClaimPendingReview(status: string): boolean {
  return (
    (PENDING_CLAIM_STATUSES as readonly string[]).includes(status) || status === 'needs_more_info'
  )
}

export const MENTOR_CHECKLIST_KEYS = ['linkedin_role', 'expertise_plausible', 'bio_quality'] as const

export function buildDefaultMentorChecklist(bioLong: string | null): Record<string, boolean> {
  const bioLen = bioLong?.trim().length ?? 0
  return {
    linkedin_role: false,
    expertise_plausible: false,
    bio_quality: bioLen >= 80,
  }
}
