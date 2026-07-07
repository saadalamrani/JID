export const SYS_ENTITIES_PAGE_SIZE = 25

export type SysEntityTypeFilter = 'all' | 'company' | 'university'

export type SysEntityStateFilter =
  | 'all'
  | 'unclaimed'
  | 'pending'
  | 'pending_review'
  | 'approved'
  | 'suspended'

export type SysEntitiesListFilters = {
  q?: string
  entityType?: SysEntityTypeFilter
  state?: SysEntityStateFilter
  page?: number
}

export type SysEntityListRow = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  entity_state: string
  is_verified: boolean
  claimed_by: string | null
  created_at: string
  updated_at: string
}

export type SysEntitiesListResult = {
  rows: SysEntityListRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SysEntityDetail = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  entity_state: string
  is_verified: boolean
  claimed_by: string | null
  claim_requested_at: string | null
  website_url: string | null
  tagline_en: string | null
  tagline_ar: string | null
  description_en: string | null
  description_ar: string | null
  domains: string[]
  city: string | null
  created_at: string
  updated_at: string
  claimant_name: string | null
}

export type SysEntityClaimRow = {
  id: string
  user_id: string
  status: string
  claim_type: string
  claimant_name: string
  business_email: string
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  rejection_reason: string | null
}

export type SysEntityMetadataInput = {
  name?: string
  name_ar?: string | null
  website_url?: string | null
  tagline_en?: string | null
  tagline_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
}
