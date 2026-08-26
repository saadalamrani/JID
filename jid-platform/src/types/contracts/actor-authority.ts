import type {
  ContractId,
  ContractReference,
  IsoTimestamp,
  LocaleCode,
  VersionedContract,
} from './common'

export const PUBLIC_ACTOR_TYPES = ['INDIVIDUAL', 'BUSINESS', 'UNIVERSITY'] as const
export type PublicActorType = (typeof PUBLIC_ACTOR_TYPES)[number]

export const INTERNAL_ROLES = ['NONE', 'STAFF', 'ADMIN', 'SUPER_ADMIN'] as const
export type InternalRole = (typeof INTERNAL_ROLES)[number]

export const ORGANIZATION_TYPES = ['BUSINESS', 'UNIVERSITY'] as const
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]

export const ORGANIZATION_AUTHORITY_STATES = ['ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED'] as const
export type OrganizationAuthorityState = (typeof ORGANIZATION_AUTHORITY_STATES)[number]

export type AccountIdentity = VersionedContract & {
  account_id: ContractId
  account_state: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  internal_role: InternalRole
  locale: LocaleCode
}

export type IndividualActorContext = VersionedContract & {
  actor_type: 'INDIVIDUAL'
  account_id: ContractId
  individual_id: ContractId
}

export type OrganizationActorContext = VersionedContract & {
  actor_type: OrganizationType
  account_id: ContractId
  organization_ref_id: ContractId
  organization_authority_id: ContractId
}

export type PublicActorContext = IndividualActorContext | OrganizationActorContext

/** Platform-owned Directory identity. It carries no ownership or write authority. */
export type OrganizationReference = VersionedContract & {
  organization_ref_id: ContractId
  organization_type: OrganizationType
  reference_state: 'ACTIVE' | 'INACTIVE'
  provenance_ref?: ContractReference
}

/** Revocable authority to act for an organization; never derived from companies.claimed_by. */
export type OrganizationAuthority = VersionedContract & {
  authority_id: ContractId
  account_id: ContractId
  organization_ref_id: ContractId
  owned_profile_id?: ContractId
  authority_role: 'OWNER' | 'ADMIN' | 'MEMBER'
  verification_ref: ContractReference
  state: OrganizationAuthorityState
  effective_at: IsoTimestamp
  ended_at?: IsoTimestamp
}

export type MentorCapability = VersionedContract & {
  individual_id: ContractId
  state: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

export type InstitutionalContext = VersionedContract & {
  context_id: ContractId
  context_type: 'GOVERNMENT' | 'PROGRAM' | 'PARTNER' | 'CUSTOMER'
  organization_ref?: ContractReference
}

export function isPublicActorType(value: string): value is PublicActorType {
  return (PUBLIC_ACTOR_TYPES as readonly string[]).includes(value)
}
