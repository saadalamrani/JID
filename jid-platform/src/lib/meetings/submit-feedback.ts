import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  submitMeetingFeedbackSchema,
  type SubmitMeetingFeedbackInput,
} from '@/lib/validations/meeting'
import type { MeetingSummary } from '@/types/meeting'

export class MeetingFeedbackError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MeetingFeedbackError'
    this.status = status
  }
}

const MEETING_SELECT =
  'id, mentor_id, mentee_id, status, scheduled_at, duration_minutes, meeting_url, notes, medium, feedback_rating, feedback_submitted_at, expected_end_at, should_show_feedback' as const

export async function submitMeetingFeedback(
  meetingId: string,
  userId: string,
  input: SubmitMeetingFeedbackInput,
): Promise<MeetingSummary> {
  const parsed = submitMeetingFeedbackSchema.parse(input)
  const supabase = await createClient()

  const { data: meeting, error: fetchError } = await supabase
    .from('mentorship_meetings')
    .select(MEETING_SELECT)
    .eq('id', meetingId)
    .maybeSingle()

  if (fetchError) throw new MeetingFeedbackError(fetchError.message, 500)
  if (!meeting) throw new MeetingFeedbackError('الموعد غير موجود', 404)
  if (meeting.mentee_id !== userId) {
    throw new MeetingFeedbackError('فقط المتدرب يمكنه إرسال التقييم', 403)
  }
  if (meeting.feedback_rating != null) {
    throw new MeetingFeedbackError('تم إرسال التقييم مسبقاً', 409)
  }
  if (meeting.status !== 'confirmed' && meeting.status !== 'completed') {
    throw new MeetingFeedbackError('لا يمكن تقييم هذا الموعد بعد', 409)
  }

  const now = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('mentorship_meetings')
    .update({
      feedback_rating: parsed.feedback_rating,
      feedback_comment: parsed.feedback_comment?.trim() || null,
      feedback_submitted_at: now,
      status: 'completed',
      completed_at: now,
      updated_at: now,
    })
    .eq('id', meetingId)
    .is('feedback_rating', null)
    .select(MEETING_SELECT)
    .maybeSingle()

  if (updateError || !updated) {
    throw new MeetingFeedbackError(updateError?.message ?? 'تعذّر حفظ التقييم', 500)
  }

  return updated as MeetingSummary
}
