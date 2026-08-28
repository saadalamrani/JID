import type { CareerEvidence, DisclosureAuthorization } from '@/types/contracts'

/**
 * Three disclosure scopes that must never be collapsed in product UI.
 * Internal contract names stay out of user-facing copy.
 */
export const DISCLOSURE_SCOPES = [
  'in_career_record',
  'in_this_cv',
  'shared_with_recipient',
] as const
export type DisclosureScope = (typeof DISCLOSURE_SCOPES)[number]

export const DEFAULT_EVIDENCE_VISIBILITY = 'PRIVATE' as const
export type DefaultEvidenceVisibility = typeof DEFAULT_EVIDENCE_VISIBILITY

export type EvidencePrivacyPresentation = {
  defaultVisibility: DefaultEvidenceVisibility
  inCareerRecord: true
  inThisCv: boolean
  sharedWithRecipient: boolean
}

export function isPrivateByDefault(_evidence: Pick<CareerEvidence, 'disclosure_policy_ref'>): true {
  void _evidence
  return true
}

/**
 * Private owner evidence must not imply a recipient grant.
 * An authorization ref on the object is still not a successful share until Core
 * supplies an active authorization for an exact recipient and purpose.
 */
export function evidenceImpliesRecipientAccess(
  evidence: Pick<CareerEvidence, 'disclosure_authorization_ref' | 'verification_state'>,
): false {
  void evidence
  return false
}

export function verificationImpliesPublicVisibility(
  evidence: Pick<CareerEvidence, 'verification_state'>,
): false {
  void evidence
  return false
}

export function cvSelectionImpliesPublicVisibility(_selected: boolean): false {
  void _selected
  return false
}

export function affiliationImpliesCareerRecordAccess(): false {
  return false
}

export function staffRoleImpliesCareerRecordAccess(): false {
  return false
}

export function presentEvidencePrivacy(options: {
  selectedInThisCv: boolean
  authorization: DisclosureAuthorization | null
}): EvidencePrivacyPresentation {
  const activeAuthorization =
    options.authorization !== null && options.authorization.lifecycle.state === 'ACTIVE'

  return {
    defaultVisibility: DEFAULT_EVIDENCE_VISIBILITY,
    inCareerRecord: true,
    inThisCv: options.selectedInThisCv,
    sharedWithRecipient: activeAuthorization,
  }
}
