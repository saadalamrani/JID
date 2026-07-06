import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { MeetingSummary } from '@/types/meeting'

export class ConfirmMeetingError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ConfirmMeetingError'
    this.status = status
  }
}

const MEETING_SELECT =
  'id, mentor_id, mentee_id, status, scheduled_at, duration_minutes, meeting_url, notes, medium, feedback_rating, feedback_submitted_at, expected_end_at, should_show_feedback' as const

function computeExpectedEndAt(
  scheduledAt: string,
  durationMinutes: number | null,
): string {
  const startMs = new Date(scheduledAt).getTime()
  const durationMs = (durationMinutes ?? 0) * 60 * 1000
  return new Date(startMs + durationMs).toISOString()
}

/**
 * Section 4.13 — mentee confirms a proposed meeting.
 * Feedback prompt timing is server-driven via should_show_feedback (Section 8.2).
 */
export async function confirmMeeting(
  meetingId: string,
  userId: string,
): Promise<MeetingSummary> {
  const supabase = await createClient()

  const { data: meeting, error: fetchError } = await supabase
    .from('mentorship_meetings')
    .select(MEETING_SELECT)
    .eq('id', meetingId)
    .maybeSingle()

  if (fetchError) throw new ConfirmMeetingError(fetchError.message, 500)
  if (!meeting) throw new ConfirmMeetingError('الموعد غير موجود', 404)
  if (meeting.mentee_id !== userId) {
    throw new ConfirmMeetingError('فقط المتدرب يمكنه تأكيد الموعد', 403)
  }
  if (meeting.status !== 'pending_confirmation') {
    throw new ConfirmMeetingError('الموعد ليس بانتظار التأكيد', 409)
  }
  if (!meeting.scheduled_at) {
    throw new ConfirmMeetingError('موعد الجلسة غير محدد', 400)
  }

  const { data: updated, error: updateError } = await supabase
    .from('mentorship_meetings')
    .update({
      status: 'confirmed',
      expected_end_at: computeExpectedEndAt(meeting.scheduled_at, meeting.duration_minutes),
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
    .eq('status', 'pending_confirmation')
    .select(MEETING_SELECT)
    .maybeSingle()

  if (updateError || !updated) {
    throw new ConfirmMeetingError(updateError?.message ?? 'تعذّر تأكيد الموعد', 500)
  }

  return updated as MeetingSummary
}
