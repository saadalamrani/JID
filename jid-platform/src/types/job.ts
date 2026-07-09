/**
 * Job / opportunities types — Section 7.5 / reconciled Day 1 schema (048).
 */

import type { OwnershipType } from '@/types/catalog'

/** Database enum values on public.jobs.status */
export const JOB_DB_STATUSES = [
  'draft',
  'published',
  'closing_soon',
  'closed',
  'expired',
  'pending_review',
] as const
export type JobDbStatus = (typeof JOB_DB_STATUSES)[number]

/** Public list filter values — `active` maps to DB `published`. */
export const PUBLIC_JOB_STATUSES = ['active', 'closing_soon'] as const
export type PublicJobStatus = (typeof PUBLIC_JOB_STATUSES)[number]

export const EXPERIENCE_LEVELS = [
  'intern',
  'entry',
  'mid',
  'senior',
  'lead',
  'executive',
] as const
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number]

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  intern: 'تدريب',
  entry: 'مبتدئ',
  mid: 'متوسط',
  senior: 'خبير',
  lead: 'قائد فريق',
  executive: 'تنفيذي',
}

export type JobSectorRef = {
  slug: string
  name_en: string
  name_ar: string | null
}

export type JobRegionRef = {
  slug: string
  name_en: string
  name_ar: string | null
}

export type JobCompanyRef = {
  id: string
  slug: string | null
  name_en: string
  name_ar: string | null
  logo_url: string | null
  ownership_type: OwnershipType | null
  career_portal_url: string | null
}

/** Client-facing card subset — never includes commitment_score. */
export type JobCardData = {
  id: string
  slug: string | null
  title_ar: string
  title_en: string | null
  experience_level: ExperienceLevel
  status: PublicJobStatus
  city: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  application_deadline: string
  /** Server-computed calendar days left (Riyadh) — Section 4.4. */
  deadlineDaysLeft: number
  published_at: string | null
  applicant_count: number
  /** External apply destination — company career portal (Section 4.5). */
  applyUrl: string | null
  company: JobCompanyRef
  sector: JobSectorRef | null
  region: JobRegionRef | null
  /** Access tier badge — independent from boost ranking (Prompt 6). */
  tier: 'normal' | 'plus'
  isBoosted: boolean
  boostStartsAt: string | null
  boostEndsAt: string | null
}

/** Public job detail (reconciled schema; no commitment_score). */
export type Job = {
  id: string
  slug: string | null
  company_id: string
  title_ar: string
  title_en: string | null
  description_ar: string | null
  description_en: string | null
  required_skills: string[]
  experience_level: ExperienceLevel
  status: PublicJobStatus
  city: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  application_deadline: string
  published_at: string | null
  closed_at: string | null
  deadlineDaysLeft: number
  applicant_count: number
  view_count: number
  applyUrl: string | null
  company: JobCompanyRef
  sector: JobSectorRef | null
  region: JobRegionRef | null
  created_at: string
  updated_at: string
}

export type JobFilters = {
  /** Defaults to active + closing_soon when omitted. */
  status?: PublicJobStatus[]
  experienceLevel?: ExperienceLevel[]
  /** Sector slugs */
  sectors?: string[]
  /** Region slugs */
  regions?: string[]
  ownership?: OwnershipType[]
  sort?: JobSortOption
  page?: number
  limit?: number
}

export const JOB_SORT_OPTIONS = ['published_at_desc', 'deadline_asc'] as const
export type JobSortOption = (typeof JOB_SORT_OPTIONS)[number]

/** UI chip ids — OR-composed into experience_level enum values. */
export const JOB_EXPERIENCE_CHIP_IDS = [
  'graduate',
  'internship',
  'mid',
  'leadership',
] as const
export type JobExperienceChipId = (typeof JOB_EXPERIENCE_CHIP_IDS)[number]

export const JOB_EXPERIENCE_CHIPS: ReadonlyArray<{
  id: JobExperienceChipId
  label: string
  levels: readonly ExperienceLevel[]
}> = [
  { id: 'graduate', label: 'حديث تخرج', levels: ['entry'] },
  { id: 'internship', label: 'تدريب تعاوني', levels: ['intern'] },
  { id: 'mid', label: 'خبرة متوسطة', levels: ['mid'] },
  { id: 'leadership', label: 'مناصب قيادية', levels: ['lead', 'executive'] },
]

export const URGENCY_FILTERS = ['newest', 'closing_soon'] as const
export type UrgencyFilter = (typeof URGENCY_FILTERS)[number]

export const URGENCY_FILTER_LABELS: Record<UrgencyFilter, string> = {
  newest: 'الأحدث إضافة',
  closing_soon: 'يغلق قريباً',
}

export type JobFilterState = {
  experienceChips: JobExperienceChipId[]
  ownership: OwnershipType[]
  sectors: string[]
  regions: string[]
  urgency: UrgencyFilter[]
}

