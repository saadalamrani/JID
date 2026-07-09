'use client'

import { createClient } from '@/lib/supabase/client'
import { mapMatchRow, mapMandateRow } from '@/lib/abhathli/mappers'
import type { MandateMatchCard, SearchMandate } from '@/types/abhathli'

export async function fetchSearchMandatesClient(): Promise<SearchMandate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('search_mandates')
    .select(
      'id, user_id, name, is_active, sectors, regions, ownership_types, experience_levels, keywords, include_lammah, digest_frequency, created_at, updated_at, last_run_at',
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapMandateRow(row))
}

export async function fetchMandateMatchesClient(limit = 20): Promise<MandateMatchCard[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('mandate_matches')
    .select(
      `
      id, mandate_id, job_id, lammah_id, score, match_reasons, matched_at, seen_at, dismissed_at,
      mandate:search_mandates(name),
      job:jobs(
        title_ar, title_en, slug, tier,
        company:companies(name_ar, name_en, logo_url),
        sector:sectors(slug),
        region:regions(slug)
      ),
      lammah:lammah_opportunities(
        title_ar, title_en, external_url, company_name_raw, sector, region,
        company:companies(logo_url)
      )
    `,
    )
    .is('dismissed_at', null)
    .order('matched_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapMatchRow(row as Parameters<typeof mapMatchRow>[0]))
}

export async function fetchAbhathliUnseenCountClient(): Promise<number> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('abhathli_unseen_match_count')
  if (error) return 0
  return data ?? 0
}

export function abhathliMandatesQueryKey() {
  return ['abhathli', 'mandates'] as const
}

export function abhathliMatchesQueryKey() {
  return ['abhathli', 'matches'] as const
}
