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
