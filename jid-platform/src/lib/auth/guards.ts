/**
 * Unified route guards — Section 5 / Section 11 Step 4
 *
 * Order matters: first match wins. More specific patterns are listed before broader ones.
 * Patterns include optional locale prefix (`/en` or `/ar`; default Arabic has no prefix).
 */

import type { UserRole } from './rbac'

export type RouteCondition =
  | 'phone_verified'
  | 'profile_complete'
  | 'mentor_status'
  | 'organization_profile'

export type OrganizationProfileType = 'business' | 'university'

export type RouteGuard = {
  readonly id: string
  readonly pattern: RegExp
  /** `null` = public route (no session required). */
  readonly allowedRoles: readonly UserRole[] | null
  readonly conditions?: readonly RouteCondition[]
  /** Required when `organization_profile` is in conditions (P-109). */
  readonly organizationProfileType?: OrganizationProfileType
  readonly requires2FA?: boolean
  readonly auditLog?: boolean
  /** Maximum session age in seconds for this route. */
  readonly sessionMaxAge?: number
}

/** Optional locale segment: `/en`, `/ar`, or omitted (default `ar`). */
const L = '(?:/(?:ar|en))?'

export const ROUTE_GUARDS: readonly RouteGuard[] = [
  // ── Super admin auth (public — before protected portal guard) ───────────────
  {
    id: 'sys-login',
    pattern: new RegExp(`^${L}/sys/login(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'sys-mfa',
    pattern: new RegExp(`^${L}/sys/mfa(?:/|$)`),
    allowedRoles: null,
  },

  // ── Super admin portal (protected) ──────────────────────────────────────────
  {
    id: 'super-admin-portal',
    pattern: new RegExp(`^${L}/sys(?:/|$)`),
    allowedRoles: ['super_admin'],
    requires2FA: true,
    auditLog: true,
    sessionMaxAge: 7200,
  },

  // ── Staff accept invite (public — before staff portal guard) ────────────────
  {
    id: 'staff-accept-invite',
    pattern: new RegExp(`^${L}/staff/accept-invite(?:/|$)`),
    allowedRoles: null,
  },

  // ── Staff auth (public — before protected portal guard) ───────────────────
  {
    id: 'staff-login',
    pattern: new RegExp(`^${L}/staff/login(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'staff-mfa',
    pattern: new RegExp(`^${L}/staff/mfa(?:/|$)`),
    allowedRoles: null,
  },

  // ── Staff portal ────────────────────────────────────────────────────────────
  {
    id: 'staff-portal',
    pattern: new RegExp(`^${L}/staff(?:/|$)`),
    allowedRoles: ['staff', 'admin', 'super_admin'],
    requires2FA: true,
    auditLog: true,
    sessionMaxAge: 28800,
  },

  // ── Mentor portal ───────────────────────────────────────────────────────────
  {
    id: 'mentor-portal',
    pattern: new RegExp(`^${L}/mentor(?:/|$)`),
    allowedRoles: ['individual'],
    conditions: ['phone_verified', 'mentor_status'],
  },

  // ── Entity rejected / reapply (before claim approval gate) ───────────────────
  {
    id: 'company-rejected',
    pattern: new RegExp(`^${L}/company/rejected(?:/|$)`),
    allowedRoles: ['entity'],
  },
  {
    id: 'company-reapply',
    pattern: new RegExp(`^${L}/company/claim/reapply(?:/|$)`),
    allowedRoles: ['entity'],
  },
  {
    id: 'university-create-profile',
    pattern: new RegExp(`^${L}/university/create-profile(?:/|$)`),
    allowedRoles: ['entity', 'university_admin'],
  },
  {
    id: 'university-rejected-page',
    pattern: new RegExp(`^${L}/university/rejected(?:/|$)`),
    allowedRoles: ['entity', 'university_admin'],
  },

  // ── Entity pending review (before claim approval gate) ──────────────────────
  {
    id: 'company-pending-review',
    pattern: new RegExp(`^${L}/company/pending-review(?:/|$)`),
    allowedRoles: ['entity'],
  },
  {
    id: 'university-pending-review',
    pattern: new RegExp(`^${L}/university/pending-review(?:/|$)`),
    allowedRoles: ['entity', 'university_admin'],
  },

  // ── Verification / onboarding landing pages (before organization_profile gate) ──
  {
    id: 'company-verification-pending',
    pattern: new RegExp(`^${L}/company/verification-pending(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
  },
  {
    id: 'company-verification-rejected',
    pattern: new RegExp(`^${L}/company/verification-rejected(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
  },
  {
    id: 'company-verification-reapply',
    pattern: new RegExp(`^${L}/company/verification/reapply(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
  },
  {
    id: 'company-create-profile',
    pattern: new RegExp(`^${L}/company/create-profile(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
  },
  {
    id: 'company-profile-suspended',
    pattern: new RegExp(`^${L}/company/profile-suspended(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
  },
  {
    id: 'university-profile-suspended',
    pattern: new RegExp(`^${L}/university/profile-suspended(?:/|$)`),
    allowedRoles: ['entity', 'university_admin'],
  },

  // ── Company / university entity portals ─────────────────────────────────────
  {
    id: 'company-jobs-applicants',
    pattern: new RegExp(`^${L}/jobs/[^/]+/applicants(?:/|$)`),
    allowedRoles: ['entity', 'company_admin', 'staff', 'admin', 'super_admin'],
  },
  {
    id: 'company-jobs-new',
    pattern: new RegExp(`^${L}/jobs/new(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
    conditions: ['organization_profile'],
    organizationProfileType: 'business',
  },
  {
    id: 'company-portal',
    pattern: new RegExp(`^${L}/company(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
    conditions: ['organization_profile'],
    organizationProfileType: 'business',
  },
  {
    id: 'university-portal',
    pattern: new RegExp(`^${L}/university(?:/|$)`),
    allowedRoles: ['entity', 'university_admin'],
    conditions: ['organization_profile'],
    organizationProfileType: 'university',
  },

  // ── Individual profile owner (before /me portal) ────────────────────────────
  {
    id: 'individual-settings-become-mentor',
    pattern: new RegExp(`^${L}/settings/become-mentor(?:/|$)`),
    allowedRoles: ['individual'],
  },
  {
    id: 'individual-settings-emails',
    pattern: new RegExp(`^${L}/settings/emails(?:/|$)`),
    allowedRoles: ['individual'],
  },
  {
    id: 'individual-settings-job-privacy',
    pattern: new RegExp(`^${L}/settings/job-privacy(?:/|$)`),
    allowedRoles: ['individual'],
  },
  {
    id: 'individual-profile',
    pattern: new RegExp(`^${L}/profile(?:/|$)`),
    allowedRoles: ['individual'],
  },

  // ── Company profile owner ───────────────────────────────────────────────────
  {
    id: 'company-profile-owner',
    pattern: new RegExp(`^${L}/company/profile(?:/|$)`),
    allowedRoles: ['company_admin'],
    conditions: ['organization_profile'],
    organizationProfileType: 'business',
  },

  // ── Mentor profile owner (pending mentors may edit; no mentor_status gate) ──
  {
    id: 'mentor-profile-owner',
    pattern: new RegExp(`^${L}/mentor/profile(?:/|$)`),
    allowedRoles: ['individual'],
  },

  // ── Individual settings (phone verify before profile_complete gate) ───────────
  {
    id: 'individual-settings',
    pattern: new RegExp(`^${L}/settings(?:/|$)`),
    allowedRoles: ['individual'],
  },

  // ── Onboarding shell (Section 10) ───────────────────────────────────────────
  {
    id: 'onboarding-welcome',
    pattern: new RegExp(`^${L}/welcome(?:/|$)`),
    allowedRoles: [
      'individual',
      'entity',
      'company_admin',
      'university_admin',
      'staff',
      'admin',
      'super_admin',
    ],
  },
  {
    id: 'onboarding-individual',
    pattern: new RegExp(`^${L}/individual(?:/|$)`),
    allowedRoles: ['individual'],
  },
  {
    id: 'onboarding-company-entity',
    pattern: new RegExp(`^${L}/company/entity(?:/|$)`),
    allowedRoles: ['company_admin', 'university_admin'],
  },
  {
    id: 'dashboard-redirect',
    pattern: new RegExp(`^${L}/dashboard(?:/|$)`),
    allowedRoles: [
      'individual',
      'entity',
      'company_admin',
      'university_admin',
      'staff',
      'admin',
      'super_admin',
    ],
  },

  // ── Individual portal ───────────────────────────────────────────────────────
  {
    id: 'individual-onboarding',
    pattern: new RegExp(`^${L}/me/onboarding(?:/|$)`),
    allowedRoles: ['individual'],
  },
  {
    id: 'individual-portal',
    pattern: new RegExp(`^${L}/me(?:/|$)`),
    allowedRoles: ['individual'],
    conditions: ['profile_complete'],
  },

  // ── Public routes ───────────────────────────────────────────────────────────
  {
    id: 'auth-login-mfa',
    pattern: new RegExp(`^${L}/login/mfa(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'auth-login',
    pattern: new RegExp(`^${L}/login(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'auth-signup',
    pattern: new RegExp(`^${L}/signup(?:/.*)?$`),
    allowedRoles: null,
  },
  {
    id: 'auth-verify-email-sent',
    pattern: new RegExp(`^${L}/verify-email-sent(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'auth-forgot-password',
    pattern: new RegExp(`^${L}/forgot-password(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'auth-reset-password',
    pattern: new RegExp(`^${L}/reset-password(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'account-suspended',
    pattern: new RegExp(`^${L}/account/suspended(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'auth-public',
    pattern: new RegExp(`^${L}/auth`),
    allowedRoles: null,
  },
  {
    id: 'public-opportunities',
    pattern: new RegExp(`^${L}/opportunities(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-jobs',
    pattern: new RegExp(`^${L}/jobs(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-catalog',
    pattern: new RegExp(`^${L}/catalog(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-companies',
    pattern: new RegExp(`^${L}/companies(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-universities',
    pattern: new RegExp(`^${L}/universities(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-mentors',
    pattern: new RegExp(`^${L}/mentors(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-individual-profile',
    pattern: new RegExp(`^${L}/profile/[0-9a-f-]{36}(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-profile',
    pattern: new RegExp(`^${L}/u/[0-9a-f-]{36}(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-legal',
    pattern: new RegExp(`^${L}/(?:about|contact|privacy|terms|pdpl)(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-home',
    pattern: new RegExp(`^${L}/?$`),
    allowedRoles: null,
  },
] as const

export function findMatchingGuard(pathname: string): RouteGuard | null {
  return ROUTE_GUARDS.find((guard) => guard.pattern.test(pathname)) ?? null
}
