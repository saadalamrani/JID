/** Section 5 — staff portal session cap (8 hours). */
export const STAFF_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

/** Section 5.1 — sidebar/topbar warning when session has less than 30 minutes left. */
export const STAFF_SESSION_WARNING_THRESHOLD_SECONDS = 30 * 60

/** Section 15 — idle inactivity auto-logout (client-side). */
export const STAFF_IDLE_TIMEOUT_SECONDS = 30 * 60

export const STAFF_LOGIN_PATH = '/staff/login' as const
export const STAFF_MFA_PATH = '/staff/mfa' as const
export const STAFF_HOME_PATH = '/staff' as const

export type StaffQuickAction = {
  key: string
  href: string
  keywords?: string[]
}

/** Section 6 / 12 — command palette quick actions (bounded staff scope). */
export const STAFF_QUICK_ACTIONS: StaffQuickAction[] = [
  { key: 'dashboard', href: '/staff', keywords: ['home', 'overview'] },
  { key: 'claims', href: '/staff/claims', keywords: ['queue', 'ownership'] },
  { key: 'mentorApplications', href: '/staff/mentor-applications', keywords: ['mentors'] },
  { key: 'users', href: '/staff/users', keywords: ['individuals'] },
  { key: 'entities', href: '/staff/entities', keywords: ['companies', 'universities'] },
  { key: 'moderation', href: '/staff/moderation', keywords: ['flags', 'content'] },
  { key: 'announcements', href: '/staff/announcements', keywords: ['pulse', 'news'] },
  { key: 'audit', href: '/staff/audit', keywords: ['log', 'history', 'my actions'] },
]
