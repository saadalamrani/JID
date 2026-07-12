import type { OwnershipType } from '@/types/catalog'

/** Serializable company context for job posting wizard (Section 6.1). */
export type ApprovedCompanyPoster = {
  userId: string
  /** Layer-3 anchor — required for new job INSERT (P-104). */
  businessProfileId: string | null
  /** verified_domains ∪ companies.domains for apply-link validation (P-104). */
  trustedDomains: string[]
  company: {
    id: string
    name: string
    name_ar: string | null
    logo_url: string | null
    ownership_type: OwnershipType | null
    domains: string[]
    entity_state: string
  }
}
