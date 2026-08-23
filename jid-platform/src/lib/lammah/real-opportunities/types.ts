export const LAMMAH_LIFECYCLE_STATUSES = [
  'open',
  'upcoming',
  'closed',
  'unknown',
] as const
export type LammahLifecycleStatus = (typeof LAMMAH_LIFECYCLE_STATUSES)[number]

export const LAMMAH_RESEARCH_OPPORTUNITY_TYPES = [
  'job',
  'co_op',
  'internship',
  'fellowship',
  'scholarship',
] as const
export type LammahResearchOpportunityType =
  (typeof LAMMAH_RESEARCH_OPPORTUNITY_TYPES)[number]

export const LAMMAH_SOURCE_TIERS = ['A', 'B', 'C'] as const
export type LammahSourceTier = (typeof LAMMAH_SOURCE_TIERS)[number]

export const LAMMAH_SOURCE_TYPES = [
  'career_page',
  'official_program',
  'official_government_portal',
  'official_university_program',
] as const
export type LammahResearchSourceType = (typeof LAMMAH_SOURCE_TYPES)[number]

/** Current `lammah_sources.source_type` check constraint. Schema wins. */
export const LAMMAH_REGISTRY_SOURCE_TYPES = [
  'career_page',
  'rss',
  'api',
  'official_program',
] as const
export type LammahRegistrySourceType = (typeof LAMMAH_REGISTRY_SOURCE_TYPES)[number]

export function toRegistrySourceType(
  sourceType: LammahResearchSourceType,
): Extract<LammahRegistrySourceType, 'career_page' | 'official_program'> {
  return sourceType === 'career_page' ? 'career_page' : 'official_program'
}

export const INGEST_RECORD_KEYS = [
  'source_record_id',
  'checksum_sha256',
  'request_identity',
  'source_page_url',
  'apply_url',
  'final_apply_url',
  'redirect_chain',
  'url_validation_evidence',
  'retrieved_at',
  'source_published_at',
  'source_deadline_at',
  'opportunity_type',
  'title_original',
  'title_ar',
  'title_en',
  'organization_raw_name',
  'location_country',
  'location_region',
  'location_city',
  'payload_body',
  'sanitized_projection',
  'content_type',
  'personal_data_dominated',
  'hostile_content',
] as const
export type IngestRecordKey = (typeof INGEST_RECORD_KEYS)[number]

export type LammahIngestRecord = {
  source_record_id: string
  checksum_sha256: string
  request_identity: string
  source_page_url: string
  apply_url: string
  final_apply_url: string
  redirect_chain: string[]
  url_validation_evidence: {
    status_code: number
    method: 'manual_official_page_review'
    checked_at: string
    final_destination: string
  }
  retrieved_at: string
  source_published_at: string | null
  source_deadline_at: string | null
  opportunity_type: LammahResearchOpportunityType
  title_original: string
  title_ar: string | null
  title_en: string | null
  organization_raw_name: string
  location_country: string | null
  location_region: string | null
  location_city: string | null
  payload_body: string
  sanitized_projection: {
    title: string
    organization_name: string
    short_summary_ar: string
    short_summary_en: string
    evidence_note: string
  }
  content_type: 'application/json'
  personal_data_dominated: false
  hostile_content: false
}

export const ORGANIZATION_MAPPING_STATUSES = [
  'mapped_pending_catalog_uuid',
  'ORG_MAPPING_REQUIRED',
  'unresolved',
] as const
export type OrganizationMappingStatus =
  (typeof ORGANIZATION_MAPPING_STATUSES)[number]

export const PUBLICATION_READINESS_STATES = [
  'READY_FOR_REVIEW',
  'READY_FOR_IMPORT_REVIEW',
  'EXCLUDED_CLOSED',
  'EXCLUDED_UNKNOWN',
  'EXCLUDED_TIER_C_ONLY',
  'EXCLUDED_MALFORMED',
] as const
export type PublicationReadiness = (typeof PUBLICATION_READINESS_STATES)[number]

export type DeadlinePrecision = 'date_only' | 'timestamp' | 'absent'

