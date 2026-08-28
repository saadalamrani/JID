/**
 * Frozen CV projection Core operation shapes for the Wave 2 experience layer.
 * These are integration capabilities, not HTTP routes or backend implementations.
 */

import type { CareerEvidence, ContractId, ContractReference, IsoTimestamp } from '@/types/contracts'
import type { CoreResult } from '@/features/career-record/operations'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import type { Locale } from '@/lib/i18n/config'

export type CvProjectionCoreOperationName =
  | 'getCvProjection'
  | 'updateCvPresentation'
  | 'setCvEvidenceSelection'
  | 'previewCvProjection'
  | 'createCvSnapshot'

export const CV_PROJECTION_CORE_OPERATIONS = [
  'getCvProjection',
  'updateCvPresentation',
  'setCvEvidenceSelection',
  'previewCvProjection',
  'createCvSnapshot',
] as const satisfies readonly CvProjectionCoreOperationName[]

export const CV_PROJECTION_SECTION_KEYS = [
  'HEADER',
  'SUMMARY',
  'EXPERIENCE',
  'EDUCATION',
  'SKILLS',
  'CREDENTIALS',
  'PROJECTS',
  'AWARDS',
  'LANGUAGES',
  'VOLUNTEERING',
  'PUBLICATIONS',
  'OTHER',
] as const
export type CvProjectionSectionKey = (typeof CV_PROJECTION_SECTION_KEYS)[number]

export const CV_PRESENTATION_PAYLOAD_KEYS = [
  'display_title',
  'summary',
  'selected_bullets',
  'section_label',
  'locale_variant',
  'notes',
] as const
export type CvPresentationPayloadKey = (typeof CV_PRESENTATION_PAYLOAD_KEYS)[number]

export type CvPresentationPayload = {
  display_title?: string
  summary?: string
  selected_bullets?: readonly string[]
  section_label?: string
  locale_variant?: string
  notes?: string
}

export type CvProjectionItem = {
  evidence_id: ContractId
  section_key: CvProjectionSectionKey
  sort_order: number
  is_selected: boolean
  presentation_payload: CvPresentationPayload
}

export type CvProjectionSection = {
  section_key: CvProjectionSectionKey
  heading_override: string | null
  sort_order: number
  is_visible: boolean
}

export const CV_SNAPSHOT_PURPOSES = [
  'EXPORT',
  'APPLICATION',
  'PUBLIC_SHARE',
  'PROFILE_PREVIEW',
  'RECIPIENT_DISCLOSURE',
] as const
export type CvSnapshotPurpose = (typeof CV_SNAPSHOT_PURPOSES)[number]

export type CvSharePresentation =
  | { kind: 'private' }
  | { kind: 'awaiting_authorization' }
  | {
      kind: 'authorized'
      purpose: CvSnapshotPurpose
      recipient_label: string
      authorization_ref: ContractReference
    }

export type CvProjection = {
  cv_id: ContractId
  title: string | null
  summary: string | null
  locale: Locale
  template_key: CvExportFormatKey
  share: CvSharePresentation
  sections: readonly CvProjectionSection[]
  items: readonly CvProjectionItem[]
  evidence: readonly CareerEvidence[]
  updated_at?: IsoTimestamp
}

export type CvPresentationPatch = {
  title?: string | null
  summary?: string | null
  locale?: Locale
  template_key?: CvExportFormatKey
  section_order?: readonly CvProjectionSectionKey[]
  item_presentation?: {
    evidence_id: ContractId
    presentation_payload: CvPresentationPayload
  }
}

export type SetCvEvidenceSelectionInput = {
  cv_id: ContractId
  section_key: CvProjectionSectionKey
  ordered_evidence_ids: readonly ContractId[]
}

export type CreateCvSnapshotInput = {
  cv_id: ContractId
  purpose: CvSnapshotPurpose
  authorization_ref?: ContractReference
}

export type CvProjectionPort = {
  readonly availability: 'ready' | 'unavailable'
  getCvProjection(cvId?: ContractId): Promise<CoreResult<CvProjection>>
  updateCvPresentation(
    cvId: ContractId,
    patch: CvPresentationPatch,
  ): Promise<CoreResult<CvProjection>>
  setCvEvidenceSelection(input: SetCvEvidenceSelectionInput): Promise<CoreResult<CvProjection>>
  previewCvProjection(cvId: ContractId): Promise<CoreResult<CvProjection>>
  createCvSnapshot(input: CreateCvSnapshotInput): Promise<CoreResult<{ snapshot_id: ContractId }>>
}

export const CATEGORY_TO_SECTION: Record<CareerEvidence['category'], CvProjectionSectionKey> = {
  EDUCATION: 'EDUCATION',
  EXPERIENCE: 'EXPERIENCE',
  SKILL: 'SKILLS',
  PROJECT: 'PROJECTS',
  CREDENTIAL: 'CREDENTIALS',
  AWARD: 'AWARDS',
  LANGUAGE: 'LANGUAGES',
  VOLUNTEERING: 'VOLUNTEERING',
  PUBLICATION: 'PUBLICATIONS',
  OTHER: 'OTHER',
}

export function defaultCvProjectionSections(): CvProjectionSection[] {
  return CV_PROJECTION_SECTION_KEYS.map((section_key, sort_order) => ({
    section_key,
    heading_override: null,
    sort_order,
    is_visible: true,
  }))
}