export const DEFAULT_JOB_FILTER_STATE: JobFilterState = {
  experienceChips: [],
  ownership: [],
  sectors: [],
  regions: [],
  urgency: [],
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  status: ['active', 'closing_soon'],
  sort: 'published_at_desc',
  page: 1,
  limit: 50,
}

export type JobsListResult = {
  jobs: JobCardData[]
  count: number
  page: number
  limit: number
}

export type JobDetailFetchResult =
  | { kind: 'ok'; job: Job }
  | { kind: 'unavailable' }
  | { kind: 'not_found' }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isJobUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function isExperienceLevel(value: string): value is ExperienceLevel {
  return (EXPERIENCE_LEVELS as readonly string[]).includes(value)
}

export function isPublicJobStatus(value: string): value is PublicJobStatus {
  return (PUBLIC_JOB_STATUSES as readonly string[]).includes(value)
}

export function publicStatusToDbStatus(status: PublicJobStatus): JobDbStatus {
  return status === 'active' ? 'published' : status
}

export function dbStatusToPublicStatus(status: JobDbStatus): PublicJobStatus | null {
  if (status === 'published') return 'active'
  if (status === 'closing_soon') return 'closing_soon'
  return null
}

export function isJobExperienceChipId(value: string): value is JobExperienceChipId {
  return (JOB_EXPERIENCE_CHIP_IDS as readonly string[]).includes(value)
}

export function isUrgencyFilter(value: string): value is UrgencyFilter {
  return (URGENCY_FILTERS as readonly string[]).includes(value)
}

export function isJobSortOption(value: string): value is JobSortOption {
  return (JOB_SORT_OPTIONS as readonly string[]).includes(value)
}

export function resolveExperienceLevelsFromChips(
  chips: JobExperienceChipId[],
): ExperienceLevel[] | undefined {
  if (!chips.length) return undefined

  const levels = new Set<ExperienceLevel>()
  for (const chipId of chips) {
    const chip = JOB_EXPERIENCE_CHIPS.find((item) => item.id === chipId)
    chip?.levels.forEach((level) => levels.add(level))
  }

  return levels.size > 0 ? Array.from(levels) : undefined
}

export function resolveUrgencyStatus(urgency: UrgencyFilter[]): PublicJobStatus[] {
  if (urgency.includes('closing_soon') && !urgency.includes('newest')) {
    return ['closing_soon']
  }
  return ['active', 'closing_soon']
}

export function resolveUrgencySort(urgency: UrgencyFilter[]): JobSortOption {
  if (urgency.includes('newest') || urgency.length === 0) {
    return 'published_at_desc'
  }
  return 'deadline_asc'
}

export function jobFilterStateToFilters(
  state: JobFilterState,
): Omit<JobFilters, 'page' | 'limit'> {
  return {
    status: resolveUrgencyStatus(state.urgency),
    experienceLevel: resolveExperienceLevelsFromChips(state.experienceChips),
    sectors: state.sectors.length ? state.sectors : undefined,
    regions: state.regions.length ? state.regions : undefined,
    ownership: state.ownership.length ? state.ownership : undefined,
    sort: resolveUrgencySort(state.urgency),
  }
}

export function buildJobSearchParams(filters: JobFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.status?.length) params.set('status', filters.status.join(','))
  if (filters.experienceLevel?.length) {
    params.set('experienceLevel', filters.experienceLevel.join(','))
  }
  if (filters.sectors?.length) params.set('sectors', filters.sectors.join(','))
  if (filters.regions?.length) params.set('regions', filters.regions.join(','))
  if (filters.ownership?.length) params.set('ownership', filters.ownership.join(','))
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.page && filters.page !== 1) params.set('page', String(filters.page))
  if (filters.limit && filters.limit !== DEFAULT_JOB_FILTERS.limit) {
    params.set('limit', String(filters.limit))
  }
  return params
}

export function parseJobFiltersFromSearchParams(params: URLSearchParams): JobFilters {
  const status = params
    .get('status')
    ?.split(',')
    .map((value) => value.trim())
    .filter(isPublicJobStatus)

  const experienceLevel = params
    .get('experienceLevel')
    ?.split(',')
    .map((value) => value.trim())
    .filter(isExperienceLevel)

  const sectors = params
    .get('sectors')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const regions = params
    .get('regions')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const ownership = params
    .get('ownership')
    ?.split(',')
    .map((value) => value.trim())
    .filter((value): value is OwnershipType =>
      ['government', 'semi_government', 'private'].includes(value),
    )

  const sortParam = params.get('sort')
  const sort = sortParam && isJobSortOption(sortParam) ? sortParam : DEFAULT_JOB_FILTERS.sort

  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? '50') || 50))

  return {
    status: status?.length ? status : DEFAULT_JOB_FILTERS.status,
    experienceLevel: experienceLevel?.length ? experienceLevel : undefined,
    sectors: sectors?.length ? sectors : undefined,
    regions: regions?.length ? regions : undefined,
    ownership: ownership?.length ? ownership : undefined,
    sort,
    page,
    limit,
  }
}
