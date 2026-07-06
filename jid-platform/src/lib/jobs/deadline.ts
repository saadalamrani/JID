import { differenceInDays } from 'date-fns'
import { TIMEZONE } from '@/lib/utils/constants'

/** Calendar date in Asia/Riyadh as YYYY-MM-DD (server-authoritative day boundary). */
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

/**
 * Whole calendar days until application_deadline (Riyadh), floored at 0.
 * Used server-side in fetchJobs — never rely on client clock for initial tier.
 */
export function computeDeadlineDaysLeft(
  applicationDeadline: string,
  now: Date = new Date(),
): number {
  const deadlineDay = riyadhCalendarDay(new Date(applicationDeadline))
  const todayDay = riyadhCalendarDay(now)
  const days = differenceInDays(
    parseCalendarDay(deadlineDay),
    parseCalendarDay(todayDay),
  )
  return Math.max(0, days)
}

export type DeadlineUrgencyTier = 'comfortable' | 'moderate' | 'urgent' | 'last_day'

/** Section 4.4 — >7 olive, 3–7 gold-soft, <3 amber, 0 red pulsing. */
export function resolveDeadlineUrgencyTier(daysLeft: number): DeadlineUrgencyTier {
  if (daysLeft <= 0) return 'last_day'
  if (daysLeft < 3) return 'urgent'
  if (daysLeft <= 7) return 'moderate'
  return 'comfortable'
}

export function formatDeadlineDaysLabel(daysLeft: number): string {
  if (daysLeft <= 0) return 'يغلق اليوم'
  if (daysLeft === 1) return 'يوم واحد متبقٍ'
  if (daysLeft === 2) return 'يومان متبقيان'
  if (daysLeft <= 10) return `${daysLeft} أيام متبقية`
  return `${daysLeft} يومًا متبقيًا`
}

/** Section 10 — full calendar date for aria-label (Riyadh). */
export function formatDeadlineFullDate(applicationDeadline: string): string {
  return new Intl.DateTimeFormat('ar-SA', {
    timeZone: TIMEZONE,
    dateStyle: 'full',
  }).format(new Date(applicationDeadline))
}
