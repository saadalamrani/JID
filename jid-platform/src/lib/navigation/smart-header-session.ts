import { getPortalHomeForRole } from '@/lib/auth/portal-routes'
import type { UserRole } from '@/lib/auth/rbac'
import { isUserRole } from '@/lib/auth/rbac'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import { isDbOfflineError } from '@/lib/supabase/offline-error'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type SmartHeaderSession = {
  user: User | null
  userId: string | null
  fullName: string
  avatarUrl: string | null
  role: UserRole | null
  dashboardHref: string
  hasMentorRole: boolean
  isAuthenticated: boolean
}

const EMPTY_SESSION: SmartHeaderSession = {
  user: null,
  userId: null,
  fullName: '',
  avatarUrl: null,
  role: null,
  dashboardHref: '/me',
  hasMentorRole: false,
  isAuthenticated: false,
}

/** Server-side session resolution for SmartHeader (public + individual layouts). */
export async function resolveSmartHeaderSession(): Promise<SmartHeaderSession> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return EMPTY_SESSION
    }

    const [{ data: profile }, hasMentorRole] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .maybeSingle(),
      hasApprovedMentorProfile(user.id),
    ])

    const role =
      profile?.role && isUserRole(profile.role) ? (profile.role as UserRole) : null
    const dashboardHref = role ? getPortalHomeForRole(role) : '/me'

    return {
      user,
      userId: user.id,
      fullName: profile?.full_name?.trim() ?? '',
      avatarUrl: profile?.avatar_url ?? null,
      role,
      dashboardHref,
      hasMentorRole,
      isAuthenticated: true,
    }
  } catch (error) {
    if (isDbOfflineError(error)) {
      return EMPTY_SESSION
    }
    throw error
  }
}
