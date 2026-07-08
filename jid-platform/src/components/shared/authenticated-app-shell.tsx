'use client'

import type { ReactNode } from 'react'
import { usePathname } from '@/lib/i18n/navigation'
import { SmartHeader } from '@/components/layout/smart-header'
import { EncryptionKeyBootstrap } from '@/components/shared/encryption-key-bootstrap'
import { ProfileModeTransition } from '@/components/shared/profile-mode-transition'
import type { ProfileMode } from '@/lib/mentor-mode/constants'

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

const PORTAL_PREFIXES = ['/staff', '/sys', '/login', '/signup', '/forgot-password', '/reset-password']

/** Routes wrapped by `(public)/layout.tsx` — use PublicNav instead of this bar. */
const PUBLIC_SHELL_PREFIXES = [
  '/opportunities',
  '/catalog',
  '/mentors',
  '/pulse',
  '/universities',
  '/maintenance',
  '/privacy',
  '/terms',
  '/pdpl',
  '/contact',
  '/about',
]

/** Section 10 onboarding shell — dedicated layout, no portal top bar. */
const ONBOARDING_SHELL_PREFIXES = ['/welcome', '/individual', '/company/entity']

function shouldHideTopBar(pathname: string): boolean {
  const normalized = pathname.replace(/^\/(ar|en)/, '') || '/'
  if (normalized === '/' || normalized === '') return true
  if (
    PORTAL_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return true
  }
  if (
    ONBOARDING_SHELL_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
    )
  ) {
    return true
  }
  return PUBLIC_SHELL_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
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
  const showBar = isAuthenticated && !shouldHideTopBar(pathname)

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
