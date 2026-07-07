'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Bell, Clock } from 'lucide-react'
import type { SessionProfile } from '@/lib/auth/session'
import {
  STAFF_SESSION_MAX_AGE_SECONDS,
  STAFF_SESSION_WARNING_THRESHOLD_SECONDS,
} from '@/lib/staff/constants'
import { useStaffBadges } from '@/lib/staff/use-staff-badges'

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
          ? 'flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900'
          : 'flex items-center gap-2 rounded-lg border border-jid-line bg-jid-beige/30 px-3 py-1.5 text-sm text-jid-ink/70'
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

/** Section 5.1 / 6 — top bar with profile, session countdown, search, and notifications. */
export function StaffTopbar({
  profile,
  email,
  sessionIssuedAt,
  onOpenCommandPalette,
}: StaffTopbarProps) {
  const t = useTranslations('staff.topbar')
  const { data: badges } = useStaffBadges()
  const displayName = profile.full_name?.trim() || email || t('unnamed')
  const notificationCount = badges?.notifications ?? 0

  return (
    <header className="border-b border-jid-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <SessionCountdown sessionIssuedAt={sessionIssuedAt} />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="hidden items-center gap-2 rounded-lg border border-jid-line bg-jid-beige/40 px-3 py-1.5 text-sm text-jid-ink/70 transition-colors hover:bg-jid-beige/80 sm:flex"
          >
            <span>{t('searchPlaceholder')}</span>
            <kbd className="rounded border border-jid-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-jid-ink/60">
              {t('searchShortcut')}
            </kbd>
          </button>

          <button
            type="button"
            className="relative rounded-lg border border-jid-line bg-jid-beige/30 p-2 text-jid-ink/70 transition-colors hover:bg-jid-beige/60"
            aria-label={t('notificationsAria')}
            title={t('notificationsAria')}
          >
            <Bell className="h-4 w-4" aria-hidden />
            {notificationCount > 0 ? (
              <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-jid-olive px-1 text-[10px] font-semibold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            ) : null}
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-jid-line bg-jid-beige/30 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-jid-olive/15 text-sm font-semibold text-jid-olive">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-end">
              <p className="truncate text-sm font-medium text-jid-ink">{displayName}</p>
              <p className="text-xs text-jid-ink/55">{t('roleLabel')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
