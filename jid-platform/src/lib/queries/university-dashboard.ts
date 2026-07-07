'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type UniversityDashboardSnapshot = {
  university_id: string
  total_students: number
  college_distribution: Record<string, number>
  profile_completion_pct: number
  cv_creation_pct: number
  job_applications: number
  mentorship_sessions: number
  status_breakdown: Record<string, number>
  refreshed_at: string
}

const STALE_MS = 2 * 60 * 1000

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export function universityDashboardQueryKey() {
  return ['universities', 'dashboard'] as const
}

export async function fetchUniversityDashboardSnapshot(): Promise<UniversityDashboardSnapshot[]> {
  const supabase = asUntyped(createClient())
  const { data, error } = await supabase
    .from('university_dashboard_view')
    .select(
      'university_id, total_students, college_distribution, profile_completion_pct, cv_creation_pct, job_applications, mentorship_sessions, status_breakdown, refreshed_at',
    )

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as UniversityDashboardSnapshot[]
}

export async function fetchUniversityDashboardSnapshotAdmin(): Promise<
  UniversityDashboardSnapshot[]
> {
  const supabase = asUntyped(createClient())
  const { data, error } = await supabase
    .from('university_dashboard_view_admin')
    .select(
      'university_id, total_students, college_distribution, profile_completion_pct, cv_creation_pct, job_applications, mentorship_sessions, status_breakdown, refreshed_at',
    )

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as UniversityDashboardSnapshot[]
}

export function useUniversityDashboard(options?: { admin?: boolean }) {
  const admin = options?.admin ?? false
  return useQuery({
    queryKey: [...universityDashboardQueryKey(), admin ? 'admin' : 'self'],
    queryFn: () =>
      admin ? fetchUniversityDashboardSnapshotAdmin() : fetchUniversityDashboardSnapshot(),
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
    refetchOnWindowFocus: false,
  })
}
