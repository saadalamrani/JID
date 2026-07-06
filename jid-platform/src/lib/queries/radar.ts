import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type {
  ApplicationCompanyRef,
  ApplicationJobRef,
  UserApplication,
  UserApplicationsResult,
} from '@/types/application'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export function radarApplicationsQueryKey(userId: string) {
  return ['radar', 'applications', userId] as const
}

const USER_APPLICATIONS_SELECT = `
  id,
  job_id,
  applicant_id,
  company_id,
  status,
  cover_letter,
  resume_url,
  contact_email,
  submitted_at,
  last_company_action_at,
  last_seen_by_user_at,
  status_changed_at,
  status_changed_by,
  expires_at,
  created_at,
  updated_at,
  job:jobs(
    id,
    slug,
    title_ar,
    title_en,
    application_deadline
  ),
  company:companies(
    id,
    slug,
    name,
    name_ar,
    logo_url
  )
` as const

type JobEmbed = {
  id: string
  slug: string | null
  title_ar: string
  title_en: string | null
  application_deadline: string
} | null

type CompanyEmbed = {
  id: string
  slug: string | null
  name: string
  name_ar: string | null
  logo_url: string | null
} | null

type ApplicationRow = {
  id: string
  job_id: string
  applicant_id: string
  company_id: string
  status: UserApplication['status']
  cover_letter: string | null
  resume_url: string | null
  contact_email: string | null
  submitted_at: string | null
  last_company_action_at: string | null
  last_seen_by_user_at: string | null
  status_changed_at: string | null
  status_changed_by: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  job: JobEmbed | JobEmbed[]
  company: CompanyEmbed | CompanyEmbed[]
}

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function mapJobRef(row: JobEmbed): ApplicationJobRef | null {
  if (!row?.id) return null
  return {
    id: row.id,
    slug: row.slug,
    title_ar: row.title_ar,
    title_en: row.title_en,
    application_deadline: row.application_deadline,
  }
}

function mapCompanyRef(row: CompanyEmbed): ApplicationCompanyRef | null {
  if (!row?.id) return null
  return {
    id: row.id,
    slug: row.slug,
    name_en: row.name,
    name_ar: row.name_ar,
    logo_url: row.logo_url,
  }
}

function mapUserApplication(row: ApplicationRow): UserApplication {
  return {
    id: row.id,
    job_id: row.job_id,
    applicant_id: row.applicant_id,
    company_id: row.company_id,
    status: row.status,
    cover_letter: row.cover_letter,
    resume_url: row.resume_url,
    contact_email: row.contact_email,
    submitted_at: row.submitted_at,
    last_company_action_at: row.last_company_action_at,
    last_seen_by_user_at: row.last_seen_by_user_at,
    status_changed_at: row.status_changed_at,
    status_changed_by: row.status_changed_by,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    job: mapJobRef(normalizeEmbed(row.job)),
    company: mapCompanyRef(normalizeEmbed(row.company)),
  }
}

/** Section 8.1 — applications joined with jobs + companies for Radar Kanban. */
export async function fetchUserApplications(userId: string): Promise<UserApplicationsResult> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data, error, count } = await client
    .from('applications')
    .select(USER_APPLICATIONS_SELECT, { count: 'exact' })
    .eq('applicant_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const applications = ((data ?? []) as unknown as ApplicationRow[]).map(mapUserApplication)

  return {
    applications,
    count: count ?? applications.length,
  }
}
