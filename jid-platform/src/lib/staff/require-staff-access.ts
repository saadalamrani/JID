import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { isSessionExpired } from '@/lib/auth/middleware-utils'
import { fetchProfileForUser, type SessionProfile } from '@/lib/auth/session'
import { PRIVILEGED_STAFF_ROLES, isRoleAllowed, isUserRole } from '@/lib/auth/rbac'
import { createClient } from '@/lib/supabase/server'
import {
  STAFF_LOGIN_PATH,
  STAFF_MFA_PATH,
  STAFF_SESSION_MAX_AGE_SECONDS,
} from '@/lib/staff/constants'
import { getDevTestRole, getDevTestStaffProfile } from '@/lib/staff/dev-test-access'

/**
 * Section 5 — four guards for the /staff shell (order matters).
 * 1. Session → /staff/login
 * 2. Role staff | admin | super_admin → 404 (never 403)
 * 3. MFA aal2 → /staff/mfa
 * 4. Session age < 8h → sign out + /staff/login?reason=expired
 */
export async function requireStaffShellAccess(): Promise<SessionProfile> {
  const devProfile = getDevTestStaffProfile()
  if (devProfile) return devProfile

  const devRole = getDevTestRole()
  if (devRole && isUserRole(devRole) && !isRoleAllowed(devRole, PRIVILEGED_STAFF_ROLES)) {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(STAFF_LOGIN_PATH)
  }

  const profile = await fetchProfileForUser(supabase, user.id)
  if (!profile) {
    redirect(STAFF_LOGIN_PATH)
  }

  if (!isRoleAllowed(profile.role, PRIVILEGED_STAFF_ROLES)) {
    notFound()
  }

  let isAal2 = false
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    isAal2 = aal?.currentLevel === 'aal2'
  } catch {
    isAal2 = false
  }

  if (!isAal2) {
    redirect(STAFF_MFA_PATH)
  }

  const sessionIssuedAt =
    typeof user.last_sign_in_at === 'string'
      ? Math.floor(new Date(user.last_sign_in_at).getTime() / 1000)
      : null

  if (isSessionExpired(sessionIssuedAt, STAFF_SESSION_MAX_AGE_SECONDS)) {
    await supabase.auth.signOut()
    redirect(`${STAFF_LOGIN_PATH}?reason=expired`)
  }

  return profile
}
