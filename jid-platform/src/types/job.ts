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
  published_at: string | null
  applicant_count: number
  hasJidPartnerBadge: boolean
  company: JobCompanyRef
  sector: JobSectorRef | null
  region: JobRegionRef | null
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
  applicant_count: number
  view_count: number
  hasJidPartnerBadge: boolean
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
  page?: number
  limit?: number
}

export const DEFAULT_JOB_FILTERS: JobFilters = {
  status: ['active', 'closing_soon'],
  page: 1,
  limit: 50,
}

export const JID_PARTNER_BADGE_MIN_SCORE = 80

export type JobsListResult = {
  jobs: JobCardData[]
  count: number
  page: number
  limit: number
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

  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const limit = Math.min(100, Math.max(1, Number(params.get('limit') ?? '50') || 50))

  return {
    status: status?.length ? status : DEFAULT_JOB_FILTERS.status,
    experienceLevel: experienceLevel?.length ? experienceLevel : undefined,
    sectors: sectors?.length ? sectors : undefined,
    regions: regions?.length ? regions : undefined,
    ownership: ownership?.length ? ownership : undefined,
    page,
    limit,
  }
}
