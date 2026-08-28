import type { CvSharePresentation } from '@/features/cv-projection/operations'

export type OwnerAuthorizationRow = {
  id: string
  purpose_code: string
  recipient_type: string
  recipient_ref: { id: string; version?: string } | null
  object_ref: { id: string; version?: string } | null
  data_category: string | null
  state: string
  effective_at: string
  expires_at: string | null
  revoked_at: string | null
}

function isCurrentlyActive(row: OwnerAuthorizationRow, nowMs: number): boolean {
  if (row.state !== 'ACTIVE') return false
  if (row.revoked_at) return false
  if (Date.parse(row.effective_at) > nowMs) return false
  if (row.expires_at && Date.parse(row.expires_at) < nowMs) return false
  return true
}

function coversCv(row: OwnerAuthorizationRow, cvId: string): boolean {
  if (row.object_ref?.id === cvId) return true
  if (row.data_category === 'CV' || row.data_category === 'CAREER_RECORD') return true
  return false
}

/**
 * Share is authorized only from an exact active C5 authorization.
 * Selection, verification, affiliation, and staff role never imply share.
 */
export function resolveCvSharePresentation(
  authorizations: readonly OwnerAuthorizationRow[],
  cvId: string,
  nowMs = Date.now(),
): CvSharePresentation {
  const match = authorizations.find(
    (row) =>
      isCurrentlyActive(row, nowMs) &&
      coversCv(row, cvId) &&
      (row.purpose_code === 'PUBLIC_SHARE' ||
        row.purpose_code === 'APPLICATION' ||
        row.purpose_code === 'RECIPIENT_DISCLOSURE' ||
        row.recipient_type === 'PUBLIC'),
  )
  if (!match) return { kind: 'private' }

  const recipientLabel =
    match.recipient_type === 'PUBLIC'
      ? 'PUBLIC'
      : (match.recipient_ref?.id ?? match.recipient_type)

  return {
    kind: 'authorized',
    purpose:
      match.purpose_code === 'APPLICATION'
        ? 'APPLICATION'
        : match.purpose_code === 'RECIPIENT_DISCLOSURE'
          ? 'RECIPIENT_DISCLOSURE'
          : 'PUBLIC_SHARE',
    recipient_label: recipientLabel,
    authorization_ref: { id: match.id },
  }
}
