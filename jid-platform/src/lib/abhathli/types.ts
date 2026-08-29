import type { OpportunityDiscoveryFamily } from '@/lib/opportunity/discovery-types'

export const ABHATHLI_CRITERIA_KEYS = [
  'keyword',
  'family',
  'location',
  'remote',
] as const
export type AbhathliCriteriaKey = (typeof ABHATHLI_CRITERIA_KEYS)[number]

export type AbhathliMandateInput = {
  keywords: string[]
  families: OpportunityDiscoveryFamily[]
  cities: string[]
  remote_only: boolean
  use_career_record: boolean
}

export type AbhathliCriterionMatch = {
  key: AbhathliCriteriaKey
  matched: boolean
  detail: string
}

export type AbhathliEvidenceLink = {
  category: string
  fact: string
  relation: 'meets' | 'possible' | 'missing' | 'conflict' | 'review'
}

export type AbhathliRecommendation = {
  opportunity_id: string
  title_ar: string | null
  title_en: string | null
  organization_name: string | null
  source_class: 'JID_NATIVE' | 'GOVERNED_EXTERNAL'
  apply_authority: string
  apply_url: string | null
  expires_at: string | null
  criteria_matches: AbhathliCriterionMatch[]
  matched_count: number
  required_count: number
  evidence_links: AbhathliEvidenceLink[]
  why_included_ar: string
  why_included_en: string
  gaps_ar: string[]
  gaps_en: string[]
}

export type AbhathliDraft = {
  opportunity_id: string
  materials_kind: 'application_prep'
  facts_used: string[]
  omitted_unknowns: string[]
  cover_letter_ar: string
  cover_letter_en: string
  gap_list_ar: string[]
  gap_list_en: string[]
  requires_user_review: true
  invents_experience: false
}

export type AbhathliApproval = {
  recommendation_id: string
  opportunity_id: string
  action: 'apply_native' | 'redirect_external' | 'track_only'
  approved: boolean
  approved_at: string | null
}

export class AbhathliBoundaryError extends Error {
  readonly code:
    | 'MASS_APPLY_FORBIDDEN'
    | 'APPROVAL_REQUIRED'
    | 'EXTERNAL_APPLICATION_FORBIDDEN'
    | 'UNTRUSTED_POSTING'
    | 'CAREER_RECORD_WRITE_FORBIDDEN'

  constructor(
    code:
      | 'MASS_APPLY_FORBIDDEN'
      | 'APPROVAL_REQUIRED'
      | 'EXTERNAL_APPLICATION_FORBIDDEN'
      | 'UNTRUSTED_POSTING'
      | 'CAREER_RECORD_WRITE_FORBIDDEN',
    message: string,
  ) {
    super(message)
    this.name = 'AbhathliBoundaryError'
    this.code = code
  }
}
