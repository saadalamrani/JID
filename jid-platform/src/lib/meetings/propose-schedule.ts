import 'server-only'

import { createClient } from '@/lib/supabase/server'
import {
  proposeMeetingSchema,
  type ProposeMeetingInput,
} from '@/lib/validations/meeting'
import type { MeetingSummary } from '@/types/meeting'
import type { ConversationMessageRow } from '@/types/conversation'

export class ProposeMeetingError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ProposeMeetingError'
    this.status = status
  }
}

const MEETING_SELECT =
  'id, mentor_id, mentee_id, status, scheduled_at, duration_minutes, meeting_url, notes, medium, feedback_rating, feedback_submitted_at' as const

function unwrapMeeting(
  ref: MeetingSummary | MeetingSummary[] | null,
): MeetingSummary | null {
  if (!ref) return null
  return Array.isArray(ref) ? (ref[0] ?? null) : ref
}

export async function proposeMeetingSchedule(
  mentorId: string,
  conversationId: string,
  input: ProposeMeetingInput,
): Promise<{ meeting: MeetingSummary; message: ConversationMessageRow }> {
  const parsed = proposeMeetingSchema.parse(input)
  const supabase = await createClient()

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, mentor_id, mentee_id, mentorship_request_id')
    .eq('id', conversationId)
    .maybeSingle()

  if (conversationError) throw new ProposeMeetingError(conversationError.message, 500)
  if (!conversation) throw new ProposeMeetingError('المحادثة غير موجودة', 404)
  if (conversation.mentor_id !== mentorId) {
    throw new ProposeMeetingError('فقط المرشد يمكنه اقتراح موعد', 403)
  }

  const { data: meeting, error: meetingError } = await supabase
    .from('mentorship_meetings')
    .insert({
      mentor_id: conversation.mentor_id,
      mentee_id: conversation.mentee_id,
      request_id: conversation.mentorship_request_id,
      status: 'pending_confirmation',
      scheduled_at: parsed.scheduled_at,
      duration_minutes: parsed.duration_minutes,
      meeting_url: parsed.meeting_url?.trim() || null,
      notes: parsed.notes?.trim() || null,
      medium: parsed.medium ?? null,
    })
    .select(MEETING_SELECT)
    .single()

  if (meetingError || !meeting) {
    throw new ProposeMeetingError(meetingError?.message ?? 'تعذّر إنشاء الموعد', 500)
  }

  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: mentorId,
      message_type: 'schedule_proposal',
      meeting_id: meeting.id,
      ciphertext: null,
      nonce: null,
    })
    .select(
      'id, conversation_id, sender_id, message_type, meeting_id, ciphertext, nonce, created_at',
    )
    .single()

  if (messageError || !message) {
    throw new ProposeMeetingError(messageError?.message ?? 'تعذّر إرسال اقتراح الموعد', 500)
  }

  return {
    meeting: meeting as MeetingSummary,
    message: {
      ...(message as ConversationMessageRow),
      meeting: meeting as MeetingSummary,
    },
  }
}
