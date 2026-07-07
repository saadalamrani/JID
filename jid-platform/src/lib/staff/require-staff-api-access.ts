import 'server-only'

import type { SessionProfile } from '@/lib/auth/session'
import { fetchProfileForUser } from '@/lib/auth/session'
import type { UserRole } from '@/lib/auth/rbac'
import { createClient } from '@/lib/supabase/server'
import { getDevTestStaffProfile } from '@/lib/staff/dev-test-access'

/** Section 12 — roles allowed for bounded staff search API. */
export const STAFF_SEARCH_ROLES: readonly UserRole[] = ['staff', 'super_admin']

/**
 * In-route staff/super_admin check for /staff/search.
 * Returns null when access is denied (caller should respond with 404).
 */
export async function requireStaffApiSearchAccess(): Promise<SessionProfile | null> {
  const devProfile = getDevTestStaffProfile()
  if (devProfile && STAFF_SEARCH_ROLES.includes(devProfile.role)) {
    return devProfile
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await fetchProfileForUser(supabase, user.id)
  if (!profile || !STAFF_SEARCH_ROLES.includes(profile.role)) return null

  return profile
}
