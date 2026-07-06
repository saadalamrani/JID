import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { MeetingSummary } from '@/types/meeting'

export class MeetingFeedbackDismissError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MeetingFeedbackDismissError'
    this.status = status
  }
}

const MEETING_SELECT =
  'id, mentor_id, mentee_id, status, scheduled_at, duration_minutes, meeting_url, notes, medium, feedback_rating, feedback_submitted_at, expected_end_at, should_show_feedback' as const

/** Section 8.5 — snooze feedback prompt for 24h (sets should_show_feedback=false). */
export async function dismissMeetingFeedbackPrompt(
  meetingId: string,
  userId: string,
): Promise<MeetingSummary> {
  const supabase = await createClient()

  const { data: meeting, error: fetchError } = await supabase
    .from('mentorship_meetings')
    .select(MEETING_SELECT)
    .eq('id', meetingId)
    .maybeSingle()

  if (fetchError) throw new MeetingFeedbackDismissError(fetchError.message, 500)
  if (!meeting) throw new MeetingFeedbackDismissError('الموعد غير موجود', 404)
  if (meeting.mentee_id !== userId) {
    throw new MeetingFeedbackDismissError('فقط المتدرب يمكنه تأجيل التقييم', 403)
  }
  if (meeting.feedback_rating != null) {
    throw new MeetingFeedbackDismissError('تم إرسال التقييم مسبقاً', 409)
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase
    .from('mentorship_meetings')
    .update({
      should_show_feedback: false,
      feedback_dismissed_at: now,
      updated_at: now,
    })
    .eq('id', meetingId)
    .select(MEETING_SELECT)
    .maybeSingle()

  if (updateError || !updated) {
    throw new MeetingFeedbackDismissError(updateError?.message ?? 'تعذّر تأجيل التقييم', 500)
  }

  return updated as MeetingSummary
}
