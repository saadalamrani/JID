import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/auth/audit'
import { checkConditions } from '@/lib/auth/conditions'
import { findMatchingGuard } from '@/lib/auth/guards'
import { isRoleAllowed, PRIVILEGED_STAFF_ROLES } from '@/lib/auth/rbac'
import {
  getClientIp,
  isDevTestBypassEnabled,
  isSessionExpired,
  isSuspended,
  loadMiddlewareSession,
  localeAwarePath,
  resolveEntityPendingReviewPath,
} from '@/lib/auth/middleware-utils'
import { routing } from '@/lib/i18n/routing'
import {
  STAFF_LOGIN_PATH,
  STAFF_MFA_PATH,
  STAFF_SESSION_MAX_AGE_SECONDS,
} from '@/lib/staff/constants'
import { SYS_LOGIN_PATH, SYS_MFA_PATH, SYS_SESSION_MAX_AGE_SECONDS } from '@/lib/sys/constants'
import { getMiddlewarePlatformGates } from '@/lib/sys/platform-gates'
import {
  getMiddlewarePulsePublicEnabled,
  isPulsePath,
} from '@/lib/features/middleware-pulse-flag'
import { createClient } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware(routing)

const SKIP_PREFIXES = ['/api', '/_next', '/_vercel']
const SKIP_FILES = /\.[^/]+$/

function shouldSkipAuth(pathname: string): boolean {
  if (SKIP_FILES.test(pathname)) return true
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function notFoundResponse(): NextResponse {
  return new NextResponse(null, { status: 404 })
}

function redirectTo(request: NextRequest, path: string, query?: Record<string, string>): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = localeAwarePath(path, request.nextUrl.pathname)
  url.search = ''
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
  }
  return NextResponse.redirect(url)
}

function conditionRedirectPath(failed: string): string {
  switch (failed) {
    case 'profile_complete':
      return '/me/onboarding'
    case 'phone_verified':
      return '/settings/verify-phone'
    case 'mentor_status':
      return '/settings/become-mentor'
    case 'entity_claim_status':
      return '/company/pending-review'
    default:
      return '/login'
  }
}

/** Section 5.1 — super-admin portal guards (order: session → role → MFA → session age). */
async function handleSuperAdminPortal(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createClient>,
  pathname: string,
): Promise<NextResponse> {
  const session = await loadMiddlewareSession(supabase, request)

  if (!session) {
    return redirectTo(request, SYS_LOGIN_PATH, { next: pathname })
  }

  if (isSuspended(session.profile)) {
    return redirectTo(request, '/account/suspended')
  }

  if (!isRoleAllowed(session.role, ['super_admin'])) {
    return notFoundResponse()
  }

  if (!session.isAal2) {
    return redirectTo(request, SYS_MFA_PATH, { next: pathname })
  }

  if (isSessionExpired(session.sessionIssuedAt, SYS_SESSION_MAX_AGE_SECONDS)) {
    await supabase.auth.signOut()
    return redirectTo(request, SYS_LOGIN_PATH, { reason: 'expired' })
  }

  await logActivity({
    actorId: session.userId,
    actorRole: session.role,
    path: pathname,
    method: request.method,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
  })

  response.headers.set('x-user-id', session.userId)
  response.headers.set('x-user-role', session.role)
  response.headers.set('x-pathname', pathname)

  return response
}

