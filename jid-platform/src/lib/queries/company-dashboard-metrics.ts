import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

/**
 * Spec 08-B — Discriminated metric result.
 * Successful authorized 0 stays `{ ok, value: 0 }`.
 * Missing/denied/error must never be coerced to 0 by the UI.
 */
export type DashboardMetricResult =
  | { status: 'ok'; value: number }
  | { status: 'error'; message: string }

export type CompanyDashboardMetrics = {
  jobsPosted: DashboardMetricResult
  applicationsReceived: DashboardMetricResult
}

/**
 * Read-only owner-scoped jobs count.
 * Scopes explicitly by owned `business_profiles.id` (RLS also enforces owner_user_id).
 * Does not resolve ownership through Directory representation fields.
 */
export async function countOwnerJobsPosted(
  client: SupabaseClient<Database>,
  businessProfileId: string,
): Promise<DashboardMetricResult> {
  const db = asUntyped(client)
  const { count, error } = await db
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('business_profile_id', businessProfileId)

  if (error) {
    return { status: 'error', message: error.message }
  }

  return { status: 'ok', value: count ?? 0 }
}

/**
 * Read-only owner-scoped applications count via jobs owned by the Business Profile.
 * Uses job_id IN (owner jobs) — not triage Directory-representation resolution.
 */
export async function countOwnerApplicationsReceived(
  client: SupabaseClient<Database>,
  businessProfileId: string,
): Promise<DashboardMetricResult> {
  const db = asUntyped(client)

  const { data: jobs, error: jobsError } = await db
    .from('jobs')
    .select('id')
    .eq('business_profile_id', businessProfileId)

  if (jobsError) {
    return { status: 'error', message: jobsError.message }
  }

  const jobIds = ((jobs ?? []) as Array<{ id: string }>).map((row) => row.id)
  if (jobIds.length === 0) {
    return { status: 'ok', value: 0 }
  }

  const { count, error } = await db
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .in('job_id', jobIds)

  if (error) {
    return { status: 'error', message: error.message }
  }

  return { status: 'ok', value: count ?? 0 }
}

export async function fetchCompanyDashboardMetrics(
  client: SupabaseClient<Database>,
  businessProfileId: string,
): Promise<CompanyDashboardMetrics> {
  const [jobsPosted, applicationsReceived] = await Promise.all([
    countOwnerJobsPosted(client, businessProfileId),
    countOwnerApplicationsReceived(client, businessProfileId),
  ])

  return { jobsPosted, applicationsReceived }
}
