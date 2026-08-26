import type { ContractId, ContractReference, IsoTimestamp, VersionedContract } from './common'
import type { LocationContext } from './market'

export const OPPORTUNITY_TYPES = [
  'JOB',
  'INTERNSHIP',
  'COOP',
  'GRADUATE_PROGRAM',
  'TRAINING',
  'FELLOWSHIP',
  'SCHOLARSHIP',
  'GOVERNMENT_PROGRAM',
  'CAREER_INITIATIVE',
] as const
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]

export const OPPORTUNITY_APPLY_AUTHORITIES = [
  'JID_NATIVE',
  'OFFICIAL_EXTERNAL',
  'REDIRECT_ONLY',
  'UNAVAILABLE',
] as const
export type OpportunityApplyAuthority = (typeof OPPORTUNITY_APPLY_AUTHORITIES)[number]

export const OPPORTUNITY_LIFECYCLE_STATES = [
  'DRAFT',
  'REVIEW',
  'PUBLISHED',
  'CLOSED',
  'EXPIRED',
  'REMOVED',
  'SUPERSEDED',
] as const
export type OpportunityLifecycleState = (typeof OPPORTUNITY_LIFECYCLE_STATES)[number]

export type OpportunitySource = {
  source_ref: ContractReference
  source_record_ref?: string
  source_class: 'JID_NATIVE' | 'GOVERNED_EXTERNAL'
  provenance_ref: ContractReference
}

export type Opportunity = VersionedContract & {
  opportunity_id: ContractId
  opportunity_type: OpportunityType
  source: OpportunitySource
  organization_ref_id?: ContractId
  owned_profile_id?: ContractId
  title: Readonly<Record<string, string>>
  description?: Readonly<Record<string, string>>
  requirements?: readonly ContractReference[]
  location_context?: LocationContext
  published_at?: IsoTimestamp
  last_confirmed_at?: IsoTimestamp
  expires_at?: IsoTimestamp
  apply_authority: OpportunityApplyAuthority
  apply_destination?: string
  lifecycle_state: OpportunityLifecycleState
  supersedes_opportunity_id?: ContractId
  jurisdiction_ref?: ContractReference
}

/** Organic relevance inputs deliberately exclude tier, sponsorship, boost, and payment. */
export type OrganicOpportunityRelevance = VersionedContract & {
  opportunity_id: ContractId
  source_freshness_at: IsoTimestamp
  eligibility_claim_refs: readonly ContractReference[]
  relevance_signal_refs: readonly ContractReference[]
}
