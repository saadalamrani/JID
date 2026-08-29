import type { LammahOpportunityCard, LammahOpportunityType } from '@/types/lammah'
import {
  externalOpportunityId,
  type OpportunityDiscoveryFamily,
  type OpportunityDiscoveryItem,
} from './discovery-types'

const FAMILY_BY_LAMMAH_TYPE: Record<LammahOpportunityType, OpportunityDiscoveryFamily> = {
  job: 'JOB',
  internship: 'INTERNSHIP',
  co_op: 'COOP',
  fellowship: 'FELLOWSHIP',
  scholarship: 'SCHOLARSHIP',
}

export function mapLammahTypeToFamily(
  opportunityType: LammahOpportunityType,
): OpportunityDiscoveryFamily {
  return FAMILY_BY_LAMMAH_TYPE[opportunityType]
}

/**
 * Published Lammah rows store `external_url` as the apply destination.
 * When a distinct source page URL is not present on the card, source_url may
 * equal apply_url — that equality is stated honestly, never assumed as policy.
 */
export function mapLammahCardToDiscoveryItem(
  card: LammahOpportunityCard,
  options?: {
    sourceApprovalState?: string
    sourcePageUrl?: string | null
  },
): OpportunityDiscoveryItem {
  const applyUrl = card.externalUrl.trim()
  const sourcePage = options?.sourcePageUrl?.trim()
  const sourceUrl = sourcePage && sourcePage.length > 0 ? sourcePage : applyUrl
  const titleAr = card.titleAr?.trim() || undefined
  const titleEn = card.titleEn?.trim() || undefined
  const excerpt = card.excerpt?.trim() || undefined

  return {
    opportunity_id: externalOpportunityId(card.id),
    opportunity_family: mapLammahTypeToFamily(card.opportunityType),
    source_class: 'GOVERNED_EXTERNAL',
    source_ref: card.sourceId,
    source_record_ref: card.id,
    source_name: card.sourceName || undefined,
    ...(options?.sourceApprovalState
      ? { source_approval_state: options.sourceApprovalState }
      : {}),
    ...(card.companyId ? { organization_ref_id: card.companyId } : {}),
    organization_name: card.companyNameRaw.trim() || undefined,
    ...(card.companyLogoUrl ? { organization_logo_url: card.companyLogoUrl } : {}),
    title: {
      ...(titleAr ? { ar: titleAr } : {}),
      ...(titleEn ? { en: titleEn } : {}),
    },
    ...(excerpt ? { excerpt } : {}),
    location: {
      ...(card.locationCountry ? { country: card.locationCountry } : {}),
      ...(card.region ? { region: card.region } : {}),
      ...(card.locationCity ? { city: card.locationCity } : {}),
    },
    published_at: card.sourcePublishedAt ?? undefined,
    last_confirmed_at: card.lastConfirmedAt,
    expires_at: card.expiresAt ?? undefined,
    apply_authority: applyUrl ? 'OFFICIAL_EXTERNAL' : 'UNAVAILABLE',
    ...(applyUrl ? { apply_url: applyUrl } : {}),
    ...(sourceUrl ? { source_url: sourceUrl } : {}),
    lifecycle_state: 'ACTIVE_EXTERNAL',
  }
}

/** Source rights conceptual gate used by staff/ingest — not a UI score. */
export function sourceAllowsAutomatedPublication(approvalState: string): boolean {
  return approvalState === 'approved'
}

export function sourceIsCandidateOnly(approvalState: string): boolean {
  return approvalState === 'candidate'
}

export function sourceIsProhibitedOrUnsupported(approvalState: string): boolean {
  return approvalState === 'prohibited' || approvalState === 'unsupported'
}