/** Section 5 — staff portal guards (order: session → role → MFA → session age). */
async function handleStaffPortal(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createClient>,
  pathname: string,
): Promise<NextResponse> {
  const session = await loadMiddlewareSession(supabase, request)

  if (!session) {
    return redirectTo(request, STAFF_LOGIN_PATH, { next: pathname })
  }

  if (isSuspended(session.profile)) {
    return redirectTo(request, '/account/suspended')
  }

  if (!isRoleAllowed(session.role, PRIVILEGED_STAFF_ROLES)) {
    return notFoundResponse()
  }

  if (!session.isAal2) {
    return redirectTo(request, STAFF_MFA_PATH, { next: pathname })
  }

  if (isSessionExpired(session.sessionIssuedAt, STAFF_SESSION_MAX_AGE_SECONDS)) {
    await supabase.auth.signOut()
    return redirectTo(request, STAFF_LOGIN_PATH, { reason: 'expired' })
  }

  await logActivity({
    actorId: session.userId,
    actorRole: session.role,
    path: pathname,
    method: request.method,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
  })

  response.headers.set('x-user-id', session.userId)
  response.headers.set('x-user-role', session.role)
  response.headers.set('x-pathname', pathname)

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldSkipAuth(pathname)) {
    return NextResponse.next()
  }

  const guard = findMatchingGuard(pathname)

  const response = intlMiddleware(request)
  const supabase = createClient(request, response)

  response.headers.set('x-pathname', pathname)

  const gates = await getMiddlewarePlatformGates()
  const testMaintenance = request.headers.get('x-jid-test-maintenance') === 'true'
  const effectiveGates = testMaintenance
    ? { ...gates, maintenance: { enabled: true, message: 'test' } }
    : gates
  const isMaintenancePage = pathname.includes('/maintenance')
  const isSysAuthBypass =
    pathname.includes('/sys/login') || pathname.includes('/sys/mfa')
  const isStaffAuthBypass =
    pathname.includes('/staff/login') || pathname.includes('/staff/mfa')

  if (effectiveGates.maintenance.enabled && !isMaintenancePage) {
    const session = await loadMiddlewareSession(supabase, request)
    const isSuperAdmin = session?.role === 'super_admin' && session.isAal2

    if (!isSuperAdmin && !isSysAuthBypass && !isStaffAuthBypass) {
      return redirectTo(request, '/maintenance')
    }
  }

  if (!effectiveGates.registrationsOpen && /\/signup(?:\/|$)/.test(pathname)) {
    return redirectTo(request, '/maintenance')
  }

  // Section 6.11 — genuine 404 when pulse master flag is off (super_admin may pass through).
  if (isPulsePath(pathname)) {
    let pulsePublic = await getMiddlewarePulsePublicEnabled()
    if (isDevTestBypassEnabled()) {
      const testPulse = request.headers.get('x-jid-test-pulse-public')
      if (testPulse === 'true') pulsePublic = true
      if (testPulse === 'false') pulsePublic = false
    }

    if (!pulsePublic) {
      const pulseSession = await loadMiddlewareSession(supabase, request)
      const isSuperAdmin = pulseSession?.role === 'super_admin' && pulseSession.isAal2
      if (!isSuperAdmin) {
        return notFoundResponse()
      }
    }
  }

  if (!guard || guard.allowedRoles === null) {
    await supabase.auth.getUser()
    return response
  }

  if (guard.id === 'super-admin-portal') {
    return handleSuperAdminPortal(request, response, supabase, pathname)
  }

  if (guard.id === 'staff-portal') {
    return handleStaffPortal(request, response, supabase, pathname)
  }

  const session = await loadMiddlewareSession(supabase, request)
  if (!session) {
    return redirectTo(request, '/login', { next: pathname })
  }

  if (isSuspended(session.profile)) {
    return redirectTo(request, '/account/suspended')
  }

  if (!isRoleAllowed(session.role, guard.allowedRoles)) {
    return notFoundResponse()
  }

  if (guard.sessionMaxAge !== undefined && isSessionExpired(session.sessionIssuedAt, guard.sessionMaxAge)) {
    return redirectTo(request, '/auth/login', { reason: 'session_expired', next: pathname })
  }

  if (guard.requires2FA && !session.isAal2) {
    return redirectTo(request, '/login/mfa', { next: pathname })
  }

  if (guard.conditions?.length) {
    const conditionResult = checkConditions(guard.conditions, session.conditionContext)
    if (!conditionResult.ok) {
      if (conditionResult.failed === 'entity_claim_status') {
        const path = await resolveEntityPendingReviewPath(supabase, session.userId)
        return redirectTo(request, path)
      }
      return redirectTo(request, conditionRedirectPath(conditionResult.failed))
    }
  }

  if (guard.auditLog) {
    await logActivity({
      actorId: session.userId,
      actorRole: session.role,
      path: pathname,
      method: request.method,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    })
  }

  response.headers.set('x-user-id', session.userId)
  response.headers.set('x-user-role', session.role)

  return response
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
