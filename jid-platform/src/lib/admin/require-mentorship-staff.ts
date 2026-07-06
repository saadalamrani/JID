import 'server-only'

import { getSessionWithProfile } from '@/lib/auth/session-server'
import type { UserRole } from '@/lib/auth/rbac'

const MENTORSHIP_STAFF_ROLES: readonly UserRole[] = ['staff', 'super_admin']

export class AdminAuthError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminAuthError'
    this.status = status
  }
}

/** Section 4.2 staff review — staff and super_admin only (not generic privileged admin). */
export async function requireMentorshipStaff() {
  const session = await getSessionWithProfile()
  if (!session) {
    throw new AdminAuthError('UNAUTHORIZED', 401)
  }
  if (!(MENTORSHIP_STAFF_ROLES as readonly string[]).includes(session.profile.role)) {
    throw new AdminAuthError('FORBIDDEN', 403)
  }
  return session
}
