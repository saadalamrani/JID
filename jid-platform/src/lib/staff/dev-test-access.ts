import 'server-only'

import { headers } from 'next/headers'
import type { SessionProfile } from '@/lib/auth/session'
import { isDevTestBypassEnabled } from '@/lib/auth/middleware-utils'
import { PRIVILEGED_STAFF_ROLES, isRoleAllowed, isUserRole } from '@/lib/auth/rbac'
import { STAFF_SESSION_MAX_AGE_SECONDS } from '@/lib/staff/constants'

/** Dev-only staff portal profile from x-jid-test-* headers (matches middleware bypass). */
export function getDevTestStaffProfile(): SessionProfile | null {
  if (!isDevTestBypassEnabled()) return null

  const headerStore = headers()
  const role = headerStore.get('x-jid-test-role')
  if (!role || !isUserRole(role) || !isRoleAllowed(role, PRIVILEGED_STAFF_ROLES)) {
    return null
  }
  if (headerStore.get('x-jid-test-aal2') !== 'true') return null

  const issuedAtHeader = headerStore.get('x-jid-test-session-issued-at')
  if (issuedAtHeader) {
    const issuedAt = Number.parseInt(issuedAtHeader, 10)
    const age = Math.floor(Date.now() / 1000) - issuedAt
    if (age > STAFF_SESSION_MAX_AGE_SECONDS) return null
  }

  const userId =
    headerStore.get('x-jid-test-user-id') ?? '00000000-0000-4000-8000-000000000002'

  return {
    id: userId,
    role,
    full_name: 'Test User',
    email_verified_at: null,
    phone_verified_at: null,
    locked_until: null,
    mfa_enabled: true,
    mfa_enforced: false,
    locale: 'en',
  }
}

export function getDevTestRole(): string | null {
  if (!isDevTestBypassEnabled()) return null
  const role = headers().get('x-jid-test-role')
  return role && isUserRole(role) ? role : null
}
