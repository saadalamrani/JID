/**
 * Employer catalog types — Section 4.6 / reconciled Day 1 schema.
 */

export const OWNERSHIP_TYPES = ['government', 'semi_government', 'private'] as const
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number]

export const LINK_STATUSES = ['healthy', 'broken', 'pending'] as const
export type LinkStatus = (typeof LINK_STATUSES)[number]

/** UI sort values (Section 4.2) + legacy API aliases. */
export const SORT_OPTIONS = [
  'alphabetical_en',
  'manual_order',
  'featured',
  'name_asc',
  'name_desc',
  'recent_audit',
] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

export const OWNERSHIP_LABELS: Record<OwnershipType, string> = {
  government: 'حكومي',
  semi_government: 'شبه حكومي',
  private: 'قطاع خاص',
}

export const SORT_LABELS: Record<'alphabetical_en' | 'manual_order', string> = {
  alphabetical_en: 'ترتيب أبجدي',
  manual_order: 'ترتيب مخصص',
}

/** Section 4.6 — catalog list filters (AND-composed). */
export type CatalogFilters = {
  q?: string
  /** Sector slugs */
  sectors?: string[]
  /** Region slugs */
  regions?: string[]
  ownership?: OwnershipType[]
  linkStatus?: LinkStatus[]
  sort?: SortOption
  page?: number
  limit?: number
}

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  sort: 'manual_order',
  page: 1,
  limit: 50,
}

/** Max page size for catalog API requests (virtualized infinite scroll). */
export const CATALOG_PAGE_SIZE = 100

export type CatalogFilterState = {
  q: string
  ownership: OwnershipType[]
  regions: string[]
  sectors: string[]
  sort: 'alphabetical_en' | 'manual_order'
}

export const DEFAULT_CATALOG_FILTER_STATE: CatalogFilterState = {
  q: '',
  ownership: [],
  regions: [],
  sectors: [],
  sort: 'manual_order',
}

export function catalogFilterStateToFilters(state: CatalogFilterState): CatalogFilters {
  return {
    q: state.q.trim() || undefined,
    ownership: state.ownership.length ? state.ownership : undefined,
    regions: state.regions.length ? state.regions : undefined,
    sectors: state.sectors.length ? state.sectors : undefined,
    sort: state.sort,
    page: DEFAULT_CATALOG_FILTERS.page,
    limit: DEFAULT_CATALOG_FILTERS.limit,
  }
}

export function buildCatalogSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.sectors?.length) params.set('sectors', filters.sectors.join(','))
  if (filters.regions?.length) params.set('regions', filters.regions.join(','))
  if (filters.ownership?.length) params.set('ownership', filters.ownership.join(','))
  if (filters.linkStatus?.length) params.set('linkStatus', filters.linkStatus.join(','))
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.page && filters.page !== 1) params.set('page', String(filters.page))
  if (filters.limit && filters.limit !== DEFAULT_CATALOG_FILTERS.limit) {
    params.set('limit', String(filters.limit))
  }
  return params
}

export type CatalogSectorRef = {
  slug: string
  name_en: string
  name_ar: string | null
}

export type CatalogRegionRef = {
  slug: string
  name_en: string
  name_ar: string | null
}

/** Card-safe subset — no descriptions or claimed_by. */
export type CompanyCardData = {
  id: string
  slug: string | null
  name_ar: string | null
  name_en: string
  sector: CatalogSectorRef | null
  region: CatalogRegionRef | null
  logo_url: string | null
  ownership_type: OwnershipType | null
  career_portal_url: string | null
  link_status: LinkStatus
  last_audit_at: string | null
  manual_order: number
}

/** Public company record (reconciled schema; list/detail safe fields). */
export type Company = {
  id: string
  slug: string | null
  name_en: string
  name_ar: string | null
  entity_type: string
  entity_state: string
  is_active: boolean
  is_verified: boolean
  city: string | null
  logo_url: string | null
  cover_url: string | null
  ownership_type: OwnershipType | null
  career_portal_url: string | null
  website_url: string | null
  linkedin_url: string | null
  twitter_url: string | null
  link_status: LinkStatus
  last_audit_at: string | null
  broken_since: string | null
  manual_order: number
  sector: CatalogSectorRef | null
  region: CatalogRegionRef | null
  tagline_en: string | null
  tagline_ar: string | null
  founded_year: number | null
  employee_count_range: string | null
}

export type CatalogCompaniesResult = {
  companies: CompanyCardData[]
  count: number
  page: number
  limit: number
}

export function isOwnershipType(value: string): value is OwnershipType {
  return (OWNERSHIP_TYPES as readonly string[]).includes(value)
}

export function isLinkStatus(value: string): value is LinkStatus {
  return (LINK_STATUSES as readonly string[]).includes(value)
}

export function isSortOption(value: string): value is SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value)
}

export function parseCatalogFiltersFromSearchParams(
  params: URLSearchParams,
): CatalogFilters {
  const sectors = params.get('sectors')?.split(',').map((s) => s.trim()).filter(Boolean)
  const regions = params.get('regions')?.split(',').map((s) => s.trim()).filter(Boolean)
  const ownership = params
    .get('ownership')
    ?.split(',')
    .map((s) => s.trim())
    .filter(isOwnershipType)
  const linkStatus = params
    .get('linkStatus')
    ?.split(',')
    .map((s) => s.trim())
    .filter(isLinkStatus)

  const sortParam = params.get('sort') ?? undefined
  const sort =
    sortParam && isSortOption(sortParam) ? sortParam : DEFAULT_CATALOG_FILTERS.sort

  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? '50') || 50))

  const q = params.get('q')?.trim() || undefined

  return {
    q,
    sectors: sectors?.length ? sectors : undefined,
    regions: regions?.length ? regions : undefined,
    ownership: ownership?.length ? ownership : undefined,
    linkStatus: linkStatus?.length ? linkStatus : undefined,
    sort,
    page,
    limit,
  }
}
