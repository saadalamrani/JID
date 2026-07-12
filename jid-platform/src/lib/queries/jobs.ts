import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { throwQueryError } from '@/lib/supabase/offline-error'
import type { OwnershipType } from '@/types/catalog'
import type {
  ExperienceLevel,
  Job,
  JobCardData,
  JobCompanyRef,
  JobDbStatus,
  JobDetailFetchResult,
  JobFilters,
  JobRegionRef,
  JobsListResult,
  JobSectorRef,
  PublicJobStatus,
} from '@/types/job'
import {
  DEFAULT_JOB_FILTERS,
  dbStatusToPublicStatus,
  isJobUuid,
} from '@/types/job'
import { computeDeadlineDaysLeft } from '@/lib/jobs/deadline'
import {
  validateDomainMatchForDomains,
  type DomainMatchResult,
} from '@/lib/jobs/domain-validator'
import { interleaveBoostedJobs } from '@/lib/priority-visibility/interleave'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

type SectorRow = { slug: string; name_en: string; name_ar: string | null } | null
type RegionRow = { slug: string; name_en: string; name_ar: string | null } | null

type CompanyRow = {
  id: string
  name: string
  name_ar: string | null
  slug: string | null
  logo_url: string | null
  ownership_type: OwnershipType | null
  career_portal_url: string | null
} | null

type JobListRow = {
  id: string
  business_profile_id: string | null
  slug: string | null
  title_ar: string
  title_en: string | null
  experience_level: ExperienceLevel
  status: JobDbStatus
  city: string | null
  is_remote: boolean
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  application_deadline: string
  published_at: string | null
  applicant_count: number
  external_apply_url: string | null
  is_boosted: boolean
  boost_starts_at: string | null
  boost_ends_at: string | null
  tier: 'normal' | 'plus' | null
  company: CompanyRow | CompanyRow[]
  sector: SectorRow | SectorRow[]
  region: RegionRow | RegionRow[]
}

type JobDetailRow = JobListRow & {
  company_id: string
  description_ar: string | null
  description_en: string | null
  required_skills: string[] | null
  closed_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

/** Internal select for job list/detail queries. */
const JOB_LIST_SELECT = `
  id,
  slug,
  title_ar,
  title_en,
  experience_level,
  status,
  city,
  is_remote,
  salary_min,
  salary_max,
  salary_currency,
  application_deadline,
  published_at,
  applicant_count,
  external_apply_url,
  is_boosted,
  boost_starts_at,
  boost_ends_at,
  tier,
  company:companies!inner(
    id,
    name,
    name_ar,
    slug,
    logo_url,
    ownership_type,
    career_portal_url
  ),
  sector:sectors!sector_id(slug, name_en, name_ar),
  region:regions!region_id(slug, name_en, name_ar)
` as const

const JOB_DETAIL_SELECT = `
  id,
  company_id,
  slug,
  title_ar,
  title_en,
  description_ar,
  description_en,
  required_skills,
  experience_level,
  status,
  city,
  is_remote,
  salary_min,
  salary_max,
  salary_currency,
  application_deadline,
  published_at,
  closed_at,
  applicant_count,
  view_count,
  external_apply_url,
  created_at,
  updated_at,
  company:companies!inner(
    id,
    name,
    name_ar,
    slug,
    logo_url,
    ownership_type,
    career_portal_url
  ),
  sector:sectors!sector_id(slug, name_en, name_ar),
  region:regions!region_id(slug, name_en, name_ar)
` as const

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}


function mapSectorRef(row: SectorRow): JobSectorRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

function mapRegionRef(row: RegionRow): JobRegionRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

function mapCompanyRef(row: CompanyRow): JobCompanyRef {
  const company = row ?? {
    id: '',
    name: '',
    name_ar: null,
    slug: null,
    logo_url: null,
    ownership_type: null,
    career_portal_url: null,
  }

  return {
    id: company.id,
    slug: company.slug,
    name_en: company.name,
    name_ar: company.name_ar,
    logo_url: company.logo_url,
    ownership_type: company.ownership_type,
    career_portal_url: company.career_portal_url,
  }
}

function mapJobCard(row: JobListRow): JobCardData | null {
  const company = normalizeEmbed(row.company)
  const publicStatus = dbStatusToPublicStatus(row.status)
  if (!publicStatus || !company?.id) return null

  return {
    id: row.id,
    business_profile_id: row.business_profile_id ?? null,
    slug: row.slug,
    title_ar: row.title_ar,
    title_en: row.title_en,
    experience_level: row.experience_level,
    status: publicStatus,
    city: row.city,
    is_remote: row.is_remote,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    salary_currency: row.salary_currency,
    application_deadline: row.application_deadline,
    deadlineDaysLeft: computeDeadlineDaysLeft(row.application_deadline),
    published_at: row.published_at,
    applicant_count: row.applicant_count,
    applyUrl:
      row.external_apply_url?.trim() || company.career_portal_url?.trim() || null,
    company: mapCompanyRef(company),
    sector: mapSectorRef(normalizeEmbed(row.sector)),
    region: mapRegionRef(normalizeEmbed(row.region)),
    tier: row.tier ?? 'normal',
    isBoosted: row.is_boosted,
    boostStartsAt: row.boost_starts_at,
    boostEndsAt: row.boost_ends_at,
  }
}

