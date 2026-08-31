import type { ContractId, ContractReference, IsoTimestamp, VersionedContract } from './common'

export const UNIVERSITY_AFFILIATION_STATES = ['DECLARED', 'VERIFIED', 'NEEDS_REVIEW'] as const
export type UniversityAffiliationState = (typeof UNIVERSITY_AFFILIATION_STATES)[number]

export const UNIVERSITY_PERSON_STATUSES = ['STUDENT', 'GRADUATE', 'OTHER'] as const
export type UniversityPersonStatus = (typeof UNIVERSITY_PERSON_STATUSES)[number]

export type UniversityAffiliation = VersionedContract & {
  affiliation_id: ContractId
  individual_id: ContractId
  university_catalog_ref: ContractReference
  college_ref?: ContractReference
  program_or_major_ref?: ContractReference
  program_or_major_text?: string
  degree_ref?: ContractReference
  degree_text?: string
  graduation_year?: number
  person_status: UniversityPersonStatus
  institution_person_identifier_ref?: ContractReference
  state: UniversityAffiliationState
  declared_at: IsoTimestamp
  verification_method?: 'ROSTER' | 'INVITE' | 'CODE' | 'SSO' | 'EMAIL' | 'API' | 'MANUAL_REVIEW'
  verification_source_ref?: ContractReference
  verified_at?: IsoTimestamp
  dispute_or_revocation_ref?: ContractReference
  audit_ref: ContractReference
}

/** Cohort membership is not disclosure authorization and grants no Career Evidence access. */
export type CohortLink = VersionedContract & {
  cohort_link_id: ContractId
  affiliation_id: ContractId
  cohort_id: ContractId
  link_source: ContractReference
  link_state: 'ACTIVE' | 'ENDED' | 'NEEDS_REVIEW'
  linked_at: IsoTimestamp
  ended_at?: IsoTimestamp
  audit_ref: ContractReference
}

export const UNIVERSITY_IDENTITY_MAPPING_STATES = ['active', 'revoked'] as const
export type UniversityIdentityMappingState = (typeof UNIVERSITY_IDENTITY_MAPPING_STATES)[number]

/** Explicit Staff reconciliation. Catalog id and Directory id are never interchangeable. */
export type UniversityIdentityMapping = VersionedContract & {
  mapping_id: ContractId
  catalog_university_id: ContractId
  directory_id: ContractId
  mapping_state: UniversityIdentityMappingState
  created_by_staff_id: ContractId
  created_at: IsoTimestamp
  revoked_at?: IsoTimestamp
  revoked_by_staff_id?: ContractId
  audit_reason: string
  audit_reference?: string
}

export const UNIVERSITY_OUTCOME_SOURCES = [
  'USER_DECLARED',
  'VERIFIED_EMPLOYER',
  'INSTITUTION_GOVERNED',
  'EXTERNAL_GOVERNMENT',
] as const
export type UniversityOutcomeSource = (typeof UNIVERSITY_OUTCOME_SOURCES)[number]

export const UNIVERSITY_OUTCOME_PRESENCE = ['KNOWN', 'UNKNOWN'] as const
export type UniversityOutcomePresence = (typeof UNIVERSITY_OUTCOME_PRESENCE)[number]

export type UniversityOutcomeEvidence = VersionedContract & {
  outcome_id: ContractId
  affiliation_id: ContractId
  source: UniversityOutcomeSource
  presence: UniversityOutcomePresence
  provenance_ref: ContractReference
  recorded_at: IsoTimestamp
}

export type UniversityOwnerFoundationSnapshot = {
  mapping_present: boolean
  fail_closed_reason: 'unauthenticated' | 'no_owned_profile' | 'unmapped' | null
  mapping_id?: string
  directory_id?: string
  catalog_university_id?: string
  mapped_at?: string
  verified_affiliation_count?: number
  declared_affiliation_count_hidden?: boolean
  cohorts?: Array<{
    id: string
    graduation_year: number
    degree_level: string | null
    program_text: string | null
    major_id: string | null
    active_membership_count: number
  }>
  outcome_counts?: Array<{
    source: UniversityOutcomeSource
    presence: UniversityOutcomePresence
    category: string
    count: number
  }>
  metrics?: Array<{
    metric_key: string
    name_ar: string
    name_en: string
    source_definition: string
    population_definition: string
    window_definition: string
    coverage_rule: string
    missingness_rule: string
    privacy_rule: string
    computability: 'CONTRACT_ONLY' | 'COMPUTABLE'
    value: number | null
  }>
}
