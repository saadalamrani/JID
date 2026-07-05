import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

/**
 * Records a company-level profile view (Section 13 — viewer_company_id only).
 * Call fire-and-forget from the profile page; never blocks render.
 */
export async function trackProfileView(input: {
  profileId: string
  viewerCompanyId: string
  source?: string
}): Promise<void> {
  const supabase = await createClient()
  const { error } = await asUntyped(supabase).from('profile_views').insert({
    profile_id: input.profileId,
    viewer_company_id: input.viewerCompanyId,
    source: input.source ?? 'profile_page',
  })

  if (error) {
    console.error('trackProfileView failed:', error.message)
  }
}
