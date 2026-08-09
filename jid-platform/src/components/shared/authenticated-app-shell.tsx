'use client'

import type { ReactNode } from 'react'
import { usePathname } from '@/lib/i18n/navigation'
import { SmartHeader } from '@/components/layout/smart-header'
import { EncryptionKeyBootstrap } from '@/components/shared/encryption-key-bootstrap'
import { ProfileModeTransition } from '@/components/shared/profile-mode-transition'
import { shouldHideAuthenticatedTopBar } from '@/lib/navigation/authenticated-shell-routes'
import type { ProfileMode } from '@/lib/mentor-mode/constants'

export {
  PUBLIC_SHELL_PREFIXES,
  isPublicProfilePath,
  shouldHideAuthenticatedTopBar,
} from '@/lib/navigation/authenticated-shell-routes'

type AuthenticatedAppShellProps = {
  children: ReactNode
  isAuthenticated: boolean
  hasMentorRole: boolean
  initialMode: ProfileMode
  userId: string | null
  fullName: string
  avatarUrl: string | null
  roleLabel: string
  dashboardHref: string
}

/** Part 6 — individual-facing layouts use the unified smart header. */
export function AuthenticatedAppShell({
  children,
  isAuthenticated,
  hasMentorRole,
  initialMode,
  userId,
  fullName,
  avatarUrl,
  roleLabel,
  dashboardHref,
}: AuthenticatedAppShellProps) {
  const pathname = usePathname()
  const showBar = isAuthenticated && !shouldHideAuthenticatedTopBar(pathname)

  return (
    <>
      <EncryptionKeyBootstrap userId={isAuthenticated ? userId : null} />
      {showBar ? (
        <SmartHeader
          isAuthenticated={isAuthenticated}
          userId={userId}
          fullName={fullName}
          avatarUrl={avatarUrl}
          roleLabel={roleLabel}
          dashboardHref={dashboardHref}
          hasMentorRole={hasMentorRole}
          initialMode={initialMode}
        />
      ) : null}
      <ProfileModeTransition>{children}</ProfileModeTransition>
    </>
  )
}