function mapJobDetail(row: JobDetailRow): Job | null {
  const card = mapJobCard(row)
  if (!card) return null

  return {
    ...card,
    company_id: row.company_id,
    description_ar: row.description_ar,
    description_en: row.description_en,
    required_skills: row.required_skills ?? [],
    closed_at: row.closed_at,
    view_count: row.view_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function isJobPubliclyAvailable(row: JobDetailRow): boolean {
  const publicStatus = dbStatusToPublicStatus(row.status)
  if (!publicStatus) return false
  return new Date(row.application_deadline).getTime() >= Date.now()
}

async function fetchJobDetailRow(
  client: UntypedClient,
  ref: string,
): Promise<JobDetailRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = client.from('jobs').select(JOB_DETAIL_SELECT)

  if (isJobUuid(ref)) {
    query = query.eq('id', ref)
  } else {
    query = query.eq('slug', ref)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throwQueryError(error)
  if (!data) return null
  return data as unknown as JobDetailRow
}

export async function fetchJobDetailByRef(ref: string): Promise<JobDetailFetchResult> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const row = await fetchJobDetailRow(client, ref)

  if (!row) {
    return { kind: 'not_found' }
  }

  if (!isJobPubliclyAvailable(row)) {
    return { kind: 'unavailable' }
  }

  const job = mapJobDetail(row)
  if (!job) {
    return { kind: 'unavailable' }
  }

  return { kind: 'ok', job }
}

export async function fetchRelatedCompanyJobs(
  companyId: string,
  excludeJobId: string,
  limit = 4,
): Promise<JobCardData[]> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const dbStatuses = resolvePortablePublicJobDbStatuses(DEFAULT_JOB_FILTERS.status)

  const { data, error } = await client
    .from('jobs')
    .select(JOB_LIST_SELECT)
    .eq('company_id', companyId)
    .neq('id', excludeJobId)
    .in('status', dbStatuses)
    .gte('application_deadline', new Date().toISOString())
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throwQueryError(error)

  return ((data ?? []) as unknown as JobListRow[])
    .map(mapJobCard)
    .filter((job): job is JobCardData => job !== null)
}

/** Portable public job-board listing statuses (linked cloud lacks `closing_soon`). */
function resolvePortablePublicJobDbStatuses(statuses: PublicJobStatus[] | undefined): JobDbStatus[] {
  void statuses
  return ['published']
}

async function resolveSectorIds(client: UntypedClient, slugs: string[]): Promise<string[]> {
  const { data, error } = await client.from('sectors').select('id').in('slug', slugs)
  if (error) throwQueryError(error)
  return (data ?? []).map((row) => String((row as { id: string }).id))
}

async function resolveRegionIds(client: UntypedClient, slugs: string[]): Promise<string[]> {
  const { data, error } = await client.from('regions').select('id').in('slug', slugs)
  if (error) throwQueryError(error)
  return (data ?? []).map((row) => String((row as { id: string }).id))
}

export async function fetchJobs(filters: JobFilters = {}): Promise<JobsListResult> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const page = filters.page ?? DEFAULT_JOB_FILTERS.page!
  const limit = filters.limit ?? DEFAULT_JOB_FILTERS.limit!
  const from = (page - 1) * limit
  const overfetchTo = from + limit * 5 - 1
  const dbStatuses = resolvePortablePublicJobDbStatuses(filters.status)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = client
    .from('jobs')
    .select(JOB_LIST_SELECT, { count: 'exact' })
    .in('status', dbStatuses)
    .gte('application_deadline', new Date().toISOString())

  if (filters.experienceLevel?.length) {
    query = query.in('experience_level', filters.experienceLevel)
  }

  if (filters.sectors?.length) {
    const sectorIds = await resolveSectorIds(client, filters.sectors)
    if (sectorIds.length === 0) {
      return { jobs: [], count: 0, page, limit }
    }
    query = query.in('sector_id', sectorIds)
  }

  if (filters.regions?.length) {
    const regionIds = await resolveRegionIds(client, filters.regions)
    if (regionIds.length === 0) {
      return { jobs: [], count: 0, page, limit }
    }
    query = query.in('region_id', regionIds)
  }

  if (filters.ownership?.length) {
    query = query.in('companies.ownership_type', filters.ownership)
  }

  const sort = filters.sort ?? DEFAULT_JOB_FILTERS.sort
  if (sort === 'published_at_desc') {
    query = query
      .order('is_boosted', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('application_deadline', { ascending: true })
  } else {
    query = query
      .order('is_boosted', { ascending: false })
      .order('application_deadline', { ascending: true })
      .order('published_at', { ascending: false, nullsFirst: false })
  }

  query = query.range(from, overfetchTo)

  const { data, error, count } = await query

  if (error) {
    throwQueryError(error)
  }

  const mapped = ((data ?? []) as unknown as JobListRow[])
    .map(mapJobCard)
    .filter((job): job is JobCardData => job !== null)

  const jobs = interleaveBoostedJobs(mapped).slice(0, limit)

  return {
    jobs,
    count: count ?? jobs.length,
    page,
    limit,
  }
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const result = await fetchJobDetailByRef(id)
  return result.kind === 'ok' ? result.job : null
}

