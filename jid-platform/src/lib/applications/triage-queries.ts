import 'server-only'

import { computeDeadlineDaysLeft } from '@/lib/jobs/deadline'
import { createClient } from '@/lib/supabase/server'
import type {
  ApplicationStatus,
  JobApplicantsResult,
  JobTriageHeader,
  TriageApplicant,
  TriageFilterTab,
} from '@/types/application'
import { triageTabToStatuses } from '@/types/application'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { assertJobTriageAccess } from './triage-access'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

const APPLICANT_TRIAGE_SELECT = `
  id,
  applicant_id,
  status,
  contact_email,
  submitted_at,
  last_company_action_at,
  applicant:profiles!applications_applicant_id_fkey(
    id,
    full_name,
    headline,
    avatar_url,
    show_profile_to_companies
  )
` as const

type ApplicantRow = {
  id: string
  applicant_id: string
  status: ApplicationStatus
  contact_email: string | null
  submitted_at: string | null
  last_company_action_at: string | null
  applicant:
    | {
        id: string
        full_name: string | null
        headline: string | null
        avatar_url: string | null
        show_profile_to_companies: boolean
      }
    | {
        id: string
        full_name: string | null
        headline: string | null
        avatar_url: string | null
        show_profile_to_companies: boolean
      }[]
    | null
}

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function mapTriageApplicant(row: ApplicantRow): TriageApplicant {
  const profile = normalizeEmbed(row.applicant)
  return {
    id: row.id,
    applicant_id: row.applicant_id,
    status: row.status,
    contact_email: row.contact_email,
    submitted_at: row.submitted_at,
    last_company_action_at: row.last_company_action_at,
    applicant: profile
      ? {
          id: profile.id,
          full_name: profile.full_name,
          headline: profile.headline,
          avatar_url: profile.avatar_url,
          show_profile_to_recruiters: profile.show_profile_to_companies,
        }
      : null,
  }
}

const ACTIVE_TRIAGE_STATUSES: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'shortlisted',
  'rejected',
  'invited',
]

function buildJobHeader(
  job: {
    id: string
    title_ar: string
    title_en: string | null
    application_deadline: string | null
    applicant_count: number
  },
  acceptedCount: number,
): JobTriageHeader {
  return {
    id: job.id,
    title_ar: job.title_ar,
    title_en: job.title_en,
    application_deadline: job.application_deadline,
    daysUntilClose:
      job.application_deadline != null
        ? computeDeadlineDaysLeft(job.application_deadline)
        : null,
    applicantCount: job.applicant_count,
    acceptedCount,
  }
}

export async function fetchJobApplicantsForTriage(
  jobId: string,
  filter: TriageFilterTab = 'all',
): Promise<JobApplicantsResult> {
  const { job } = await assertJobTriageAccess(jobId)
  const supabase = await createClient()
  const client = asUntyped(supabase)

  let query = client
    .from('applications')
    .select(APPLICANT_TRIAGE_SELECT)
    .eq('job_id', jobId)
    .in('status', ACTIVE_TRIAGE_STATUSES)
    .order('submitted_at', { ascending: false, nullsFirst: false })

  const statuses = triageTabToStatuses(filter)
  if (statuses) {
    query = query.in('status', statuses)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const { count: acceptedCount } = await client
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('status', 'shortlisted')

  const applicants = ((data ?? []) as unknown as ApplicantRow[]).map(mapTriageApplicant)

  return {
    job: buildJobHeader(job, acceptedCount ?? 0),
    applicants,
  }
}
