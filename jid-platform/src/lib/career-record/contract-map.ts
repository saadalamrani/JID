import type {
  AuthorizedCareerEvidenceDisclosure,
  CareerEvidence,
  CareerEvidenceCategory,
  CareerEvidenceSourceClass,
  CareerEvidenceState,
  DisclosureAuthorization,
  DisclosureRecipientType,
} from '@/types/contracts'
import type { CoreResult } from '@/features/career-record/operations'
import type {
  CvProjection as PortCvProjection,
  CvProjectionItem as PortCvProjectionItem,
  CvProjectionSection as PortCvProjectionSection,
  CvProjectionSectionKey,
  CvSharePresentation,
} from '@/features/cv-projection/operations'
import { CATEGORY_TO_SECTION, defaultCvProjectionSections } from '@/features/cv-projection/operations'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import type { Locale } from '@/lib/i18n/config'
import type {
  CareerEvidenceRevision,
  CareerEvidenceView,
  CareerEvidenceWithHistory,
  CvProjection,
} from '@/types/career-record'
import { CareerRecordError } from './errors'

const SOURCE_CLASSES: ReadonlySet<string> = new Set([
  'SELF_DECLARED',
  'ISSUER_VERIFIED',
  'ORGANIZATION_CONFIRMED',
  'SYSTEM_OBSERVED',
  'THIRD_PARTY_SOURCED',
  'DERIVED_EXPLAINABLE',
])

const CATEGORIES: ReadonlySet<string> = new Set([
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
])

function asCategory(value: string): CareerEvidenceCategory {
  if (CATEGORIES.has(value)) return value as CareerEvidenceCategory
  return 'OTHER'
}

function asSourceClass(value: string): CareerEvidenceSourceClass {
  if (SOURCE_CLASSES.has(value)) return value as CareerEvidenceSourceClass
  return 'SELF_DECLARED'
}

function asState(value: string): CareerEvidenceState {
  switch (value) {
    case 'DECLARED':
    case 'VERIFIED':
    case 'CONFIRMED':
    case 'SOURCED':
    case 'DERIVED':
    case 'DISPUTED':
    case 'CORRECTED':
    case 'REVOKED':
    case 'EXPIRED':
      return value
    default:
      return 'DECLARED'
  }
}

function derivedVerificationState(
  view: CareerEvidenceView,
  revision: CareerEvidenceRevision | null,
  successorExists: boolean,
): CareerEvidenceState {
  if (view.lifecycle_state === 'DISPUTED') return 'DISPUTED'
  if (view.lifecycle_state === 'REVOKED') return 'REVOKED'
  if (view.lifecycle_state === 'EXPIRED') return 'EXPIRED'
  if (successorExists) return 'CORRECTED'
  return asState(revision?.verification_state ?? 'DECLARED')
}

export function toContractEvidence(
  view: CareerEvidenceView,
  options?: { successorExists?: boolean },
): CareerEvidence | null {
  const revision = view.current_revision
  if (!revision) return null

  const evidence: CareerEvidence = {
    contract_version: '1.0',
    evidence_id: view.id,
    subject_id: view.subject_id,
    category: asCategory(view.category),
    fact_payload: revision.fact_payload,
    source_class: asSourceClass(revision.source_class),
    verification_state: derivedVerificationState(view, revision, options?.successorExists === true),
    revision_no: revision.revision_no,
    disclosure_policy_ref: { id: view.disclosure_policy_id, version: '1.0' },
  }

  if (revision.source_ref) evidence.source_ref = revision.source_ref
  if (revision.effective_from) evidence.effective_from = revision.effective_from
  if (revision.effective_to) evidence.effective_to = revision.effective_to
  if (revision.observed_at) evidence.observed_at = revision.observed_at
  if (revision.supersedes_revision_id) {
    evidence.supersedes_evidence_id = view.id
  }
  if (revision.dispute_ref) evidence.dispute_ref = revision.dispute_ref
  if (revision.revocation_or_expiry_ref) {
    evidence.revocation_or_expiry_ref = revision.revocation_or_expiry_ref
  }
  if (revision.primary_artifact_id) {
    evidence.evidence_artifact_ref = { id: revision.primary_artifact_id }
  }

  return evidence
}