export type ResearchOpportunityInput = {
  source_record_key: string
  source_stable_id: string
  raw_title: string
  title_ar: string | null
  title_en: string | null
  raw_organization_name: string
  opportunity_type: LammahResearchOpportunityType
  source_url: string
  apply_url: string
  source_type: LammahResearchSourceType
  source_tier: LammahSourceTier
  official_source_hosts: readonly string[]
  allowed_apply_hosts: readonly string[]
  location_country: string | null
  location_region: string | null
  location_city: string | null
  sector_slug: string | null
  qualification: string | null
  specializations: string | null
  eligibility: string | null
  experience_requirement: string | null
  work_mode: 'remote' | 'onsite' | 'hybrid' | null
  opens_at: string | null
  deadline_at: string | null
  deadline_precision: DeadlinePrecision
  source_published_at: string | null
  apply_cta_present: boolean
  filled_or_closed_banner: boolean
  evidence_note: string
  short_summary_ar: string
  short_summary_en: string
  checked_at: string
}

export type DirectoryAnchor = {
  canonical_name_en: string
  canonical_name_ar: string
  domains: readonly string[]
  mapping_status: OrganizationMappingStatus
  catalog_dependency: boolean
}

export type DuplicateSignal =
  | 'source_stable_id'
  | 'normalized_apply_url'
  | 'normalized_source_url'
  | 'org_title_location_window'

export type DuplicateMatch = {
  other_source_record_key: string
  signals: DuplicateSignal[]
  merge: boolean
}

export type ValidatedOpportunity = {
  source_record_key: string
  source_stable_id: string
  title: string
  title_ar: string | null
  title_en: string | null
  normalized_title: string
  organization_name: string
  normalized_organization_name: string
  opportunity_type: LammahResearchOpportunityType
  lifecycle_status: LammahLifecycleStatus
  source_url: string
  apply_url: string
  normalized_source_url: string | null
  normalized_apply_url: string | null
  source_and_apply_identical: boolean
  source_type: LammahResearchSourceType
  source_tier: LammahSourceTier
  location_country: string | null
  location_region: string | null
  location_city: string | null
  sector_slug: string | null
  qualification: string | null
  specializations: string | null
  eligibility: string | null
  experience_requirement: string | null
  work_mode: 'remote' | 'onsite' | 'hybrid' | null
  opens_at: string | null
  deadline_at: string | null
  deadline_precision: DeadlinePrecision
  source_published_at: string | null
  checked_at: string
  evidence_note: string
  short_summary_ar: string
  short_summary_en: string
  organization_mapping_status: OrganizationMappingStatus
  organization_mapping_method: 'official_domain' | 'none'
  catalog_org_dependency: boolean
  directory_company_id: string | null
  publication_readiness: PublicationReadiness
  review_flags: string[]
  duplicate_key: string
  checksum_sha256: string
  quarantine_reason: string | null
}

export type DryRunSourceProposal = {
  source_key: string
  name: string
  base_url: string
  source_type: Extract<LammahRegistrySourceType, 'career_page' | 'official_program'>
  research_source_type: LammahResearchSourceType
  approval_state: 'candidate'
  auto_publication_enabled: false
  allowed_source_hosts: string[]
  allowed_apply_hosts: string[]
  supported_opportunity_types: LammahResearchOpportunityType[]
}

export type DryRunImportAction = {
  action: 'register_source_candidate' | 'ingest_review_candidate'
  source_key: string
  source_record_key: string | null
  intended_state: 'pending_review' | 'quarantined' | 'rejected'
  remote_write: false
}

export type DryRunReport = {
  research_run_id: string
  generated_at: string
  timezone: 'Asia/Riyadh'
  remote_write: false
  counts: {
    researched: number
    open: number
    upcoming: number
    closed: number
    unknown: number
    publish_review_candidates: number
    excluded: number
    duplicates_detected: number
  }
  candidates: ValidatedOpportunity[]
  excluded: ValidatedOpportunity[]
  duplicates: DuplicateMatch[]
  source_proposals: DryRunSourceProposal[]
  ingest_records: LammahIngestRecord[]
  import_actions: DryRunImportAction[]
  side_effects: {
    business_profiles: 0
    university_profiles: 0
    verification_requests: 0
    companies_created: 0
    ownership_changed: 0
    abhathli: 0
    professional_discovery: 0
    remote_nonprod_import: 0
  }
}
