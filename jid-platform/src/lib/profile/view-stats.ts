import { createClient } from '@/lib/supabase/client'

export type ProfileViewStats = {
  totalViews: number
  viewsLast30Days: number
  uniqueCompanies: number
  distinctCompanies30d: number
}

export const profileViewStatsQueryKey = (profileId: string) =>
  ['profile', 'view-stats', profileId] as const

export async function fetchProfileViewStats(profileId: string): Promise<ProfileViewStats> {
  const supabase = createClient()

  const { data, error } = await (supabase as unknown as {
    rpc: (
      fn: string,
      args: { p_profile_id: string },
    ) => Promise<{
      data: Array<{
        total_views: number
        views_last_30_days: number
        unique_companies: number
        distinct_companies_30d: number
      }> | null
      error: { message: string } | null
    }>
  }).rpc('get_profile_view_stats', { p_profile_id: profileId })

  if (error || !data?.[0]) {
    return {
      totalViews: 0,
      viewsLast30Days: 0,
      uniqueCompanies: 0,
      distinctCompanies30d: 0,
    }
  }

  const row = data[0]
  return {
    totalViews: Number(row.total_views ?? 0),
    viewsLast30Days: Number(row.views_last_30_days ?? 0),
    uniqueCompanies: Number(row.unique_companies ?? 0),
    distinctCompanies30d: Number(row.distinct_companies_30d ?? 0),
  }
}
