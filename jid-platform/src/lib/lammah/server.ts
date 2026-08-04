import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { mapLammahRowToCard, type LammahFeedRow } from '@/lib/lammah/mappers'
import { userHasEntitlement } from '@/lib/monetization'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { LammahFeedResult, LammahPageState } from '@/types/lammah'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

const emptyData: LammahFeedResult = { items: [], count: 0 }

/**
 * Server-only entitlement boundary. The protected inventory query is never
 * constructed for an unentitled session, so the response contains no rows,
 * teaser fields, or counts derived from Lammah inventory.
 */
export async function fetchLammahPageState(): Promise<LammahPageState> {
  const entitled = await userHasEntitlement('lammah_feed')
  if (!entitled) return { entitled: false, available: true, data: emptyData }

  const supabase = asUntyped(await createClient())
  const now = new Date().toISOString()
  const freshnessBoundary = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error, count } = await supabase
    .from('lammah_opportunities')
    .select(
      'id, source_id, source_name, company_id, company_name_raw, title_ar, title_en, excerpt, sector, region, location_country, location_city, ownership_type, experience_level, opportunity_type, external_url, source_published_at, scraped_at, first_retrieved_at, expires_at, last_confirmed_at, status, extraction_confidence, company:companies(logo_url)',
      { count: 'exact' },
    )
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .gt('last_confirmed_at',freshnessBoundary)
    .order('source_published_at', { ascending: false, nullsFirst: false })
    .order('first_retrieved_at', { ascending: false })
    .order('expires_at', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(120)

  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as LammahFeedRow[]
  return {
    entitled: true,
    available: true,
    data: { items: rows.map(mapLammahRowToCard), count: count ?? rows.length },
  }
}
