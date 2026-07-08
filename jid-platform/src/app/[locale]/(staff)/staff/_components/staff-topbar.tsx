'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import { NotificationsBell } from '@/components/notifications/notifications-bell'
import { ThemeToggleLazy } from '@/components/ui/theme-toggle-lazy'
import type { SessionProfile } from '@/lib/auth/session'
import {
  STAFF_SESSION_MAX_AGE_SECONDS,
  STAFF_SESSION_WARNING_THRESHOLD_SECONDS,
} from '@/lib/staff/constants'

type StaffTopbarProps = {
  profile: SessionProfile
  email?: string
  sessionIssuedAt: number | null
  onOpenCommandPalette: () => void
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function SessionCountdown({ sessionIssuedAt }: { sessionIssuedAt: number | null }) {
  const t = useTranslations('staff.topbar')
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!sessionIssuedAt) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => {
      const elapsed = Math.floor(Date.now() / 1000) - sessionIssuedAt
      const remaining = STAFF_SESSION_MAX_AGE_SECONDS - elapsed
      setRemainingSeconds(remaining > 0 ? remaining : 0)
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [sessionIssuedAt])

  if (remainingSeconds === null || remainingSeconds <= 0) {
    return null
  }

  const isWarning = remainingSeconds <= STAFF_SESSION_WARNING_THRESHOLD_SECONDS

  return (
    <div
      role="status"
      className={
        isWarning
          ? 'flex items-center gap-2 rounded-lg border border-sem-warning/30 bg-sem-warning/10 px-3 py-1.5 text-sm text-sem-warning'
          : 'flex items-center gap-2 rounded-lg border border-border bg-background/30 px-3 py-1.5 text-sm text-muted-foreground'
      }
    >
      <Clock className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        {isWarning
          ? t('sessionWarning', { time: formatCountdown(remainingSeconds) })
          : t('sessionRemaining', { time: formatCountdown(remainingSeconds) })}
      </span>
    </div>
  )
}

/** Section 5.1 / 6 — top bar with profile, session countdown, search, notifications, and theme. */
export function StaffTopbar({
  profile,
  email,
  sessionIssuedAt,
  onOpenCommandPalette,
}: StaffTopbarProps) {
  const t = useTranslations('staff.topbar')
  const displayName = profile.full_name?.trim() || email || t('unnamed')

  return (
    <header className="border-b border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <SessionCountdown sessionIssuedAt={sessionIssuedAt} />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            aria-label={t('searchPlaceholder')}
            className="hidden items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
          >
            <span>{t('searchPlaceholder')}</span>
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t('searchShortcut')}
            </kbd>
          </button>

          <NotificationsBell userId={profile.id} />
          <ThemeToggleLazy />

          <div className="flex items-center gap-2 rounded-lg border border-border bg-background/30 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-end">
              <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{t('roleLabel')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
