import { AuthenticatedAppShell } from '@/components/shared/authenticated-app-shell'
import { getProfileModeFromCookies } from '@/lib/mentor-mode/cookies'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import { isDbOfflineError } from '@/lib/supabase/offline-error'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'

type AuthenticatedShellServerProps = {
  children: ReactNode
}

/** Resolves auth + mentor role server-side for layout shell (Section 4.1). */
export async function AuthenticatedShellServer({ children }: AuthenticatedShellServerProps) {
  let user: User | null = null
  let hasMentorRole = false

  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
    hasMentorRole = user ? await hasApprovedMentorProfile(user.id) : false
  } catch (error) {
    if (!isDbOfflineError(error)) {
      throw error
    }
  }

  const cookieStore = await cookies()
  const initialMode = getProfileModeFromCookies(cookieStore)

  return (
    <AuthenticatedAppShell
      isAuthenticated={Boolean(user)}
      hasMentorRole={hasMentorRole}
      initialMode={initialMode}
      userId={user?.id ?? null}
    >
      {children}
    </AuthenticatedAppShell>
  )
}
