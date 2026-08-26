import {
  CAREER_EVIDENCE_STATES,
  DISCLOSURE_AUTHORIZATION_STATES,
  OPPORTUNITY_LIFECYCLE_STATES,
  OPPORTUNITY_TYPES,
  ORGANIZATION_AUTHORITY_STATES,
  PUBLIC_ACTOR_TYPES,
  UNIVERSITY_AFFILIATION_STATES,
  isJourneyOutcome,
  isPublicActorType,
  type CareerEvidenceState,
  type CohortLink,
  type DisclosureAuthorizationState,
  type JourneyEvent,
  type JourneyOutcome,
  type MetricDefinition,
  type OpportunityLifecycleState,
  type OpportunityType,
  type OrganicOpportunityRelevance,
  type OrganizationAuthorityState,
  type PublicActorType,
  type UniversityAffiliationState,
} from '@/types/contracts'

export const CONTRACT_STATUS_DOMAINS = [
  'universityAffiliation',
  'opportunityLifecycle',
  'careerEvidence',
  'organizationAuthority',
  'disclosureAuthorization',
  'cohortLink',
] as const

export type ContractStatusDomain = (typeof CONTRACT_STATUS_DOMAINS)[number]

export type ContractStatusVisualVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'brand'

export type ContractStatusBinding =
  | { domain: 'universityAffiliation'; state: UniversityAffiliationState }
  | { domain: 'opportunityLifecycle'; state: OpportunityLifecycleState }
  | { domain: 'careerEvidence'; state: CareerEvidenceState }
  | { domain: 'organizationAuthority'; state: OrganizationAuthorityState }
  | { domain: 'disclosureAuthorization'; state: DisclosureAuthorizationState }
  | { domain: 'cohortLink'; state: CohortLink['link_state'] }

/** Decorative marketing chips are not contract states and must not be added here. */
export const FORBIDDEN_DECORATIVE_BADGE_LABELS = [
  'AI',
  'Smart',
  'Hot',
  'Best Match',
  'Popular',
  'Trusted',
  'Trending',
] as const

export const UNIVERSITY_AFFILIATION_STATUS_STATES = UNIVERSITY_AFFILIATION_STATES
export const OPPORTUNITY_LIFECYCLE_STATUS_STATES = OPPORTUNITY_LIFECYCLE_STATES
export const CAREER_EVIDENCE_STATUS_STATES = CAREER_EVIDENCE_STATES
export const ORGANIZATION_AUTHORITY_STATUS_STATES = ORGANIZATION_AUTHORITY_STATES
export const DISCLOSURE_AUTHORIZATION_STATUS_STATES = DISCLOSURE_AUTHORIZATION_STATES
export const UI_PUBLIC_ACTORS = PUBLIC_ACTOR_TYPES
export const UI_OPPORTUNITY_TYPES = OPPORTUNITY_TYPES

export function contractStatusVariant(binding: ContractStatusBinding): ContractStatusVisualVariant {
  switch (binding.domain) {
    case 'universityAffiliation':
      switch (binding.state) {
        case 'DECLARED':
          return 'neutral'
        case 'VERIFIED':
          return 'success'
        case 'NEEDS_REVIEW':
          return 'warning'
      }
      break
    case 'opportunityLifecycle':
      switch (binding.state) {
        case 'DRAFT':
        case 'REVIEW':
          return 'neutral'
        case 'PUBLISHED':
          return 'success'
        case 'CLOSED':
        case 'EXPIRED':
        case 'SUPERSEDED':
          return 'warning'
        case 'REMOVED':
          return 'destructive'
      }
      break
    case 'careerEvidence':
      switch (binding.state) {
        case 'DECLARED':
        case 'SOURCED':
        case 'DERIVED':
          return 'neutral'
        case 'VERIFIED':
        case 'CONFIRMED':
          return 'success'
        case 'DISPUTED':
        case 'CORRECTED':
          return 'warning'
        case 'REVOKED':
        case 'EXPIRED':
          return 'destructive'
      }
      break
    case 'organizationAuthority':
      switch (binding.state) {
        case 'ACTIVE':
          return 'success'
        case 'SUSPENDED':
        case 'EXPIRED':
          return 'warning'
        case 'REVOKED':
          return 'destructive'
      }
      break
    case 'disclosureAuthorization':
      switch (binding.state) {
        case 'ACTIVE':
          return 'success'
        case 'SUPERSEDED':
          return 'neutral'
        case 'EXPIRED':
          return 'warning'
        case 'REVOKED':
          return 'destructive'
      }
      break
    case 'cohortLink':
      switch (binding.state) {
        case 'ACTIVE':
          return 'success'
        case 'NEEDS_REVIEW':
          return 'warning'
        case 'ENDED':
          return 'neutral'
      }
  }

  const exhaustive: never = binding
  return exhaustive
}

export function isUiPublicActor(value: string): value is PublicActorType {
  return isPublicActorType(value)
}

/** Cohort linkage never implies private Career Record access. */
export function cohortLinkGrantsPrivateCareerAccess(_link: Pick<CohortLink, 'link_state'>): false {
  return false
}

/**
 * Missing journey information is not an outcome.
 * Absence must not render as rejected, successful, employed, or unemployed.
 */
export function journeyOutcomeForDisplay(
  event: JourneyEvent | null | undefined,
): JourneyOutcome | null {
  if (!event || event.event_kind !== 'OUTCOME') {
    return null
  }
  return event.outcome
}

export function isInferredJourneyOutcomeLabel(value: string): boolean {
  return (
    !isJourneyOutcome(value) &&
    ['rejected', 'successful', 'employed', 'unemployed', 'MISSING', 'UNKNOWN', 'NO_DATA'].includes(
      value,
    )
  )
}

export type OrganicPaidVisibilityField = 'tier' | 'sponsorship' | 'boost' | 'priority' | 'paid'

/** Organic relevance must never carry paid-visibility fields. */
export function organicRelevancePaidFieldKeys(): readonly OrganicPaidVisibilityField[] {
  return []
}

export function organicRelevanceHasPaidVisibility(
  relevance: Pick<
    OrganicOpportunityRelevance,
    'opportunity_id' | 'source_freshness_at' | 'eligibility_claim_refs' | 'relevance_signal_refs'
  >,
): false {
  void relevance
  return false
}

export function opportunityTypeIsJobOnly(type: OpportunityType): boolean {
  return type === 'JOB'
}

export type MetricPresentationContext = {
  definition: MetricDefinition
  value: number | null
  suppressed?: boolean
}

export function metricValueForDisplay(context: MetricPresentationContext): number | null {
  if (context.suppressed) {
    return null
  }
  return typeof context.value === 'number' ? context.value : null
}

export function metricRequiredMeta(definition: MetricDefinition): {
  source: MetricDefinition['source_refs']
  window: string
  population: string
  coverage: MetricDefinition['coverage']
  missingness: string
  privacy: MetricDefinition['privacy']
} {
  return {
    source: definition.source_refs,
    window: definition.window_definition,
    population: definition.population_definition,
    coverage: definition.coverage,
    missingness: definition.missing_unknown_policy,
    privacy: definition.privacy,
  }
}

export const FORBIDDEN_UNIVERSAL_SCORE_LABELS = [
  'Candidate Score',
  'Employability Score',
  'Culture Fit Score',
  'Potential Score',
  'Match %',
] as const
