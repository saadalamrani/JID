import type { ContractId, ContractReference, IsoTimestamp, VersionedContract } from './common'

export const DISCLOSURE_RECIPIENT_TYPES = [
  'PUBLIC',
  'BUSINESS',
  'UNIVERSITY',
  'MENTOR',
  'VENDOR',
  'SYSTEM',
  'OTHER_APPROVED',
] as const
export type DisclosureRecipientType = (typeof DISCLOSURE_RECIPIENT_TYPES)[number]

export const AUTHORIZATION_BASIS_TYPES = [
  'CONSENT',
  'CONTRACT',
  'LEGAL_OBLIGATION',
  'LEGITIMATE_AUTHORITY',
  'PUBLIC_TASK',
  'OTHER_REVIEWED',
] as const
export type AuthorizationBasisType = (typeof AUTHORIZATION_BASIS_TYPES)[number]

export const DISCLOSURE_AUTHORIZATION_STATES = [
  'ACTIVE',
  'REVOKED',
  'EXPIRED',
  'SUPERSEDED',
] as const
export type DisclosureAuthorizationState = (typeof DISCLOSURE_AUTHORIZATION_STATES)[number]

export type DisclosureObjectScope =
  | { object_ref: ContractReference; data_category?: never }
  | { object_ref?: never; data_category: string }

export type DisclosureRecipient = {
  recipient_type: DisclosureRecipientType
  recipient_ref?: ContractReference
}

export type AuthorizationBasis = {
  basis_type: AuthorizationBasisType
  basis_ref: ContractReference
}

export type AuthorizationLifecycle = {
  state: DisclosureAuthorizationState
  effective_at: IsoTimestamp
  expires_at?: IsoTimestamp
  revoked_at?: IsoTimestamp
}

export type DisclosureAuthorization = VersionedContract &
  DisclosureObjectScope & {
    authorization_id: ContractId
    subject_id: ContractId
    recipient: DisclosureRecipient
    purpose_code: string
    basis: AuthorizationBasis
    lifecycle: AuthorizationLifecycle
    retention_policy_ref: ContractReference
    created_by: ContractReference
  }

export type AccessAuditEvent = VersionedContract & {
  audit_event_id: ContractId
  actor_ref: ContractReference
  subject_id: ContractId
  object_ref: ContractReference
  purpose_code: string
  authorization_or_basis_ref: ContractReference
  result: 'ALLOWED' | 'DENIED'
  occurred_at: IsoTimestamp
  request_context?: Readonly<Record<string, unknown>>
}
