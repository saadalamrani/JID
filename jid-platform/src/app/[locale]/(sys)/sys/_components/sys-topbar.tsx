'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clock, ShieldAlert } from 'lucide-react'
import type { SessionProfile } from '@/lib/auth/session'
import { SYS_SESSION_MAX_AGE_SECONDS } from '@/lib/sys/constants'

const SESSION_WARNING_THRESHOLD_SECONDS = 15 * 60

type SysTopbarProps = {
  profile: SessionProfile
  email?: string
  sessionIssuedAt: number | null
  maintenanceMode: boolean
  maintenanceMessage: string | null
  onOpenCommandPalette: () => void
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function SessionCountdownWarning({ sessionIssuedAt }: { sessionIssuedAt: number | null }) {
  const t = useTranslations('sys.topbar')
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!sessionIssuedAt) {
      setRemainingSeconds(null)
      return
    }

    const tick = () => {
      const elapsed = Math.floor(Date.now() / 1000) - sessionIssuedAt
      const remaining = SYS_SESSION_MAX_AGE_SECONDS - elapsed
      setRemainingSeconds(remaining > 0 ? remaining : 0)
    }

    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [sessionIssuedAt])

  if (
    remainingSeconds === null ||
    remainingSeconds > SESSION_WARNING_THRESHOLD_SECONDS ||
    remainingSeconds <= 0
  ) {
    return null
  }

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900"
    >
      <Clock className="h-4 w-4 shrink-0" aria-hidden />
      <span>{t('sessionWarning', { time: formatCountdown(remainingSeconds) })}</span>
    </div>
  )
}

/** Section 5.2 / 15 — top bar with profile, session warning, and kill-switch banner. */
export function SysTopbar({
  profile,
  email,
  sessionIssuedAt,
  maintenanceMode,
  maintenanceMessage,
  onOpenCommandPalette,
}: SysTopbarProps) {
  const t = useTranslations('sys.topbar')
  const displayName = profile.full_name?.trim() || email || t('unnamed')

  return (
    <header className="border-b border-jid-line bg-white">
      {maintenanceMode ? (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium">{t('maintenanceActive')}</span>
          {maintenanceMessage ? (
            <span className="text-red-700/80">— {maintenanceMessage}</span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <SessionCountdownWarning sessionIssuedAt={sessionIssuedAt} />
        </div>

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
