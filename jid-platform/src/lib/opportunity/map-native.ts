import type { JobCardData } from '@/types/job'
import {
  nativeOpportunityId,
  type OpportunityDiscoveryItem,
} from './discovery-types'

/**
 * Native JID jobs are Job-family opportunities today.
 * Do not invent internship/co-op labels without a typed column.
 */
export function mapNativeJobToDiscoveryItem(job: JobCardData): OpportunityDiscoveryItem {
  const applyUrl = job.applyUrl?.trim() || undefined
  const titleAr = job.title_ar.trim() || undefined
  const titleEn = job.title_en?.trim() || undefined

  return {
    opportunity_id: nativeOpportunityId(job.id),
    opportunity_family: 'JOB',
    source_class: 'JID_NATIVE',
    source_ref: job.business_profile_id ?? job.company.id,
    source_record_ref: job.id,
    organization_ref_id: job.company.id,
    organization_name: job.company.name_ar || job.company.name_en || undefined,
    organization_logo_url: job.company.logo_url ?? undefined,
    title: {
      ...(titleAr ? { ar: titleAr } : {}),
      ...(titleEn ? { en: titleEn } : {}),
    },
    location: {
      ...(job.city ? { city: job.city } : {}),
      ...(job.region?.name_en || job.region?.name_ar
        ? { region: job.region.name_ar || job.region.name_en || undefined }
        : {}),
      ...(typeof job.is_remote === 'boolean' ? { is_remote: job.is_remote } : {}),
    },
    published_at: job.published_at ?? undefined,
    expires_at: job.application_deadline || undefined,
    apply_authority: applyUrl ? 'JID_NATIVE' : 'JID_NATIVE',
    apply_url: applyUrl,
    source_url: applyUrl,
    lifecycle_state: 'PUBLISHED',
  }
}
