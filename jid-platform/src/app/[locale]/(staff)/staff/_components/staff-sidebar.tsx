'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Clock } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Link, usePathname } from '@/lib/i18n/navigation'
import {
  STAFF_NAV_SECTIONS,
  type StaffNavBadgeKey,
} from '@/lib/staff/nav'
import {
  STAFF_SESSION_MAX_AGE_SECONDS,
  STAFF_SESSION_WARNING_THRESHOLD_SECONDS,
} from '@/lib/staff/constants'
import { useStaffBadges } from '@/lib/staff/use-staff-badges'
import { cn } from '@/lib/utils'

type StaffSidebarProps = {
  sessionIssuedAt: number | null
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function SidebarSessionWarning({ sessionIssuedAt }: { sessionIssuedAt: number | null }) {
  const t = useTranslations('staff.sidebar')
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

  if (
    remainingSeconds === null ||
    remainingSeconds > STAFF_SESSION_WARNING_THRESHOLD_SECONDS ||
    remainingSeconds <= 0
  ) {
    return null
  }

  return (
    <div
      role="status"
      className="mx-3 mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{t('sessionWarning', { time: formatCountdown(remainingSeconds) })}</span>
    </div>
  )
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="rounded-full bg-jid-olive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

/** Section 5.1 — persistent sidebar with live badge counts (light mode only). */
export function StaffSidebar({ sessionIssuedAt }: StaffSidebarProps) {
  const t = useTranslations('staff.nav')
  const pathname = usePathname()
  const { data: badges } = useStaffBadges()

  function badgeCount(key: StaffNavBadgeKey): number {
    if (!badges) return 0
    return badges[key] ?? 0
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-e border-jid-line bg-white">
      <div className="border-b border-jid-line px-5 py-4">
        <Link href="/staff" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-lg font-semibold text-jid-olive">— Staff</span>
        </Link>
        <p className="mt-1 text-xs text-jid-ink/50">{t('portalLabel')}</p>
      </div>

      <SidebarSessionWarning sessionIssuedAt={sessionIssuedAt} />

      <nav aria-label={t('ariaLabel')} className="flex-1 overflow-y-auto px-3 py-4">
        {STAFF_NAV_SECTIONS.map((section) => (
          <div key={section.sectionKey} className="mb-5 last:mb-0">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-jid-ink/45">
              {t(`sections.${section.sectionKey}`)}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                const count = item.badgeKey ? badgeCount(item.badgeKey) : 0

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-jid-olive/10 font-medium text-jid-olive'
                          : 'text-jid-ink/75 hover:bg-jid-beige/70 hover:text-jid-ink',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="flex-1">{t(`items.${item.key}`)}</span>
                      <NavBadge count={count} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
