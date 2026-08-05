import type { UserRole } from './rbac'
import { PRIVILEGED_STAFF_ROLES } from './rbac'

/**
 * Default portal home routes after login (Section 11 Step 7).
 * Individual → /me (capability-aware entry → /profile or mentor hub).
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

export function requiresMfaAtLogin(role: UserRole): boolean {
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
  if (safeNext) return safeNext

  // Skip /me bounce for approved mentors — capability on the same Individual identity.
  if (role === 'individual' && options?.mentorApproved) {
    return '/mentor/dashboard'
  }

  return getPortalHomeForRole(role)
}
