import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { OwnershipType } from '@/types/catalog'
import type {
  ExperienceLevel,
  Job,
  JobCardData,
  JobCompanyRef,
  JobDbStatus,
  JobFilters,
  JobRegionRef,
  JobsListResult,
  JobSectorRef,
  PublicJobStatus,
} from '@/types/job'
import {
  DEFAULT_JOB_FILTERS,
  JID_PARTNER_BADGE_MIN_SCORE,
  dbStatusToPublicStatus,
  publicStatusToDbStatus,
} from '@/types/job'
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
  commitment_score: number
} | null

type JobListRow = {
  id: string
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
  company: CompanyRow | CompanyRow[]
  sector: SectorRow | SectorRow[]
  region: RegionRow | RegionRow[]
}

type JobDetailRow = JobListRow & {
  company_id: string
  description_ar: string | null
  description_en: string | null
  closed_at: string | null
  view_count: number
  created_at: string
  updated_at: string
}

/** Internal select — commitment_score used only to derive hasJidPartnerBadge. */
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
  company:companies!inner(
    id,
    name,
    name_ar,
    slug,
    logo_url,
    ownership_type,
    commitment_score
  ),
  sector:sectors(slug, name_en, name_ar),
  region:regions(slug, name_en, name_ar)
` as const

const JOB_DETAIL_SELECT = `
  id,
  company_id,
  slug,
  title_ar,
  title_en,
  description_ar,
  description_en,
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
  created_at,
  updated_at,
  company:companies!inner(
    id,
    name,
    name_ar,
    slug,
    logo_url,
    ownership_type,
    commitment_score
  ),
  sector:sectors(slug, name_en, name_ar),
  region:regions(slug, name_en, name_ar)
` as const

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function computeHasJidPartnerBadge(commitmentScore: number | null | undefined): boolean {
  return (commitmentScore ?? 0) >= JID_PARTNER_BADGE_MIN_SCORE
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
    commitment_score: 0,
  }

  return {
    id: company.id,
    slug: company.slug,
    name_en: company.name,
    name_ar: company.name_ar,
    logo_url: company.logo_url,
    ownership_type: company.ownership_type,
  }
}

function mapJobCard(row: JobListRow): JobCardData | null {
  const company = normalizeEmbed(row.company)
  const publicStatus = dbStatusToPublicStatus(row.status)
  if (!publicStatus || !company?.id) return null

  return {
    id: row.id,
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
    published_at: row.published_at,
    applicant_count: row.applicant_count,
    hasJidPartnerBadge: computeHasJidPartnerBadge(company.commitment_score),
    company: mapCompanyRef(company),
    sector: mapSectorRef(normalizeEmbed(row.sector)),
    region: mapRegionRef(normalizeEmbed(row.region)),
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
    closed_at: row.closed_at,
    view_count: row.view_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function resolveDbStatuses(statuses: PublicJobStatus[] | undefined): JobDbStatus[] {
  const source = statuses?.length ? statuses : DEFAULT_JOB_FILTERS.status!
  return source.map(publicStatusToDbStatus)
}

async function resolveSectorIds(client: UntypedClient, slugs: string[]): Promise<string[]> {
  const { data, error } = await client.from('sectors').select('id').in('slug', slugs)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => String((row as { id: string }).id))
}

async function resolveRegionIds(client: UntypedClient, slugs: string[]): Promise<string[]> {
  const { data, error } = await client.from('regions').select('id').in('slug', slugs)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => String((row as { id: string }).id))
}

export async function fetchJobs(filters: JobFilters = {}): Promise<JobsListResult> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const page = filters.page ?? DEFAULT_JOB_FILTERS.page!
  const limit = filters.limit ?? DEFAULT_JOB_FILTERS.limit!
  const from = (page - 1) * limit
  const to = from + limit - 1
  const dbStatuses = resolveDbStatuses(filters.status)

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

  query = query
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('application_deadline', { ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  const jobs = ((data ?? []) as unknown as JobListRow[])
    .map(mapJobCard)
    .filter((job): job is JobCardData => job !== null)

  return {
    jobs,
    count: count ?? jobs.length,
    page,
    limit,
  }
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const dbStatuses = resolveDbStatuses(DEFAULT_JOB_FILTERS.status)

  const { data, error } = await client
    .from('jobs')
    .select(JOB_DETAIL_SELECT)
    .eq('id', id)
    .in('status', dbStatuses)
    .gte('application_deadline', new Date().toISOString())
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return mapJobDetail(data as unknown as JobDetailRow)
}
