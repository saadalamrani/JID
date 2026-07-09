'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/brand/logo'
import { CommandPaletteTrigger } from '@/components/layout/command-palette-trigger'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { GuestAuthActions, ProfileDropdown } from '@/components/layout/profile-dropdown'
import { useCommandPaletteHotkey } from '@/components/shared/command-palette'
import { ThemeToggleLazy } from '@/components/ui/theme-toggle-lazy'

const NotificationsBell = dynamic(
  () =>
    import('@/components/notifications/notifications-bell').then((mod) => ({
      default: mod.NotificationsBell,
    })),
  { loading: () => <div className="h-9 w-9 shrink-0" aria-hidden /> },
)

const IndividualCommandPalette = dynamic(
  () =>
    import('@/components/layout/individual-command-palette').then((mod) => ({
      default: mod.IndividualCommandPalette,
    })),
  { ssr: false },
)
import { Link } from '@/lib/i18n/navigation'
import type { ProfileMode } from '@/lib/mentor-mode/constants'
import { cn } from '@/lib/utils'

const PRIMARY_LINKS = [
  { href: '/opportunities', labelKey: 'opportunities' },
  { href: '/mentors', labelKey: 'mentors' },
  { href: '/catalog', labelKey: 'catalog' },
  { href: '/pulse', labelKey: 'pulse' },
] as const

const SCROLL_BLUR_THRESHOLD_PX = 20

export type SmartHeaderProps = {
  isAuthenticated: boolean
  userId: string | null
  fullName: string
  avatarUrl: string | null
  roleLabel: string
  dashboardHref: string
  hasMentorRole: boolean
  initialMode?: ProfileMode
}

function useHeaderScrolled(threshold = SCROLL_BLUR_THRESHOLD_PX) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

/** Part 6 — unified sticky smart header for public pages and individual-facing layouts. */
export function SmartHeader({
  isAuthenticated,
  userId,
  fullName,
  avatarUrl,
  roleLabel,
  dashboardHref,
  hasMentorRole,
  initialMode,
}: SmartHeaderProps) {
  const tNav = useTranslations('publicShell.nav')
  const scrolled = useHeaderScrolled()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const togglePalette = useCallback(() => {
    setPaletteOpen((current) => !current)
  }, [])

  useCommandPaletteHotkey(togglePalette)

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-border transition-[background-color,backdrop-filter]',
          scrolled ? 'bg-background/80 backdrop-blur-md' : 'bg-background',
        )}
      >
        <div className="container-jid grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex h-8 min-w-0 max-w-[5.5rem] shrink-0 items-center overflow-hidden">
            <Link
              href="/"
              className="flex h-8 items-center overflow-hidden"
              aria-label={tNav('homeAria', { name: 'JID' })}
            >
              <Logo size="md" />
            </Link>
          </div>

          <nav
            className="hidden items-center justify-center gap-1 md:flex"
            aria-label={tNav('primaryAria')}
          >
            {PRIMARY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
                  'hover:bg-surface hover:text-primary',
                )}
              >
                {tNav(item.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />
            {isAuthenticated ? <NotificationsBell userId={userId} /> : null}
            <ThemeToggleLazy />
            <LanguageSwitcher />
            {isAuthenticated ? (
              <ProfileDropdown
                fullName={fullName}
                avatarUrl={avatarUrl}
                roleLabel={roleLabel}
                dashboardHref={dashboardHref}
                hasMentorRole={hasMentorRole}
                initialMode={initialMode}
              />
            ) : (
              <GuestAuthActions />
            )}
          </div>
        </div>
      </header>

      {paletteOpen ? (
        <IndividualCommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          isAuthenticated={isAuthenticated}
        />
      ) : null}
    </>
  )
}
