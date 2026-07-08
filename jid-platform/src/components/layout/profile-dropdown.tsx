'use client'

import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Radar,
  Settings,
  User,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { ProfileSwitcher } from '@/components/shared/profile-switcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { ProfileMode } from '@/lib/mentor-mode/constants'
import { cn } from '@/lib/utils'

type ProfileDropdownProps = {
  fullName: string
  avatarUrl: string | null
  roleLabel: string
  dashboardHref: string
  hasMentorRole: boolean
  initialMode?: ProfileMode
  className?: string
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
}

function ThemeMenuItems() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('profileDropdown')

  return (
    <>
      <DropdownMenuItem onClick={() => setTheme('light')}>
        {t('themeLight')}
        {theme === 'light' ? <span className="ms-auto text-xs text-muted-foreground">✓</span> : null}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme('dark')}>
        {t('themeDark')}
        {theme === 'dark' ? <span className="ms-auto text-xs text-muted-foreground">✓</span> : null}
      </DropdownMenuItem>
    </>
  )
}

/** Part 6 — profile menu: avatar, role, quick actions, settings, notifications, theme, language, logout. */
export function ProfileDropdown({
  fullName,
  avatarUrl,
  roleLabel,
  dashboardHref,
  hasMentorRole,
  initialMode,
  className,
}: ProfileDropdownProps) {
  const t = useTranslations('profileDropdown')
  const router = useRouter()
  const locale = useLocale()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const displayName = fullName.trim() || t('unnamed')
  const initials = initialsFromName(displayName)

  const quickActions = [
    { key: 'profile', href: '/profile', icon: User },
    { key: 'radar', href: '/radar', icon: Radar },
    { key: 'cv', href: '/profile/cv', icon: FileText },
    { key: 'dashboard', href: dashboardHref, icon: LayoutDashboard },
    ...(hasMentorRole
      ? [{ key: 'mentorDashboard' as const, href: '/mentor/dashboard', icon: LayoutDashboard }]
      : []),
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-sm font-semibold text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            className,
          )}
          aria-label={t('menuAria')}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span aria-hidden>{initials}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-sm font-semibold text-primary">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span aria-hidden>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        {hasMentorRole ? (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <ProfileSwitcher hasMentorRole={hasMentorRole} initialMode={initialMode} />
            </div>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{t('quickActions')}</p>
        {quickActions.map(({ key, href, icon: Icon }) => (
          <DropdownMenuItem key={key} onClick={() => router.push(href)}>
            <Icon className="h-4 w-4" aria-hidden />
            {t(`actions.${key}` as 'actions.profile')}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile/edit')}>
          <Settings className="h-4 w-4" aria-hidden />
          {t('settings')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/notifications')}>
          <Bell className="h-4 w-4" aria-hidden />
          {t('notifications')}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">{t('appearance')}</p>
        <ThemeMenuItems />

        <DropdownMenuSeparator />
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {t('language')} ({locale === 'ar' ? 'العربية' : 'English'})
        </p>
        <div className="px-2 pb-1">
          <LanguageSwitcher variant="compact" />
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleLogout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type GuestAuthActionsProps = {
  className?: string
}

export function GuestAuthActions({ className }: GuestAuthActionsProps) {
  const t = useTranslations('publicShell.nav')

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button asChild variant="ghost" className="text-foreground">
        <Link href="/login">{t('login')}</Link>
      </Button>
      <Button asChild className="bg-accent text-primary-foreground hover:bg-accent/90">
        <Link href="/signup">{t('signup')}</Link>
      </Button>
    </div>
  )
}
