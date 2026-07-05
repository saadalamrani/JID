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
  | 'entity_claim_status'

export type RouteGuard = {
  readonly id: string
  readonly pattern: RegExp
  /** `null` = public route (no session required). */
  readonly allowedRoles: readonly UserRole[] | null
  readonly conditions?: readonly RouteCondition[]
  readonly requires2FA?: boolean
  readonly auditLog?: boolean
  /** Maximum session age in seconds for this route. */
  readonly sessionMaxAge?: number
}

/** Optional locale segment: `/en`, `/ar`, or omitted (default `ar`). */
const L = '(?:/(?:ar|en))?'

export const ROUTE_GUARDS: readonly RouteGuard[] = [
  // ── Super admin portal ──────────────────────────────────────────────────────
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

  // ── Staff portal ────────────────────────────────────────────────────────────
  {
    id: 'staff-portal',
    pattern: new RegExp(`^${L}/staff(?:/|$)`),
    allowedRoles: ['staff', 'admin', 'super_admin'],
    requires2FA: true,
    auditLog: true,
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
    id: 'university-rejected',
    pattern: new RegExp(`^${L}/university/rejected(?:/|$)`),
    allowedRoles: ['entity'],
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
    allowedRoles: ['entity'],
  },

  // ── Company / university entity portals ─────────────────────────────────────
  {
    id: 'company-portal',
    pattern: new RegExp(`^${L}/company(?:/|$)`),
    allowedRoles: ['entity', 'company_admin'],
    conditions: ['entity_claim_status'],
  },
  {
    id: 'university-portal',
    pattern: new RegExp(`^${L}/university(?:/|$)`),
    allowedRoles: ['entity', 'university_admin'],
    conditions: ['entity_claim_status'],
  },

  // ── Individual profile owner (before /me portal) ────────────────────────────
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
    conditions: ['entity_claim_status'],
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
    id: 'public-profile',
    pattern: new RegExp(`^${L}/u/[0-9a-f-]{36}(?:/|$)`),
    allowedRoles: null,
  },
  {
    id: 'public-legal',
    pattern: new RegExp(`^${L}/(?:about|contact|privacy|terms)(?:/|$)`),
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
