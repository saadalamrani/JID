import 'server-only'

import { fetchUserApplications } from '@/lib/queries/radar'
import { resolveSmartHeaderSession } from '@/lib/navigation/smart-header-session'
import { isDbOfflineError } from '@/lib/supabase/offline-error'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export type HomeHeroPrimaryCta = {
  labelKey: 'primaryCtaGuest' | 'primaryCtaCompleteProfile' | 'primaryCtaRadar'
  href: '/opportunities' | '/profile/edit' | '/radar'
}

export type HomeHeroContext = {
  isAuthenticated: boolean
  primaryCta: HomeHeroPrimaryCta
}

const GUEST_CTA: HomeHeroPrimaryCta = {
  labelKey: 'primaryCtaGuest',
  href: '/opportunities',
}

/** Profile substantially complete when DB `profile_completion_pct` reaches 100 (029 trigger SSOT). */
const PROFILE_COMPLETE_PCT = 100

export async function resolveHomeHeroContext(): Promise<HomeHeroContext> {
  const session = await resolveSmartHeaderSession()

  if (!session.isAuthenticated || !session.userId) {
    return { isAuthenticated: false, primaryCta: GUEST_CTA }
  }

  if (session.role !== 'individual') {
    return { isAuthenticated: true, primaryCta: GUEST_CTA }
  }

  try {
    const supabase = await createClient()
    const client = asUntyped(supabase)
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('profile_completion_pct')
      .eq('id', session.userId)
      .maybeSingle()

    if (profileError) {
      throw new Error(profileError.message)
    }

    const completionPct = Number(
      (profile as { profile_completion_pct?: number } | null)?.profile_completion_pct ?? 0,
    )
    if (completionPct < PROFILE_COMPLETE_PCT) {
      return {
        isAuthenticated: true,
        primaryCta: { labelKey: 'primaryCtaCompleteProfile', href: '/profile/edit' },
      }
    }

    const { applications, count } = await fetchUserApplications(session.userId)
    const hasApplications = (count ?? applications.length) > 0

    if (hasApplications) {
      return {
        isAuthenticated: true,
        primaryCta: { labelKey: 'primaryCtaRadar', href: '/radar' },
      }
    }

    return { isAuthenticated: true, primaryCta: GUEST_CTA }
  } catch (error) {
    if (isDbOfflineError(error)) {
      return { isAuthenticated: session.isAuthenticated, primaryCta: GUEST_CTA }
    }
    throw error
  }
}
