import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type {
  SysMentorApplicationRow,
  SysMentorApplicationsFilters,
  SysMentorApplicationsResult,
} from '@/types/sys-mentor-applications'
import { SYS_MENTOR_APPLICATIONS_PAGE_SIZE } from '@/types/sys-mentor-applications'

type MentorRow = {
  user_id: string
  status: string
  headline: string | null
  application_submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  expertise_areas: string[]
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

/** Section — all mentor applications (super_admin oversight). */
export async function fetchSysMentorApplications(
  filters: SysMentorApplicationsFilters = {},
): Promise<SysMentorApplicationsResult> {
  const supabase = await createClient()
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = SYS_MENTOR_APPLICATIONS_PAGE_SIZE
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('mentor_profiles')
    .select(
      `
      user_id,
      status,
      headline,
      application_submitted_at,
      reviewed_at,
      rejection_reason,
      expertise_areas,
      profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)
    `,
      { count: 'exact' },
    )
    .order('application_submitted_at', { ascending: false, nullsFirst: false })

  const status = filters.status ?? 'all'
  if (status !== 'all') query = query.eq('status', status)

  const q = filters.q?.trim()
  if (q) {
    query = query.or(`headline.ilike.%${q}%`)
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const rows = ((data ?? []) as MentorRow[]).map(
    (row): SysMentorApplicationRow => ({
      user_id: row.user_id,
      status: row.status,
      headline: row.headline,
      application_submitted_at: row.application_submitted_at,
      reviewed_at: row.reviewed_at,
      rejection_reason: row.rejection_reason,
      applicant_name: row.profiles?.full_name ?? null,
      applicant_avatar_url: row.profiles?.avatar_url ?? null,
      expertise_areas: row.expertise_areas ?? [],
    }),
  )

  const total = count ?? 0
  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function fetchSysMentorApplication(userId: string): Promise<SysMentorApplicationRow | null> {
  const result = await fetchSysMentorApplications({ page: 1 })
  return result.rows.find((row) => row.user_id === userId) ?? null
}
