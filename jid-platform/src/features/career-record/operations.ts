/**
 * Frozen Career Record Core operation shapes for the Wave 2 experience layer.
 * These are integration capabilities, not HTTP routes or backend implementations.
 */

import type {
  AuthorizedCareerEvidenceDisclosure,
  CareerEvidence,
  CareerEvidenceCategory,
  ContractId,
  ContractReference,
  DisclosureRecipient,
  IsoTimestamp,
} from '@/types/contracts'

export type CareerRecordCoreOperationName =
  | 'listCareerEvidence'
  | 'getCareerEvidence'
  | 'createDeclaredCareerEvidence'
  | 'getCareerEvidenceDisclosurePolicy'
  | 'updateCareerEvidenceDisclosurePolicy'
  | 'reviseCareerEvidence'
  | 'setCareerEvidenceLifecycle'
  | 'authorizeCareerEvidenceDisclosure'
  | 'resolveAuthorizedCareerEvidenceDisclosure'

export const CAREER_RECORD_CORE_OPERATIONS = [
  'listCareerEvidence',
  'getCareerEvidence',
  'createDeclaredCareerEvidence',
  'getCareerEvidenceDisclosurePolicy',
  'updateCareerEvidenceDisclosurePolicy',
  'reviseCareerEvidence',
  'setCareerEvidenceLifecycle',
  'authorizeCareerEvidenceDisclosure',
  'resolveAuthorizedCareerEvidenceDisclosure',
] as const satisfies readonly CareerRecordCoreOperationName[]

export type CoreResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'unavailable' }
  | { status: 'forbidden' }
  | { status: 'error'; message?: string }
  | { status: 'stale'; data: T; asOf?: IsoTimestamp }

export type CreateDeclaredCareerEvidenceInput = {
  category: CareerEvidenceCategory
  fact_payload: Readonly<Record<string, unknown>>
  effective_from?: IsoTimestamp
  effective_to?: IsoTimestamp
}

export type ReviseCareerEvidenceInput = {
  evidence_id: ContractId
  expected_revision_no: number
  fact_payload: Readonly<Record<string, unknown>>
  effective_from?: IsoTimestamp
  effective_to?: IsoTimestamp
}

export const CAREER_EVIDENCE_LIFECYCLE_ACTIONS = ['archive', 'dispute', 'revoke', 'expire'] as const
export type CareerEvidenceLifecycleAction = (typeof CAREER_EVIDENCE_LIFECYCLE_ACTIONS)[number]

export type SetCareerEvidenceLifecycleInput = {
  evidence_id: ContractId
  action: CareerEvidenceLifecycleAction
  reason_ref?: ContractReference
}

export type CareerEvidenceHistory = {
  current: CareerEvidence
  revisions: readonly CareerEvidence[]
}

export type CareerEvidenceDisclosurePolicyView = {
  policy_ref: ContractReference
  default_visibility: 'PRIVATE'
}

export type UpdateCareerEvidenceDisclosurePolicyInput = {
  evidence_id: ContractId
  policy_ref: ContractReference
}

export type AuthorizeCareerEvidenceDisclosureInput = {
  evidence_id: ContractId
  purpose_code: string
  recipient: DisclosureRecipient
}

export type ResolveAuthorizedCareerEvidenceDisclosureInput = {
  evidence_id: ContractId
  authorization_ref: ContractReference
}

export type CareerEvidenceLifecycleCapabilities = {
  canArchive: boolean
  canDispute: boolean
  canRevoke: boolean
  canExpire: boolean
}

/** Conservative owner defaults. Issuer revoke/expiry stays off until Core grants it. */
export const OWNER_DECLARED_LIFECYCLE_CAPABILITIES: CareerEvidenceLifecycleCapabilities = {
  canArchive: true,
  canDispute: true,
  canRevoke: false,
  canExpire: false,
}

export type CareerRecordPort = {
  readonly availability: 'ready' | 'unavailable'
  listCareerEvidence(): Promise<CoreResult<readonly CareerEvidence[]>>
  getCareerEvidence(evidenceId: ContractId): Promise<CoreResult<CareerEvidenceHistory>>
  createDeclaredCareerEvidence(
    input: CreateDeclaredCareerEvidenceInput,
  ): Promise<CoreResult<CareerEvidence>>
  getCareerEvidenceDisclosurePolicy(
    evidenceId: ContractId,
  ): Promise<CoreResult<CareerEvidenceDisclosurePolicyView>>
  updateCareerEvidenceDisclosurePolicy(
    input: UpdateCareerEvidenceDisclosurePolicyInput,
  ): Promise<CoreResult<CareerEvidenceDisclosurePolicyView>>
  reviseCareerEvidence(input: ReviseCareerEvidenceInput): Promise<CoreResult<CareerEvidence>>
  setCareerEvidenceLifecycle(
    input: SetCareerEvidenceLifecycleInput,
  ): Promise<CoreResult<CareerEvidence>>
  authorizeCareerEvidenceDisclosure(
    input: AuthorizeCareerEvidenceDisclosureInput,
  ): Promise<CoreResult<AuthorizedCareerEvidenceDisclosure>>
  resolveAuthorizedCareerEvidenceDisclosure(
    input: ResolveAuthorizedCareerEvidenceDisclosureInput,
  ): Promise<CoreResult<AuthorizedCareerEvidenceDisclosure>>
}

export async function unavailableCoreResult<T>(): Promise<CoreResult<T>> {
  return { status: 'unavailable' }
}
