/**
 * Wave 3 frozen discovery read contract (Front A ↔ Front B).
 * See docs/command-center/wave-3/WAVE_3_DOMAIN_CONTRACT.md
 */

import type { JobsListResult } from '@/types/job'
import type { LammahPageState } from '@/types/lammah'

export const OPPORTUNITY_DISCOVERY_FAMILIES = [
  'JOB',
  'INTERNSHIP',
  'COOP',
  'GRADUATE_PROGRAM',
  'FELLOWSHIP',
  'SCHOLARSHIP',
] as const
export type OpportunityDiscoveryFamily = (typeof OPPORTUNITY_DISCOVERY_FAMILIES)[number]

export const OPPORTUNITY_SOURCE_CLASSES = ['JID_NATIVE', 'GOVERNED_EXTERNAL'] as const
export type OpportunitySourceClass = (typeof OPPORTUNITY_SOURCE_CLASSES)[number]

export const OPPORTUNITY_APPLY_AUTHORITIES = [
  'JID_NATIVE',
  'OFFICIAL_EXTERNAL',
  'REDIRECT_ONLY',
  'UNAVAILABLE',
] as const
export type OpportunityDiscoveryApplyAuthority =
  (typeof OPPORTUNITY_APPLY_AUTHORITIES)[number]

export const OPPORTUNITY_DISCOVERY_LIFECYCLES = [
  'PUBLISHED',
  'ACTIVE_EXTERNAL',
  'CLOSED',
  'EXPIRED',
  'SUPERSEDED',
  'HIDDEN',
] as const
export type OpportunityDiscoveryLifecycle =
  (typeof OPPORTUNITY_DISCOVERY_LIFECYCLES)[number]

export type OpportunityDiscoveryItem = {
  opportunity_id: string
  opportunity_family: OpportunityDiscoveryFamily
  source_class: OpportunitySourceClass
  source_ref: string
  source_record_ref: string
  source_name?: string
  source_approval_state?: string
  organization_ref_id?: string
  organization_name?: string
  organization_logo_url?: string
  title: { ar?: string; en?: string }
  excerpt?: string
  location?: {
    country?: string
    region?: string
    city?: string
    is_remote?: boolean
  }
  published_at?: string
  last_confirmed_at?: string
  expires_at?: string
  apply_authority: OpportunityDiscoveryApplyAuthority
  apply_url?: string
  source_url?: string
  lifecycle_state: OpportunityDiscoveryLifecycle
}

export type OpportunityDiscoveryPage = {
  native: OpportunityDiscoveryItem[]
  external: OpportunityDiscoveryItem[]
  externalEntitled: boolean
  externalAvailable: boolean
  merged: OpportunityDiscoveryItem[]
  /** Compatibility payload for the existing native filter board (Front B). */
  nativeJobsResult?: JobsListResult
  /** Compatibility payload for the existing Lammah feed (Front B). */
  externalLammahState?: LammahPageState
}

export function nativeOpportunityId(jobId: string): string {
  return `native:${jobId}`
}

export function externalOpportunityId(lammahId: string): string {
  return `external:${lammahId}`
}

export function parseOpportunityId(
  opportunityId: string,
): { source_class: OpportunitySourceClass; record_id: string } | null {
  if (opportunityId.startsWith('native:')) {
    return { source_class: 'JID_NATIVE', record_id: opportunityId.slice('native:'.length) }
  }
  if (opportunityId.startsWith('external:')) {
    return {
      source_class: 'GOVERNED_EXTERNAL',
      record_id: opportunityId.slice('external:'.length),
    }
  }
  return null
}
