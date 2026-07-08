import { AuthenticatedAppShell } from '@/components/shared/authenticated-app-shell'
import { getProfileModeFromCookies } from '@/lib/mentor-mode/cookies'
import { resolveSmartHeaderSession } from '@/lib/navigation/smart-header-session'
import { getTranslations } from 'next-intl/server'
import { cookies } from 'next/headers'
import type { ReactNode } from 'react'

type AuthenticatedShellServerProps = {
  children: ReactNode
}

/** Resolves auth + profile server-side for layout shell (Section 4.1 / Part 6). */
export async function AuthenticatedShellServer({ children }: AuthenticatedShellServerProps) {
  const [session, t, cookieStore] = await Promise.all([
    resolveSmartHeaderSession(),
    getTranslations('profileDropdown'),
    cookies(),
  ])

  const initialMode = getProfileModeFromCookies(cookieStore)
  const roleLabel = session.hasMentorRole
    ? t('roles.mentor')
    : session.role
      ? t(`roles.${session.role}` as 'roles.individual')
      : t('roles.individual')

  return (
    <AuthenticatedAppShell
      isAuthenticated={session.isAuthenticated}
      hasMentorRole={session.hasMentorRole}
      initialMode={initialMode}
      userId={session.userId}
      fullName={session.fullName}
      avatarUrl={session.avatarUrl}
      roleLabel={roleLabel}
      dashboardHref={session.dashboardHref}
    >
      {children}
    </AuthenticatedAppShell>
  )
}
