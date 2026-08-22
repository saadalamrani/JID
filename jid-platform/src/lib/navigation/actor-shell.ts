import type { UserRole } from '@/lib/auth/rbac'

/**
 * External product actors for authenticated chrome (SmartHeader / account menu).
 * Derived from existing `profiles.role` — no parallel RBAC.
 */
export type ShellActor = 'guest' | 'individual' | 'business' | 'university' | 'staff'

export type ShellNavItem = {
  href: string
  labelKey:
    | 'home'
    | 'exploreOpportunities'
    | 'radar'
    | 'mentorship'
    | 'catalog'
    | 'businessDashboard'
    | 'businessProfile'
    | 'businessJobs'
    | 'universityDashboard'
    | 'universityProfile'
}

export type ShellAccountAction = {
  key: 'profile' | 'radar' | 'cv' | 'dashboard' | 'mentorDashboard' | 'jobs'
  href: string
}

/** Individual + guest primary nav — unchanged from homepage spec. */
export const INDIVIDUAL_SHELL_NAV_ITEMS: readonly ShellNavItem[] = [
  { href: '/', labelKey: 'home' },
  { href: '/opportunities', labelKey: 'exploreOpportunities' },
  { href: '/radar', labelKey: 'radar' },
  { href: '/mentors', labelKey: 'mentorship' },
  { href: '/catalog', labelKey: 'catalog' },
] as const

/** Business primary nav — durable employer destinations only. */
export const BUSINESS_SHELL_NAV_ITEMS: readonly ShellNavItem[] = [
  { href: '/company/dashboard', labelKey: 'businessDashboard' },
  { href: '/company/profile', labelKey: 'businessProfile' },
  { href: '/jobs', labelKey: 'businessJobs' },
] as const

/** University primary nav — durable institutional destinations only. */
export const UNIVERSITY_SHELL_NAV_ITEMS: readonly ShellNavItem[] = [
  { href: '/university/dashboard', labelKey: 'universityDashboard' },
  { href: '/university/profile', labelKey: 'universityProfile' },
] as const

export function resolveShellActor(role: UserRole | null | undefined): ShellActor {
  if (!role) return 'guest'
  switch (role) {
    case 'individual':
      return 'individual'
    case 'entity':
    case 'company_admin':
      return 'business'
    case 'university_admin':
      return 'university'
    case 'staff':
    case 'admin':
    case 'super_admin':
      return 'staff'
    default:
      return 'guest'
  }
}

/** Center + mobile primary nav for the resolved shell actor. */
export function getSmartHeaderNavItems(actor: ShellActor): readonly ShellNavItem[] {
  switch (actor) {
    case 'business':
      return BUSINESS_SHELL_NAV_ITEMS
    case 'university':
      return UNIVERSITY_SHELL_NAV_ITEMS
    case 'staff':
      // Staff is internal — never present Individual discovery chrome on public pages.
      return [{ href: '/', labelKey: 'home' }] as const
    case 'individual':
    case 'guest':
      return INDIVIDUAL_SHELL_NAV_ITEMS
    default:
      return INDIVIDUAL_SHELL_NAV_ITEMS
  }
}

/**
 * Account-menu quick actions. Individual (incl. mentor capability) unchanged.
 * Org actors: real destinations only — no Radar / Mentorship / CV / invented Settings.
 */
export function getShellAccountActions(options: {
  actor: ShellActor
  dashboardHref: string
  hasMentorRole: boolean
}): readonly ShellAccountAction[] {
  const { actor, dashboardHref, hasMentorRole } = options

  if (actor === 'business') {
    return [
      { key: 'dashboard', href: '/company/dashboard' },
      { key: 'profile', href: '/company/profile' },
      { key: 'jobs', href: '/jobs' },
    ]
  }

  if (actor === 'university') {
    return [
      { key: 'dashboard', href: '/university/dashboard' },
      { key: 'profile', href: '/university/profile' },
    ]
  }

  if (actor === 'staff') {
    return [{ key: 'dashboard', href: dashboardHref }]
  }

  // Individual, guest (unused when unauthenticated)
  return [
    { key: 'profile', href: '/profile' },
    { key: 'radar', href: '/radar' },
    { key: 'cv', href: '/profile/cv' },
    { key: 'dashboard', href: dashboardHref },
    ...(hasMentorRole && actor === 'individual'
      ? ([{ key: 'mentorDashboard', href: '/mentor/dashboard' }] as const)
      : []),
  ]
}

/** Individual profile settings (`/profile/edit`) — not for org actors or Staff. */
export function shellShowsIndividualSettings(actor: ShellActor): boolean {
  return actor === 'individual'
}

/** Individual command palette (Radar/CV/Mentors quick jumps) — Individual + guest only. */
export function shellShowsIndividualCommandPalette(actor: ShellActor): boolean {
  return actor === 'individual' || actor === 'guest'
}

export function shellNavHrefs(actor: ShellActor): readonly string[] {
  return getSmartHeaderNavItems(actor).map((item) => item.href)
}

export function shellAccountHrefs(options: {
  actor: ShellActor
  dashboardHref: string
  hasMentorRole: boolean
}): readonly string[] {
  return getShellAccountActions(options).map((item) => item.href)
}
