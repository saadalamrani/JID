import type { ContractId, ContractReference, IsoTimestamp, VersionedContract } from './common'

export const CAREER_EVIDENCE_CATEGORIES = [
  'EDUCATION',
  'EXPERIENCE',
  'SKILL',
  'PROJECT',
  'CREDENTIAL',
  'AWARD',
  'LANGUAGE',
  'VOLUNTEERING',
  'PUBLICATION',
  'OTHER',
] as const
export type CareerEvidenceCategory = (typeof CAREER_EVIDENCE_CATEGORIES)[number]

export const CAREER_EVIDENCE_SOURCE_CLASSES = [
  'SELF_DECLARED',
  'ISSUER_VERIFIED',
  'ORGANIZATION_CONFIRMED',
  'SYSTEM_OBSERVED',
  'THIRD_PARTY_SOURCED',
  'DERIVED_EXPLAINABLE',
] as const
export type CareerEvidenceSourceClass = (typeof CAREER_EVIDENCE_SOURCE_CLASSES)[number]

export const CAREER_EVIDENCE_STATES = [
  'DECLARED',
  'VERIFIED',
  'CONFIRMED',
  'SOURCED',
  'DERIVED',
  'DISPUTED',
  'CORRECTED',
  'REVOKED',
  'EXPIRED',
] as const
export type CareerEvidenceState = (typeof CAREER_EVIDENCE_STATES)[number]

export type CareerEvidence = VersionedContract & {
  evidence_id: ContractId
  subject_id: ContractId
  category: CareerEvidenceCategory
  fact_payload: Readonly<Record<string, unknown>>
  source_class: CareerEvidenceSourceClass
  source_ref?: ContractReference
  verification_state: CareerEvidenceState
  effective_from?: IsoTimestamp
  effective_to?: IsoTimestamp
  observed_at?: IsoTimestamp
  revision_no: number
  supersedes_evidence_id?: ContractId
  dispute_ref?: ContractReference
  revocation_or_expiry_ref?: ContractReference
  evidence_artifact_ref?: ContractReference
  disclosure_authorization_ref: ContractReference
  market_context_ref?: ContractReference
}