function unionDomainSets(...sets: (string[] | null | undefined)[]): string[] {
  const seen = new Set<string>()
  for (const list of sets) {
    for (const raw of list ?? []) {
      const trimmed = raw.trim().toLowerCase()
      if (trimmed) seen.add(trimmed)
    }
  }
  return Array.from(seen)
}

/** Fetch verified_domains ∪ companies.domains for apply-link validation (P-104). */
export async function fetchTrustedDomainsForBusinessProfile(
  businessProfileId: string,
  client?: UntypedClient,
): Promise<string[]> {
  const supabase = client ?? asUntyped(await createClient())

  const { data, error } = await supabase
    .from('business_profiles')
    .select('verified_domains, directory_id')
    .eq('id', businessProfileId)
    .maybeSingle()

  if (error) throwQueryError(error)
  if (!data) return []

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('domains')
    .eq('id', data.directory_id)
    .maybeSingle()

  if (companyError) throwQueryError(companyError)

  return unionDomainSets(data.verified_domains as string[] | null, company?.domains)
}

/**
 * P-104 — validate apply URL against verification-layer domains ∪ Directory reference domains.
 */
export async function validateDomainMatch(
  url: string,
  businessProfileId: string,
  locale: 'ar' | 'en' = 'ar',
): Promise<DomainMatchResult> {
  const domains = await fetchTrustedDomainsForBusinessProfile(businessProfileId)
  return validateDomainMatchForDomains(url, domains, locale)
}

/**
 * Owner-visible jobs (RLS applies transitional + profile paths). For company dashboards.
 */
export async function fetchOwnerJobs(limit = 50): Promise<JobCardData[]> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data, error } = await client
    .from('jobs')
    .select(JOB_LIST_SELECT)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throwQueryError(error)

  return ((data ?? []) as unknown as JobListRow[])
    .map(mapJobCard)
    .filter((job): job is JobCardData => job !== null)
}

/** Live openings for a published business profile (public list statuses only). */
export async function fetchLiveOpeningsByBusinessProfileId(
  businessProfileId: string,
  limit = 12,
): Promise<JobCardData[]> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  const dbStatuses: JobDbStatus[] = ['published', 'closing_soon']

  const { data, error } = await client
    .from('jobs')
    .select(JOB_LIST_SELECT)
    .eq('business_profile_id', businessProfileId)
    .in('status', dbStatuses)
    .gte('application_deadline', new Date().toISOString())
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) throwQueryError(error)

  return ((data ?? []) as unknown as JobListRow[])
    .map(mapJobCard)
    .filter((job): job is JobCardData => job !== null)
}

/** Homepage hero — single most recently published active job (Job Board SSOT). */
export type LatestActiveJobSnapshot = {
  id: string
  slug: string | null
  title_ar: string
  title_en: string | null
  published_at: string
  company_name_en: string
  company_name_ar: string | null
}

export async function fetchLatestActiveJob(): Promise<LatestActiveJobSnapshot | null> {
  const supabase = await createClient()
  const client = asUntyped(supabase)
  // Linked cloud `job_status` lacks `closing_soon` (local migration 048 only).
  const dbStatuses = resolvePortablePublicJobDbStatuses(undefined)

  const { data, error } = await client
    .from('jobs')
    .select(
      'id, slug, title_ar, title_en, published_at, application_deadline, company:companies!inner(name, name_ar)',
    )
    .in('status', dbStatuses)
    .gte('application_deadline', new Date().toISOString())
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) throwQueryError(error)
  if (!data) return null

  const row = data as unknown as {
    id: string
    slug: string | null
    title_ar: string
    title_en: string | null
    published_at: string
    company: { name: string; name_ar: string | null } | { name: string; name_ar: string | null }[]
  }

  const company = normalizeEmbed(row.company)
  if (!company?.name || !row.published_at) return null

  return {
    id: row.id,
    slug: row.slug,
    title_ar: row.title_ar,
    title_en: row.title_en,
    published_at: row.published_at,
    company_name_en: company.name,
    company_name_ar: company.name_ar,
  }
}
