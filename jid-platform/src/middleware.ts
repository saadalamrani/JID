import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { logActivity } from '@/lib/auth/audit'
import { checkConditions } from '@/lib/auth/conditions'
import { findMatchingGuard } from '@/lib/auth/guards'
import { isRoleAllowed } from '@/lib/auth/rbac'
import {
  getClientIp,
  isSessionExpired,
  isSuspended,
  loadMiddlewareSession,
  localeAwarePath,
} from '@/lib/auth/middleware-utils'
import { routing } from '@/lib/i18n/routing'
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
      return '/mentor/apply'
    case 'entity_claim_status':
      return '/company/claim'
    default:
      return '/login'
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (shouldSkipAuth(pathname)) {
    return NextResponse.next()
  }

  const guard = findMatchingGuard(pathname)

  // Run i18n first so locale cookies/redirects are applied; auth layers on top.
  const response = intlMiddleware(request)
  const supabase = createClient(request, response)

  // Public route (or no guard match) — refresh session only.
  if (!guard || guard.allowedRoles === null) {
    await supabase.auth.getUser()
    return response
  }

  // ── 1. Session check ────────────────────────────────────────────────────────
  const session = await loadMiddlewareSession(supabase, request)
  if (!session) {
    return redirectTo(request, '/login', { next: pathname })
  }

  // ── 2. Suspension check ─────────────────────────────────────────────────────
  if (isSuspended(session.profile)) {
    return redirectTo(request, '/auth/suspended')
  }

  // ── 3. Role check — 404 (never 403) ─────────────────────────────────────────
  if (!isRoleAllowed(session.role, guard.allowedRoles)) {
    return notFoundResponse()
  }

  // ── 4. Session max age (e.g. /sys = 2h) ─────────────────────────────────────
  if (guard.sessionMaxAge !== undefined && isSessionExpired(session.sessionIssuedAt, guard.sessionMaxAge)) {
    return redirectTo(request, '/auth/login', { reason: 'session_expired', next: pathname })
  }

  // ── 5. 2FA / AAL2 check ───────────────────────────────────────────────────
  if (guard.requires2FA && !session.isAal2) {
    return redirectTo(request, '/login/mfa', { next: pathname })
  }

  // ── 6. Conditions check ─────────────────────────────────────────────────────
  if (guard.conditions?.length) {
    const conditionResult = checkConditions(guard.conditions, session.conditionContext)
    if (!conditionResult.ok) {
      return redirectTo(request, conditionRedirectPath(conditionResult.failed))
    }
  }

  // ── 7. Audit logging ────────────────────────────────────────────────────────
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

  // ── 8. Header injection ─────────────────────────────────────────────────────
  response.headers.set('x-user-id', session.userId)
  response.headers.set('x-user-role', session.role)

  return response
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
}
