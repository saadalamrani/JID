'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/brand/logo'
import { CommandPaletteTrigger } from '@/components/layout/command-palette-trigger'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { GuestAuthActions, ProfileDropdown } from '@/components/layout/profile-dropdown'
import { SMART_HEADER_NAV_ITEMS } from '@/components/layout/smart-header-nav'
import { SmartHeaderMobileMenu } from '@/components/layout/smart-header-mobile-menu'
import { useCommandPaletteHotkey } from '@/components/shared/command-palette'
import { ThemeToggleLazy } from '@/components/ui/theme-toggle-lazy'
import { Link, usePathname } from '@/lib/i18n/navigation'
import type { ProfileMode } from '@/lib/mentor-mode/constants'
import { cn } from '@/lib/utils'

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

const SCROLL_BLUR_THRESHOLD_PX = 20

const ON_DARK_ICON =
  'border-jid-olive-700/80 bg-jid-olive-800/60 text-jid-beige/85 hover:bg-jid-olive-800 hover:text-jid-beige'

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

function normalizePath(pathname: string): string {
  const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/'
  return stripped === '' ? '/' : stripped
}

function isNavActive(normalizedPath: string, href: string): boolean {
  if (href === '/') return normalizedPath === '/'
  return normalizedPath === href || normalizedPath.startsWith(`${href}/`)
}

/**
 * Part 6 — unified sticky smart header.
 * FLAGGED DECISION: brand-constant dark olive bar (`jid-olive-900` = `#1E2620`) in both
 * light/dark site themes; page body below still follows theme toggle.
 */
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
  const pathname = usePathname()
  const normalizedPath = normalizePath(pathname)
  const scrolled = useHeaderScrolled()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const togglePalette = useCallback(() => {
    setPaletteOpen((current) => !current)
  }, [])

  useCommandPaletteHotkey(togglePalette)

  const checkActive = (href: string) => isNavActive(normalizedPath, href)

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 border-b border-jid-olive-800 transition-[background-color,backdrop-filter]',
          'bg-jid-olive-900 text-jid-beige',
          scrolled && 'bg-jid-olive-900/90 backdrop-blur-md',
        )}
      >
        <div className="container-jid grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <SmartHeaderMobileMenu items={SMART_HEADER_NAV_ITEMS} isActive={checkActive} />
            <div className="flex h-8 min-w-0 max-w-[5.5rem] shrink-0 items-center overflow-hidden">
              <Link
                href="/"
                className="flex h-8 items-center overflow-hidden"
                aria-label={tNav('homeAria', { name: 'JID' })}
              >
                <Logo size="md" appearance="on-dark" />
              </Link>
            </div>
          </div>

          <nav
            className="hidden items-center justify-center gap-0.5 md:flex"
            aria-label={tNav('primaryAria')}
          >
            {SMART_HEADER_NAV_ITEMS.map((item) => {
              const active = checkActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-jid-beige after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-jid-gold'
                      : 'text-jid-beige/75 hover:text-jid-beige',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {tNav(item.labelKey)}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} className={ON_DARK_ICON} />
            {isAuthenticated ? (
              <NotificationsBell userId={userId} className={ON_DARK_ICON} />
            ) : null}
            <div className="[&_button]:text-jid-beige/85 [&_button]:hover:bg-jid-olive-800">
              <ThemeToggleLazy />
            </div>
            <LanguageSwitcher tone="on-dark" className="hidden sm:inline-flex" />
            {isAuthenticated ? (
              <ProfileDropdown
                fullName={fullName}
                avatarUrl={avatarUrl}
                roleLabel={roleLabel}
                dashboardHref={dashboardHref}
                hasMentorRole={hasMentorRole}
                initialMode={initialMode}
                tone="on-dark"
              />
            ) : (
              <>
                <GuestAuthActions className="hidden sm:flex" tone="on-dark" />
                <GuestAuthActions className="sm:hidden" tone="on-dark" compact />
              </>
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
