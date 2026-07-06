import { MEETING_FEEDBACK_DELAY_MS } from '@/lib/meetings/constants'

/**
 * @deprecated Radar Day 8 — replace with `mentorship_meetings.should_show_feedback`
 * from the server (update_feedback_flags pg_cron). Keep until MeetingRadarCard is rewired.
 */
export function meetingFeedbackEligibleAt(
  scheduledAt: string | null,
  durationMinutes: number | null = 0,
): Date | null {
  if (!scheduledAt) return null
  const start = new Date(scheduledAt).getTime()
  const durationMs = (durationMinutes ?? 0) * 60 * 1000
  return new Date(start + durationMs + MEETING_FEEDBACK_DELAY_MS)
}

export function isMeetingFeedbackDue(
  scheduledAt: string | null,
  durationMinutes: number | null,
  now = Date.now(),
): boolean {
  const eligibleAt = meetingFeedbackEligibleAt(scheduledAt, durationMinutes)
  if (!eligibleAt) return false
  return now >= eligibleAt.getTime()
}

export function isMeetingUpcoming(
  scheduledAt: string | null,
  durationMinutes: number | null,
  now = Date.now(),
): boolean {
  const eligibleAt = meetingFeedbackEligibleAt(scheduledAt, durationMinutes)
  if (!scheduledAt || !eligibleAt) return false
  return now < eligibleAt.getTime()
}
