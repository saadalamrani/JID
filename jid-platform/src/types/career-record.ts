/**
 * JID Wave 2 / Front 2A — Career Record + CV Projection domain types.
 *
 * These mirror the frozen contracts in `src/types/contracts/career-evidence.ts`
 * and `src/types/contracts/disclosure.ts`. The physical schema (migration
 * 20260827120000) adapts to these shapes; physical helper IDs never weaken the
 * contract. Legacy `CvRecord` is NOT re-exported or aliased as `CareerEvidence`.
 */
import type {
  CareerEvidenceCategory,
  CareerEvidenceSourceClass,
  CareerEvidenceState,
} from './contracts/career-evidence'
import type { DisclosureRecipientType } from './contracts/disclosure'

export type CareerEvidenceLifecycle = 'ACTIVE' | 'DISPUTED' | 'REVOKED' | 'EXPIRED'

export type CvSnapshotPurpose =
  | 'EXPORT'
  | 'APPLICATION'
  | 'PUBLIC_SHARE'
  | 'PROFILE_PREVIEW'
  | 'RECIPIENT_DISCLOSURE'

export type CvProjectionSectionKey =
  | 'HEADER'
  | 'SUMMARY'
  | 'EXPERIENCE'
  | 'EDUCATION'
  | 'SKILLS'
  | 'CREDENTIALS'
  | 'PROJECTS'
  | 'AWARDS'
  | 'LANGUAGES'
  | 'VOLUNTEERING'
  | 'PUBLICATIONS'
  | 'OTHER'

/** A single immutable fact/provenance revision of one canonical evidence root. */
export interface CareerEvidenceRevision {
  id: string
  evidence_id: string
  subject_id: string
  revision_no: number
  contract_version: '1.0'
  fact_payload: Record<string, unknown>
  source_class: CareerEvidenceSourceClass
  source_ref: { id: string; version?: string } | null
  verification_state: CareerEvidenceState
  effective_from: string | null
  effective_to: string | null
  observed_at: string | null
  supersedes_revision_id: string | null
  dispute_ref: { id: string; version?: string } | null
  revocation_or_expiry_ref: { id: string; version?: string } | null
  primary_artifact_id: string | null
  created_at: string
}

/** Stable root identity for one subject-owned career fact lineage. */
export interface CareerEvidenceRoot {
  id: string
  subject_id: string
  category: CareerEvidenceCategory
  disclosure_policy_id: string
  current_revision_id: string | null
  lifecycle_state: CareerEvidenceLifecycle
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** Owner-facing view: current revision + explicit lifecycle/provenance. */
export interface CareerEvidenceView extends CareerEvidenceRoot {
  current_revision: CareerEvidenceRevision | null
}

export interface CareerEvidenceWithHistory extends CareerEvidenceView {
  /** Ordered oldest -> newest. `CORRECTED` is derived from the successor chain,
   *  never persisted as a revision state. */
  revisions: CareerEvidenceRevision[]
}

export interface CareerEvidenceDisclosurePolicy {
  id: string
  subject_id: string
  contract_version: '1.0'
  default_visibility: 'PRIVATE'
  supersedes_policy_id: string | null
  created_at: string
}

export interface CvProjectionSection {
  id: string
  cv_id: string
  section_key: CvProjectionSectionKey
  heading_override: string | null
  sort_order: number
  is_visible: boolean
  presentation_settings: Record<string, unknown>
}

export interface CvProjectionItem {
  id: string
  cv_id: string
  section_id: string
  evidence_id: string
  sort_order: number
  is_selected: boolean
  /** Whitelisted presentation keys only — never canonical fact keys. */
  presentation_payload: {
    display_title?: string
    summary?: string
    selected_bullets?: string[]
    section_label?: string
    locale_variant?: string
    notes?: string
  }
}

export interface CvProjection {
  cv_id: string
  sections: CvProjectionSection[]
  items: CvProjectionItem[]
  /** Selected evidence resolved to its current revision, keyed by evidence_id. */
  evidence: Record<string, CareerEvidenceView>
}

export interface CvSnapshot {
  id: string
  cv_id: string
  subject_id: string
  purpose: CvSnapshotPurpose
  application_id: string | null
  disclosure_authorization_id: string | null
  projection_version: number
  locale: 'ar' | 'en'
  template_key: string
  content_sha256: string
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

// ---- Service inputs ------------------------------------------------------------

export interface CreateDeclaredCareerEvidenceInput {
  category: CareerEvidenceCategory
  fact_payload: Record<string, unknown>
  effective_from?: string
  effective_to?: string
  observed_at?: string
}

export interface ReviseCareerEvidenceInput {
  fact_payload: Record<string, unknown>
  effective_from?: string
  effective_to?: string
  observed_at?: string
}

export type CareerEvidenceLifecycleAction =
  | 'archive'
  | 'unarchive'
  | 'dispute'
  | 'revoke'
  | 'expire'

export interface UpdateCvPresentationInput {
  title?: string
  summary?: string
  template_key?: string
  locale?: 'ar' | 'en'
  section_order?: { section_key: CvProjectionSectionKey; sort_order: number }[]
  section_headings?: { section_key: CvProjectionSectionKey; heading_override: string | null }[]
}

export interface CreateCvSnapshotInput {
  cv_id: string
  purpose: CvSnapshotPurpose
  locale: 'ar' | 'en'
  template_key: string
  snapshot_payload: Record<string, unknown>
  manifest: { evidence_id: string; revision_id: string }[]
  retention_policy_ref: { id: string; version?: string }
  application_id?: string
  authorization_ref?: { id: string; version?: string }
  expires_at?: string
}

export interface AuthorizeCareerEvidenceDisclosureInput {
  subject_id: string
  object_ref?: { id: string; version?: string }
  data_category?: string
  recipient_type: DisclosureRecipientType
  recipient_ref?: { id: string; version?: string }
  purpose_code: string
  basis_type:
    | 'CONSENT'
    | 'CONTRACT'
    | 'LEGAL_OBLIGATION'
    | 'LEGITIMATE_AUTHORITY'
    | 'PUBLIC_TASK'
    | 'OTHER_REVIEWED'
  basis_ref: { id: string; version?: string }
  retention_policy_ref: { id: string; version?: string }
  effective_at: string
  expires_at?: string
}
