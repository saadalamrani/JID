/**
 * Shared middleware helpers — profile loading, session age, dev test bypass.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { ConditionContext, EntityClaimStatus, MentorStatus } from './conditions'
import type { UserRole } from './rbac'
import { isUserRole } from './rbac'
import type { Database } from '@/lib/supabase/types'

export type MiddlewareProfile = {
  id: string
  role: UserRole
  full_name: string | null
  phone_verified_at: string | null
  locked_until: string | null
  mfa_enforced: boolean
}

export type MiddlewareSession = {
  userId: string
  role: UserRole
  profile: MiddlewareProfile
  conditionContext: ConditionContext
  /** Unix timestamp (seconds) when the session was issued. */
  sessionIssuedAt: number | null
  /** Whether the current session satisfies AAL2 (2FA). */
  isAal2: boolean
}

const DEV_TEST_HEADER_ROLE = 'x-jid-test-role'
const DEV_TEST_HEADER_USER = 'x-jid-test-user-id'

export function isDevTestBypassEnabled(): boolean {
  return process.env.NODE_ENV === 'development'
}

export function getDevTestSession(request: NextRequest): MiddlewareSession | null {
  if (!isDevTestBypassEnabled()) return null

  const roleHeader = request.headers.get(DEV_TEST_HEADER_ROLE)
  if (!roleHeader || !isUserRole(roleHeader)) return null

  const userId = request.headers.get(DEV_TEST_HEADER_USER) ?? '00000000-0000-4000-8000-000000000001'
  const phoneVerified = request.headers.get('x-jid-test-phone-verified') === 'true'
  const profileComplete = request.headers.get('x-jid-test-profile-complete') !== 'false'
  const mentorStatus = (request.headers.get('x-jid-test-mentor-status') ?? 'none') as MentorStatus
  const entityClaimStatus = (request.headers.get('x-jid-test-entity-claim') ??
    'none') as EntityClaimStatus
  const aal2 = request.headers.get('x-jid-test-aal2') === 'true'

  const profile: MiddlewareProfile = {
    id: userId,
    role: roleHeader,
    full_name: profileComplete ? 'Test User' : null,
    phone_verified_at: phoneVerified ? new Date().toISOString() : null,
    locked_until: request.headers.get('x-jid-test-suspended') === 'true'
      ? new Date(Date.now() + 86_400_000).toISOString()
      : null,
    mfa_enforced: false,
  }

  return {
    userId,
    role: roleHeader,
    profile,
    conditionContext: {
      profile,
      mentorStatus,
      entityClaimStatus,
      temporaryCompanyAccess: null,
    },
    sessionIssuedAt: Math.floor(Date.now() / 1000),
    isAal2: aal2,
  }
}

export async function loadMiddlewareSession(
  supabase: SupabaseClient<Database>,
  request: NextRequest,
): Promise<MiddlewareSession | null> {
  const devSession = getDevTestSession(request)
  if (devSession) return devSession

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return null

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone_verified_at, locked_until, mfa_enforced')
    .eq('id', user.id)
    .maybeSingle()

  if (!profileRow || !isUserRole(profileRow.role)) return null

  const profile: MiddlewareProfile = {
    id: profileRow.id,
    role: profileRow.role,
    full_name: profileRow.full_name,
    phone_verified_at: profileRow.phone_verified_at,
    locked_until: profileRow.locked_until,
    mfa_enforced: profileRow.mfa_enforced,
  }

  const conditionContext = await buildConditionContext(supabase, profile)

  let isAal2 = false
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    isAal2 = aal?.currentLevel === 'aal2'
  } catch {
    isAal2 = false
  }

  const sessionIssuedAt =
    typeof user.last_sign_in_at === 'string'
      ? Math.floor(new Date(user.last_sign_in_at).getTime() / 1000)
      : null

  return {
    userId: user.id,
    role: profile.role,
    profile,
    conditionContext,
    sessionIssuedAt,
    isAal2,
  }
}

async function buildConditionContext(
  supabase: SupabaseClient<Database>,
  profile: MiddlewareProfile,
): Promise<ConditionContext> {
  let mentorStatus: MentorStatus = 'none'
  let entityClaimStatus: EntityClaimStatus = 'none'
  let temporaryCompanyAccess: ConditionContext['temporaryCompanyAccess'] = null

  if (profile.role === 'individual') {
    mentorStatus = await resolveMentorStatus(supabase, profile.id)
  }

  if (profile.role === 'entity' || profile.role === 'company_admin' || profile.role === 'university_admin') {
    entityClaimStatus = await resolveEntityClaimStatus(supabase, profile.id)
    temporaryCompanyAccess = await resolveTemporaryCompanyAccess(supabase, profile.id)
  }

  return {
    profile,
    mentorStatus,
    entityClaimStatus,
    temporaryCompanyAccess,
  }
}

async function resolveMentorStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MentorStatus> {
  const { data } = await supabase
    .from('mentor_profiles')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data?.status) return 'none'

  switch (data.status) {
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'suspended':
      return 'suspended'
    case 'pending_review':
    case 'pending':
    case 'under_review':
      return 'pending'
    default:
      return 'none'
  }
}

async function resolveEntityClaimStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<EntityClaimStatus> {
  const { data } = await supabase
    .from('claim_requests')
    .select('status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.status) return 'none'
  return data.status as EntityClaimStatus
}

async function resolveTemporaryCompanyAccess(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ConditionContext['temporaryCompanyAccess']> {
  const { data } = await supabase
    .from('companies')
    .select('id, entity_state, claim_requested_at, claimed_by')
    .eq('claimed_by', userId)
    .eq('entity_state', 'pending_review')
    .maybeSingle()

  if (!data?.claim_requested_at || !data.claimed_by) return null

  return {
    companyId: data.id,
    entityState: data.entity_state,
    claimRequestedAt: data.claim_requested_at,
    claimedBy: data.claimed_by,
  }
}

export async function resolveEntityPendingReviewPath(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from('claim_requests')
    .select('claim_type, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data?.status) {
    return '/signup/entity-type'
  }

  if (data.status === 'rejected') {
    return data.claim_type === 'university' ? '/university/rejected' : '/company/rejected'
  }

  if (!['pending_review', 'pending', 'under_review'].includes(data.status)) {
    return '/signup/entity-type'
  }

  return data.claim_type === 'university'
    ? '/university/pending-review'
    : '/company/pending-review'
}

export function isSessionExpired(
  sessionIssuedAt: number | null,
  sessionMaxAge: number,
): boolean {
  if (sessionIssuedAt === null) return false
  const now = Math.floor(Date.now() / 1000)
  return now - sessionIssuedAt > sessionMaxAge
}

export function isSuspended(profile: MiddlewareProfile): boolean {
  if (profile.locked_until && new Date(profile.locked_until).getTime() > Date.now()) {
    return true
  }
  return false
}

export function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    null
  )
}

export function localeAwarePath(path: string, pathname: string): string {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    return path === '/' ? '/en' : `/en${path}`
  }
  if (pathname === '/ar' || pathname.startsWith('/ar/')) {
    return path === '/' ? '/ar' : `/ar${path}`
  }
  return path
}
