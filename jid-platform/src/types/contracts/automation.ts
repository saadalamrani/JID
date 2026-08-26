import type { ContractId, ContractReference, VersionedContract } from './common'

export const AUTOMATION_OUTPUT_CLASSES = [
  'RETRIEVE',
  'SUMMARIZE',
  'COMPARE',
  'DRAFT',
  'RECOMMEND',
  'PROPOSE_CHANGE',
  'PREPARE',
  'MONITOR',
  'TRACK',
] as const
export type AutomationOutputClass = (typeof AUTOMATION_OUTPUT_CLASSES)[number]

export type AutomationAuthorityBase = VersionedContract & {
  automation_id: ContractId
  requesting_actor_ref: ContractReference
  purpose_code: string
  input_data_classes: readonly string[]
  provider_ref?: ContractReference
  model_or_engine_version?: string
  permitted_output_class: AutomationOutputClass
  source_evidence_refs: readonly ContractReference[]
  fallback_state: 'FAIL_CLOSED' | 'HUMAN_ONLY' | 'NO_ACTION'
  kill_state: 'ENABLED' | 'PAUSED' | 'DISABLED'
  audit_ref: ContractReference
}

export type NonConsequentialAutomationAuthority = AutomationAuthorityBase & {
  permitted_action_class: 'NONE' | 'INTERNAL_PROPOSAL'
  human_review_state: 'NOT_REQUIRED' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED' | 'CORRECTED'
  consequential_external_action: false
  external_confirmation_ref?: never
}

export type ConsequentialExternalAutomationAuthority = AutomationAuthorityBase & {
  permitted_action_class: 'CONSEQUENTIAL_EXTERNAL_ACTION_AFTER_CONFIRMATION'
  human_review_state: 'APPROVED'
  consequential_external_action: true
  external_confirmation_ref: ContractReference
}

export type AutomationAuthority =
  | NonConsequentialAutomationAuthority
  | ConsequentialExternalAutomationAuthority
