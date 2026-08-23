import type {
  PublicationReadiness,
  ResearchOpportunityInput,
  ValidatedOpportunity,
} from './types'
import { classifyLifecycle, deadlineHasPassed, freshnessIsCurrent } from './lifecycle'
import { firstNonEmpty, normalizeOpportunityTitle } from './normalize'
import { mapOrganization } from './org-mapping'
import { duplicateKey, evidenceChecksum } from './dedup'
import { hostAllowed, normalizeOpportunityUrl, sourceAndApplyAreSeparated } from './urls'

const LAMMAH_REVIEW_FLAGS = [
  'unresolved_organization',
  'url_validation_failure',
  'source_stale',
  'malformed_source',
  'unknown_lifecycle',
] as const

function publicationReadiness(
  lifecycle: ValidatedOpportunity['lifecycle_status'],
  flags: string[],
  tier: ResearchOpportunityInput['source_tier'],
): PublicationReadiness {
  if (tier === 'C') return 'EXCLUDED_TIER_C_ONLY'
  if (flags.includes('malformed_source')) return 'EXCLUDED_MALFORMED'
  if (lifecycle === 'closed') return 'EXCLUDED_CLOSED'
  if (lifecycle === 'unknown') return 'EXCLUDED_UNKNOWN'
  if (lifecycle === 'open' || lifecycle === 'upcoming') return 'READY_FOR_IMPORT_REVIEW'
  return 'EXCLUDED_UNKNOWN'
}

export function validateResearchOpportunity(
  input: ResearchOpportunityInput,
  now: Date,
): ValidatedOpportunity {
  const title = firstNonEmpty(input.title_en, input.title_ar, input.raw_title)
  const organizationName = input.raw_organization_name.trim()
  const sourceUrlOk = hostAllowed(input.source_url, input.official_source_hosts)
  const applyUrlOk = hostAllowed(input.apply_url, input.allowed_apply_hosts)
  const urlParts = sourceAndApplyAreSeparated(input.source_url, input.apply_url)
  const malformed =
    !title
    || !organizationName
    || !sourceUrlOk
    || !applyUrlOk
    || urlParts.sourceIsHomepage
    || urlParts.applyIsHomepage
    || !freshnessIsCurrent(input.checked_at, now, 72)

  const lifecycle = malformed
    ? 'unknown'
    : classifyLifecycle({
        now,
        opensAt: input.opens_at,
        deadlineAt: input.deadline_at,
        applyCtaPresent: input.apply_cta_present,
        filledOrClosedBanner: input.filled_or_closed_banner,
        sourceExplicitlyOpen: input.apply_cta_present && !input.filled_or_closed_banner,
      })

  const mapping = mapOrganization({
    organizationName,
    sourceUrl: input.source_url,
    applyUrl: input.apply_url,
  })

  const reviewFlags: string[] = []
  if (malformed) reviewFlags.push('malformed_source')
  if (!sourceUrlOk || !applyUrlOk) reviewFlags.push('url_validation_failure')
  if (mapping.status !== 'mapped_pending_catalog_uuid') reviewFlags.push('unresolved_organization')
  if (deadlineHasPassed(input.deadline_at, now)) reviewFlags.push('source_stale')
  if (lifecycle === 'unknown') reviewFlags.push('unknown_lifecycle')

  const candidate: Omit<ValidatedOpportunity, 'publication_readiness' | 'checksum_sha256' | 'duplicate_key'> = {
    source_record_key: input.source_record_key,
    source_stable_id: input.source_stable_id,
    title,
    title_ar: input.title_ar,
    title_en: input.title_en,
    normalized_title: normalizeOpportunityTitle(title),
    organization_name: organizationName,
    normalized_organization_name: normalizeOpportunityTitle(organizationName),
    opportunity_type: input.opportunity_type,
    lifecycle_status: lifecycle,
    source_url: input.source_url,
    apply_url: input.apply_url,
    normalized_source_url: normalizeOpportunityUrl(input.source_url),
    normalized_apply_url: normalizeOpportunityUrl(input.apply_url),
    source_and_apply_identical: urlParts.identical,
    source_type: input.source_type,
    source_tier: input.source_tier,
    location_country: input.location_country,
    location_region: input.location_region,
    location_city: input.location_city,
    sector_slug: input.sector_slug,
    qualification: input.qualification,
    specializations: input.specializations,
    eligibility: input.eligibility,
    experience_requirement: input.experience_requirement,
    work_mode: input.work_mode,
    opens_at: input.opens_at,
    deadline_at: input.deadline_at,
    deadline_precision: input.deadline_precision,
    source_published_at: input.source_published_at,
    checked_at: input.checked_at,
    evidence_note: input.evidence_note,
    short_summary_ar: input.short_summary_ar,
    short_summary_en: input.short_summary_en,
    organization_mapping_status: mapping.status,
    organization_mapping_method: mapping.method,
    catalog_org_dependency: mapping.catalogOrgDependency,
    directory_company_id: mapping.directoryCompanyId,
    review_flags: reviewFlags.filter((flag, index, all) =>
      LAMMAH_REVIEW_FLAGS.includes(flag as (typeof LAMMAH_REVIEW_FLAGS)[number])
      && all.indexOf(flag) === index,
    ),
    quarantine_reason: malformed
      ? 'malformed_or_untrusted_source'
      : lifecycle === 'closed'
        ? 'closed_not_live_inventory'
        : lifecycle === 'unknown'
          ? 'unknown_lifecycle'
          : mapping.status === 'ORG_MAPPING_REQUIRED'
            ? 'ORG_MAPPING_REQUIRED'
            : null,
  }

  const duplicate = duplicateKey(candidate)
  const readiness = publicationReadiness(lifecycle, candidate.review_flags, input.source_tier)

  return {
    ...candidate,
    duplicate_key: duplicate,
    publication_readiness: readiness,
    checksum_sha256: evidenceChecksum({
      source_record_key: input.source_record_key,
      source_url: input.source_url,
      apply_url: input.apply_url,
      title,
      organizationName,
      lifecycle,
      checked_at: input.checked_at,
    }),
  }
}

export function isPublishReviewCandidate(candidate: ValidatedOpportunity): boolean {
  return (
    candidate.publication_readiness === 'READY_FOR_IMPORT_REVIEW'
    && (candidate.lifecycle_status === 'open' || candidate.lifecycle_status === 'upcoming')
    && candidate.source_tier !== 'C'
  )
}