export function toContractHistory(history: CareerEvidenceWithHistory): {
  current: CareerEvidence
  revisions: CareerEvidence[]
} | null {
  const revisions = history.revisions.map((revision, index) => {
    const successorExists = index < history.revisions.length - 1
    const view: CareerEvidenceView = {
      ...history,
      current_revision: revision,
    }
    return toContractEvidence(view, { successorExists })
  })
  const mapped = revisions.filter((item): item is CareerEvidence => item !== null)
  const current = toContractEvidence(history)
  if (!current) return null
  return { current, revisions: mapped }
}

export function toPortCvProjection(
  projection: CvProjection,
  extras: {
    title: string | null
    summary: string | null
    locale: Locale
    template_key: CvExportFormatKey
    share: CvSharePresentation
    updated_at?: string
  },
): PortCvProjection {
  const sectionById = new Map(projection.sections.map((section) => [section.id, section]))
  const items: PortCvProjectionItem[] = projection.items.map((item) => {
    const section = sectionById.get(item.section_id)
    const evidence = projection.evidence[item.evidence_id]
    const sectionKey: CvProjectionSectionKey =
      section?.section_key ??
      (evidence ? CATEGORY_TO_SECTION[asCategory(evidence.category)] : 'OTHER')
    return {
      evidence_id: item.evidence_id,
      section_key: sectionKey,
      sort_order: item.sort_order,
      is_selected: item.is_selected,
      presentation_payload: item.presentation_payload,
    }
  })

  const sections: PortCvProjectionSection[] =
    projection.sections.length > 0
      ? projection.sections.map((section) => ({
          section_key: section.section_key,
          heading_override: section.heading_override,
          sort_order: section.sort_order,
          is_visible: section.is_visible,
        }))
      : defaultCvProjectionSections()

  const evidence = Object.values(projection.evidence)
    .map((view) => toContractEvidence(view))
    .filter((item): item is CareerEvidence => item !== null)

  return {
    cv_id: projection.cv_id,
    title: extras.title,
    summary: extras.summary,
    locale: extras.locale,
    template_key: extras.template_key,
    share: extras.share,
    sections,
    items,
    evidence,
    updated_at: extras.updated_at,
  }
}

export function toAuthorizedDisclosure(
  evidence: CareerEvidence,
  row: {
    authorization_id: string
    subject_id: string
    purpose_code: string
    recipient_type: string
    recipient_ref: { id: string; version?: string } | null
    state: string
    effective_at: string
    expires_at: string | null
    basis_type: string
    basis_ref: { id: string; version?: string }
    retention_policy_ref: { id: string; version?: string }
    object_ref: { id: string; version?: string } | null
    data_category: string | null
  },
): AuthorizedCareerEvidenceDisclosure {
  const recipientType = row.recipient_type as DisclosureRecipientType
  const authorization: DisclosureAuthorization = {
    contract_version: '1.0',
    authorization_id: row.authorization_id,
    subject_id: row.subject_id,
    purpose_code: row.purpose_code,
    recipient:
      recipientType === 'PUBLIC'
        ? { recipient_type: 'PUBLIC' }
        : {
            recipient_type: recipientType,
            recipient_ref: row.recipient_ref ?? { id: 'unknown' },
          },
    basis: {
      basis_type: row.basis_type as DisclosureAuthorization['basis']['basis_type'],
      basis_ref: row.basis_ref,
    },
    lifecycle: {
      state: row.state as DisclosureAuthorization['lifecycle']['state'],
      effective_at: row.effective_at,
      expires_at: row.expires_at ?? undefined,
    },
    retention_policy_ref: row.retention_policy_ref,
    created_by: { id: row.subject_id },
    ...(row.object_ref
      ? { object_ref: row.object_ref }
      : { data_category: row.data_category ?? 'UNKNOWN' }),
  }

  return {
    evidence: { ...evidence, disclosure_authorization_ref: { id: row.authorization_id } },
    authorization,
  }
}

export function okResult<T>(data: T): CoreResult<T> {
  return { status: 'ok', data }
}

export function coreResultFromError<T>(error: unknown): CoreResult<T> {
  if (error instanceof CareerRecordError) {
    if (error.status === 401 || error.status === 403) return { status: 'forbidden' }
    return { status: 'error', message: error.message }
  }
  return { status: 'error', message: 'تعذر إكمال العملية' }
}
