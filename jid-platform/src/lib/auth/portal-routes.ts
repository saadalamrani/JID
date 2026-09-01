import type { UserRole } from './rbac'
import { isRoleAllowed, PRIVILEGED_STAFF_ROLES } from './rbac'
import { findMatchingGuard } from './guards'

/** Authorized JID nonprod project ref — never production. */
const JID_NONPROD_SUPABASE_REF = 'hmjuijmaefajdjrjdsxu'

/**
 * True only when the baked public Supabase URL targets jid-nonprod.
 * Used for interview-prototype Staff MFA waiver (APP_ENV may not be inlined).
 * Keep the env access as a direct `process.env.NEXT_PUBLIC_*` read so Next.js
 * inlines it for Edge middleware and the client bundle.
 */
export function isAuthorizedNonprodInterviewTarget(): boolean {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes(JID_NONPROD_SUPABASE_REF)
}

/**
 * Default portal home routes after login (Section 11 Step 7).
 * Individual → /me (capability-aware entry → /home or mentor hub — D1 R2,
 * docs/design-research/D1_REFERENCE_EXPERIENCES.md#r2).
 * Entity → company dashboard.
 */
export function getPortalHomeForRole(role: UserRole): string {
  switch (role) {
    case 'individual':
      return '/me'
    case 'entity':
      return '/company/dashboard'
    case 'company_admin':
      return '/company/dashboard'
    case 'university_admin':
      return '/university/dashboard'
    case 'staff':
    case 'admin':
      return '/staff'
    case 'super_admin':
      return '/sys/dashboard'
    default:
      return '/'
  }
}

/**
 * Interview nonprod prototype: Staff MFA is waived so the founder can open the
 * Staff verification queue without a TOTP device. Production keeps MFA.
 */
export function requiresMfaAtLogin(role: UserRole): boolean {
  if (isAuthorizedNonprodInterviewTarget()) return false
  return (PRIVILEGED_STAFF_ROLES as readonly string[]).includes(role)
}

/** Prevent open redirects — only allow same-origin relative paths. */
export function sanitizePostLoginPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null
  if (path.startsWith('/login')) return null
  return path
}

export function resolvePostLoginDestination(
  role: UserRole,
  options?: {
    next?: string | null
    needsMfa?: boolean
    needsMfaSetup?: boolean
    mentorApproved?: boolean
  },
): string {
  if (options?.needsMfa) {
    const params = new URLSearchParams()
    const safeNext = sanitizePostLoginPath(options.next)
    if (safeNext) params.set('next', safeNext)
    if (options.needsMfaSetup) params.set('setup', '1')
    const query = params.toString()
    return query ? `/login/mfa?${query}` : '/login/mfa'
  }

  const safeNext = sanitizePostLoginPath(options?.next)
  if (safeNext && isPostLoginNextAllowedForRole(role, safeNext)) {
    return safeNext
  }

  // Skip /me bounce for approved mentors — capability on the same Individual identity.
  if (role === 'individual' && options?.mentorApproved) {
    return '/mentor/dashboard'
  }

  return getPortalHomeForRole(role)
}

/**
 * Drop `next` targets the role cannot enter — prevents login → forbidden route → login loops
 * (e.g. Business actor with next=/radar after Organization Shell separation).
 */
export function isPostLoginNextAllowedForRole(role: UserRole, path: string): boolean {
  const pathname = path.split('?')[0] ?? path
  const guard = findMatchingGuard(pathname)
  if (!guard || guard.allowedRoles === null) return true
  return isRoleAllowed(role, guard.allowedRoles)
}
