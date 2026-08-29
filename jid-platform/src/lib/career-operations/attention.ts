import type { CareerAttentionBucket, CareerItem } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const UPCOMING_WINDOW_MS = 14 * DAY_MS
const DEADLINE_ATTENTION_MS = 3 * DAY_MS

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

function hasOpenActionDue(item: CareerItem, nowMs: number): boolean {
  const action = item.next_action
  if (!action || action.completed_at) return false
  const due = parseTime(action.due_at)
  if (due == null) return true
  return due <= nowMs + DEADLINE_ATTENTION_MS
}

function hasUpcomingInterview(item: CareerItem, nowMs: number): boolean {
  return item.interviews.some((interview) => {
    const at = parseTime(interview.scheduled_at)
    return at != null && at >= nowMs && at <= nowMs + UPCOMING_WINDOW_MS
  })
}

function isWaitingOnOtherParty(item: CareerItem): boolean {
  return (
    item.operational_state === 'waiting' ||
    item.operational_state === 'applied' ||
    item.application_status === 'under_review' ||
    item.application_status === 'submitted' ||
    item.application_status === 'pending'
  )
}

function hasUnseenEmployerChange(item: CareerItem): boolean {
  const employer = parseTime(item.last_employer_action_at)
  if (employer == null) return false
  const seen = parseTime(item.last_seen_at)
  if (seen == null) return true
  return employer > seen
}

function suggestedNext(item: CareerItem): boolean {
  if (item.next_action && !item.next_action.completed_at) return true
  if (item.operational_state === 'considering' || item.operational_state === 'preparing') {
    return true
  }
  return item.open_follow_ups.length > 0
}

export function classifyAttentionBuckets(
  items: readonly CareerItem[],
  now: Date = new Date(),
): Record<CareerAttentionBucket, CareerItem[]> {
  const nowMs = now.getTime()
  const result: Record<CareerAttentionBucket, CareerItem[]> = {
    needs_attention: [],
    upcoming: [],
    waiting: [],
    changed: [],
    next: [],
  }

  for (const item of items) {
    const deadline = parseTime(item.deadline_at)
    const deadlineSoon =
      deadline != null && deadline >= nowMs && deadline <= nowMs + DEADLINE_ATTENTION_MS
    const deadlinePassed =
      deadline != null && deadline < nowMs && item.operational_state !== 'outcome'

    if (hasOpenActionDue(item, nowMs) || deadlineSoon || deadlinePassed) {
      result.needs_attention.push(item)
    }
    if (hasUpcomingInterview(item, nowMs)) {
      result.upcoming.push(item)
    }
    if (isWaitingOnOtherParty(item) && item.operational_state !== 'outcome') {
      result.waiting.push(item)
    }
    if (hasUnseenEmployerChange(item)) {
      result.changed.push(item)
    }
    if (suggestedNext(item) && item.operational_state !== 'outcome') {
      result.next.push(item)
    }
  }

  return result
}
