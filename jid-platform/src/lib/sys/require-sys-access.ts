import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { isSessionExpired } from '@/lib/auth/middleware-utils'
import { fetchProfileForUser, type SessionProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import {
  SYS_LOGIN_PATH,
  SYS_MFA_PATH,
  SYS_SESSION_MAX_AGE_SECONDS,
} from '@/lib/sys/constants'
import { getDevTestRole, getDevTestSuperAdminProfile } from '@/lib/sys/dev-test-access'

/**
 * Section 5.1 — four guards for the /sys shell (order matters).
 * 1. Session → /sys/login
 * 2. Role super_admin only → 404 (never 403)
 * 3. MFA aal2 → /sys/mfa
 * 4. Session age < 2h → sign out + /sys/login?reason=expired
 */
export async function requireSysShellAccess(): Promise<SessionProfile> {
  const devProfile = getDevTestSuperAdminProfile()
  if (devProfile) return devProfile

  const devRole = getDevTestRole()
  if (devRole && devRole !== 'super_admin') {
    notFound()
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(SYS_LOGIN_PATH)
  }

  const profile = await fetchProfileForUser(supabase, user.id)
  if (!profile) {
    redirect(SYS_LOGIN_PATH)
  }

  if (profile.role !== 'super_admin') {
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
    redirect(SYS_MFA_PATH)
  }

  const sessionIssuedAt =
    typeof user.last_sign_in_at === 'string'
      ? Math.floor(new Date(user.last_sign_in_at).getTime() / 1000)
      : null

  if (isSessionExpired(sessionIssuedAt, SYS_SESSION_MAX_AGE_SECONDS)) {
    await supabase.auth.signOut()
    redirect(`${SYS_LOGIN_PATH}?reason=expired`)
  }

  return profile
}
