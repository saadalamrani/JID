'use client'

import { CalendarClock } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { useEffect, useState } from 'react'
import {
  formatDeadlineDaysLabel,
  formatDeadlineFullDate,
  resolveDeadlineUrgencyTier,
  type DeadlineUrgencyTier,
} from '@/lib/jobs/deadline'
import { TIMEZONE } from '@/lib/utils/constants'
import { cn } from '@/lib/utils'

type DeadlineBarProps = {
  /** Authoritative days-left from server query layer (Section 4.4). */
  daysLeft: number
  applicationDeadline: string
  className?: string
  size?: 'compact' | 'large'
}

const TIER_STYLES: Record<
  DeadlineUrgencyTier,
  { bar: string; text: string; pulse?: boolean }
> = {
  comfortable: {
    bar: 'bg-primary',
    text: 'text-primary-foreground',
  },
  moderate: {
    bar: 'bg-accent-200',
    text: 'text-primary-700',
  },
  urgent: {
    bar: 'bg-amber-500',
    text: 'text-primary-foreground',
  },
  last_day: {
    bar: 'bg-red-600',
    text: 'text-primary-foreground',
    pulse: true,
  },
}

function riyadhCalendarDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function parseCalendarDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, date))
}

function clientDaysLeft(applicationDeadline: string): number {
  const deadlineDay = riyadhCalendarDay(new Date(applicationDeadline))
  const todayDay = riyadhCalendarDay(new Date())
  const days = differenceInDays(
    parseCalendarDay(deadlineDay),
    parseCalendarDay(todayDay),
  )
  return Math.max(0, days)
}

/** Section 4.4 — deadline urgency bar; tier seeded from server, ticks client-side. */
export function DeadlineBar({
  daysLeft,
  applicationDeadline,
  className,
  size = 'compact',
}: DeadlineBarProps) {
  const [displayDaysLeft, setDisplayDaysLeft] = useState(daysLeft)

  useEffect(() => {
    setDisplayDaysLeft(daysLeft)
  }, [daysLeft])

  useEffect(() => {
    const tick = () => setDisplayDaysLeft(clientDaysLeft(applicationDeadline))
    tick()
    const interval = window.setInterval(tick, 60_000)
    return () => window.clearInterval(interval)
  }, [applicationDeadline])

  const tier = resolveDeadlineUrgencyTier(displayDaysLeft)
  const styles = TIER_STYLES[tier]
  const label = formatDeadlineDaysLabel(displayDaysLeft)
  const fullDate = formatDeadlineFullDate(applicationDeadline)

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg font-arabic font-medium',
        size === 'large' ? 'px-5 py-4 text-base' : 'px-3 py-2 text-xs',
        styles.bar,
        styles.text,
        styles.pulse && 'animate-pulse',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`الموعد النهائي: ${fullDate} — ${label}`}
    >
      <CalendarClock
        className={cn('shrink-0', size === 'large' ? 'h-6 w-6' : 'h-3.5 w-3.5')}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  )
}
