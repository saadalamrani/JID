'use client'

import type { ReactNode } from 'react'
import { usePathname } from '@/lib/i18n/navigation'
import { EncryptionKeyBootstrap } from '@/components/shared/encryption-key-bootstrap'
import { ProfileModeTransition } from '@/components/shared/profile-mode-transition'
import { ProfileSwitcher } from '@/components/shared/profile-switcher'
import { NotificationsBell } from '@/components/notifications/notifications-bell'
import { Link } from '@/lib/i18n/navigation'
import { siteConfig } from '@/config/site'
import type { ProfileMode } from '@/lib/mentor-mode/constants'

type AuthenticatedAppShellProps = {
  children: ReactNode
  isAuthenticated: boolean
  hasMentorRole: boolean
  initialMode: ProfileMode
  userId: string | null
}

const PORTAL_PREFIXES = ['/staff', '/sys', '/login', '/signup', '/forgot-password', '/reset-password']

function shouldHideTopBar(pathname: string): boolean {
  const normalized = pathname.replace(/^\/(ar|en)/, '') || '/'
  return PORTAL_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

/** Single authenticated top bar — ProfileSwitcher integration point (Section 4.1). */
export function AuthenticatedAppShell({
  children,
  isAuthenticated,
  hasMentorRole,
  initialMode,
  userId,
}: AuthenticatedAppShellProps) {
  const pathname = usePathname()
  const showBar = isAuthenticated && !shouldHideTopBar(pathname)

  return (
    <>
      <EncryptionKeyBootstrap userId={isAuthenticated ? userId : null} />
      {showBar ? (
        <header className="sticky top-0 z-40 border-b border-jid-line bg-white/95 backdrop-blur-sm">
          <div className="container-jid flex h-14 items-center justify-between gap-4">
            <Link href="/" className="font-arabic text-lg font-semibold text-jid-olive">
              {siteConfig.name}
            </Link>
            <div className="flex items-center gap-3">
              <NotificationsBell userId={userId} />
              <ProfileSwitcher hasMentorRole={hasMentorRole} initialMode={initialMode} />
            </div>
          </div>
        </header>
      ) : null}
      <ProfileModeTransition>{children}</ProfileModeTransition>
    </>
  )
}
