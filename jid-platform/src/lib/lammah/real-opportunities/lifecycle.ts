import type { LammahLifecycleStatus } from './types'

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000

export function riyadhInstant(iso: string): Date {
  return new Date(iso)
}

export function classifyLifecycle(input: {
  now: Date
  opensAt: string | null
  deadlineAt: string | null
  applyCtaPresent: boolean
  filledOrClosedBanner: boolean
  sourceExplicitlyOpen: boolean
}): LammahLifecycleStatus {
  if (input.filledOrClosedBanner) return 'closed'

  if (input.deadlineAt) {
    const deadline = riyadhInstant(input.deadlineAt)
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < input.now.getTime()) {
      return 'closed'
    }
  }

  if (input.opensAt) {
    const opens = riyadhInstant(input.opensAt)
    if (!Number.isNaN(opens.getTime()) && opens.getTime() > input.now.getTime()) {
      return 'upcoming'
    }
  }

  if (input.applyCtaPresent || input.sourceExplicitlyOpen) return 'open'
  return 'unknown'
}

export function deadlineHasPassed(deadlineAt: string | null, now: Date): boolean {
  if (!deadlineAt) return false
  const deadline = riyadhInstant(deadlineAt)
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < now.getTime()
}

export function dateOnlyDeadlineInRiyadh(dateIsoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIsoDate)) {
    throw new Error('date_only_deadline_requires_yyyy_mm_dd')
  }
  return `${dateIsoDate}T00:00:00+03:00`
}

export function freshnessIsCurrent(checkedAt: string, now: Date, maxAgeHours = 36): boolean {
  const checked = riyadhInstant(checkedAt)
  if (Number.isNaN(checked.getTime())) return false
  return now.getTime() - checked.getTime() <= maxAgeHours * 60 * 60 * 1000
}

export function riyadhOffsetMs(): number {
  return RIYADH_OFFSET_MS
}
