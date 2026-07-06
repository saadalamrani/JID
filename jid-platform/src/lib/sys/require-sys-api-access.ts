import 'server-only'

import type { SessionProfile } from '@/lib/auth/session'
import { fetchProfileForUser } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { getDevTestSuperAdminProfile } from '@/lib/sys/dev-test-access'

/**
 * Section 12 — in-route super_admin check for /sys API handlers.
 * Returns null when access is denied (caller should respond with 404).
 */
export async function requireSysApiSuperAdmin(): Promise<SessionProfile | null> {
  const devProfile = getDevTestSuperAdminProfile()
  if (devProfile) return devProfile

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await fetchProfileForUser(supabase, user.id)
  if (!profile || profile.role !== 'super_admin') return null

  return profile
}
