import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { mergeMentorSetupSmartLinks } from '@/lib/onboarding/entity-smart-links'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

export async function markMentorSetupComplete(userId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await asUntyped(supabase)
    .from('profiles')
    .select('smart_links')
    .eq('id', userId)
    .maybeSingle()

  const smartLinks =
    data && typeof data.smart_links === 'object' && data.smart_links
      ? (data.smart_links as Record<string, unknown>)
      : {}

  const now = new Date().toISOString()
  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      smart_links: mergeMentorSetupSmartLinks(smartLinks, { completed_at: now }),
      updated_at: now,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
