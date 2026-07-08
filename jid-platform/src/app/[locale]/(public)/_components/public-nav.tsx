import { getTranslations } from 'next-intl/server'
import { SmartHeader } from '@/components/layout/smart-header'
import { getProfileModeFromCookies } from '@/lib/mentor-mode/cookies'
import { resolveSmartHeaderSession } from '@/lib/navigation/smart-header-session'
import { cookies } from 'next/headers'

/** Section 4.2 / Part 6 — public top navigation with unified smart header. */
export async function PublicNav() {
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
    <SmartHeader
      isAuthenticated={session.isAuthenticated}
      userId={session.userId}
      fullName={session.fullName}
      avatarUrl={session.avatarUrl}
      roleLabel={roleLabel}
      dashboardHref={session.dashboardHref}
      hasMentorRole={session.hasMentorRole}
      initialMode={initialMode}
    />
  )
}
