'use client'

import { createClient } from '@/lib/supabase/client'
import { mapLammahRowToCard } from '@/lib/lammah/mappers'
import type { LammahFeedResult } from '@/types/lammah'
import type { JobFilterState } from '@/types/job'
import { resolveExperienceLevelsFromChips } from '@/types/job'

export type LammahFeedFilters = Pick<
  JobFilterState,
  'experienceChips' | 'ownership' | 'regions' | 'sectors'
>

export async function fetchLammahFeedClient(
  filters: LammahFeedFilters,
): Promise<LammahFeedResult> {
  const supabase = createClient()

  let query = supabase
    .from('lammah_opportunities')
    .select(
      'id, source_id, company_id, company_name_raw, title_ar, title_en, excerpt, sector, region, ownership_type, experience_level, external_url, source_published_at, scraped_at, expires_at, status, extraction_confidence, source:lammah_sources(name), company:companies(logo_url)',
      { count: 'exact' },
    )
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('scraped_at', { ascending: false })
    .limit(120)

  if (filters.sectors.length > 0) {
    query = query.in('sector', filters.sectors)
  }
  if (filters.regions.length > 0) {
    query = query.in('region', filters.regions)
  }
  if (filters.experienceChips.length > 0) {
    const levels = resolveExperienceLevelsFromChips(filters.experienceChips)
    if (levels?.length) {
      query = query.in('experience_level', levels)
    }
  }
  if (filters.ownership.length > 0) {
    query = query.in('ownership_type', filters.ownership)
  }

  const [{ data, error, count }, weeklyResult] = await Promise.all([
    query,
    supabase.rpc('lammah_weekly_active_count'),
  ])

  if (error) throw new Error(error.message)

  return {
    items: (data ?? []).map((row) => mapLammahRowToCard(row)),
    count: count ?? 0,
    weeklyCount: weeklyResult.data ?? 0,
  }
}

export async function fetchLammahWeeklyTeaserCount(): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('lammah_weekly_active_count')
  if (error) return 0
  return data ?? 0
}

export function lammahFeedQueryKey(filters: LammahFeedFilters) {
  return ['lammah', 'feed', filters] as const
}
