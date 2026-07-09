export const STAFF_ENTITIES_PAGE_SIZE = 25

export type StaffOwnershipFilter = 'all' | 'government' | 'semi_government' | 'private'

export type StaffEntitiesListFilters = {
  q?: string
  ownership?: StaffOwnershipFilter
  regionId?: string
  page?: number
}

export type StaffEntityListRow = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  ownership_type: string | null
  region_name: string | null
  created_at: string
  updated_at: string
}

export type StaffEntitiesListResult = {
  rows: StaffEntityListRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type StaffEntityDetail = {
  id: string
  name: string
  name_ar: string | null
  entity_type: string
  entity_state: string
  ownership_type: string | null
  sector_id: string | null
  sector_name: string | null
  region_id: string | null
  region_name: string | null
  description_en: string | null
  description_ar: string | null
  logo_url: string | null
  website_url: string | null
  response_rate_pct: number | null
  avg_response_days: number | null
  total_jobs_posted_12mo: number
  is_verified: boolean
  claimed_by: string | null
  claimant_name: string | null
  city: string | null
  domains: string[]
  created_at: string
  updated_at: string
}

export type StaffEntityResponseStats = {
  source: 'view' | 'company_columns'
  response_rate_pct: number | null
  avg_response_days: number | null
  total_jobs_posted_12mo: number
  viewAvailable: boolean
}

export type StaffEntitySlaEvent = {
  id: string
  kind: 'application_expired' | 'audit'
  summary: string
  occurred_at: string
  status: string | null
}

export type StaffEntityMetadataInput = {
  sectorId: string | null
  regionId: string | null
  descriptionEn: string | null
  descriptionAr: string | null
  logoUrl: string | null
}

export type StaffRegionOption = {
  id: string
  name_en: string
  name_ar: string | null
}

export type StaffSectorOption = {
  id: string
  name_en: string
  name_ar: string | null
}
