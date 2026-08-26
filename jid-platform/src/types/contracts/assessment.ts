import type { ContractId, ContractReference, IsoTimestamp, VersionedContract } from './common'

export type AssessmentInstrument = VersionedContract & {
  instrument_id: ContractId
  provider_ref: ContractReference
  instrument_version: string
  construct_code: string
  purpose_code: string
  supported_language_codes: readonly string[]
  target_context_ref: ContractReference
  scoring_interpretation_ref?: ContractReference
  validity_governance_ref: ContractReference
  retention_policy_ref: ContractReference
  sharing_restriction_ref: ContractReference
  state: 'ACTIVE' | 'REVIEW' | 'RETIRED'
}

export type AssessmentAttempt = VersionedContract & {
  attempt_id: ContractId
  instrument_ref: ContractReference
  subject_id: ContractId
  role_or_use_context_ref: ContractReference
  invitation_or_authorization_ref: ContractReference
  state: 'INVITED' | 'STARTED' | 'COMPLETED' | 'INVALIDATED' | 'EXPIRED'
  accommodation_state: 'NONE' | 'REQUESTED' | 'PROVIDED' | 'DECLINED'
  technical_incident_state: 'NONE' | 'REPORTED' | 'RESOLVED' | 'INVALIDATED'
  started_at?: IsoTimestamp
  completed_at?: IsoTimestamp
  provenance_ref: ContractReference
}

export type InstrumentScore = {
  value: number
  scale_or_rubric_ref: ContractReference
  interpretation_ref: ContractReference
}

export type AssessmentResultEvidence = VersionedContract & {
  result_evidence_id: ContractId
  attempt_id: ContractId
  result_payload: Readonly<Record<string, unknown>>
  instrument_score?: InstrumentScore
  evaluator_or_provider_ref: ContractReference
  model_ref?: ContractReference
  generated_at: IsoTimestamp
  limitations: readonly string[]
  sharing_or_portability_ref: ContractReference
  retention_policy_ref: ContractReference
  appeal_state: 'NONE' | 'OPEN' | 'UPHELD' | 'CORRECTED' | 'REJECTED'
}

/** Records a human's purpose-bound use of evidence; it is not an automated final decision. */
export type AssessmentDecisionUse = VersionedContract & {
  decision_use_id: ContractId
  result_evidence_ref: ContractReference
  opportunity_or_role_ref: ContractReference
  decision_purpose_code: string
  human_reviewer_ref: ContractReference
  used_at: IsoTimestamp
  reviewer_judgment_code: string
  reviewer_reason: string
  override_or_challenge_state: 'NONE' | 'OVERRIDDEN' | 'CHALLENGED' | 'RESOLVED'
  audit_ref: ContractReference
}
