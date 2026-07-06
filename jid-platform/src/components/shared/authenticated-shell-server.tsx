import { AuthenticatedAppShell } from '@/components/shared/authenticated-app-shell'
import { getProfileModeFromCookies } from '@/lib/mentor-mode/cookies'
import { hasApprovedMentorProfile } from '@/lib/mentor-mode/has-mentor-role'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'

type AuthenticatedShellServerProps = {
  children: ReactNode
}

/** Resolves auth + mentor role server-side for layout shell (Section 4.1). */
export async function AuthenticatedShellServer({ children }: AuthenticatedShellServerProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const initialMode = getProfileModeFromCookies(cookieStore)
  const hasMentorRole = user ? await hasApprovedMentorProfile(user.id) : false

  return (
    <AuthenticatedAppShell
      isAuthenticated={Boolean(user)}
      hasMentorRole={hasMentorRole}
      initialMode={initialMode}
    >
      {children}
    </AuthenticatedAppShell>
  )
}
