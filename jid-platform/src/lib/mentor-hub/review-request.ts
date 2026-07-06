import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  reviewMentorRequestSchema,
  type ReviewMentorRequestInput,
} from '@/lib/validations/mentor-hub'

export class MentorRequestReviewError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'MentorRequestReviewError'
    this.status = status
  }
}

export async function reviewMentorMentorshipRequest(
  mentorId: string,
  requestId: string,
  input: ReviewMentorRequestInput,
) {
  const parsed = reviewMentorRequestSchema.parse(input)
  const supabase = await createClient()

  const { data: request, error: fetchError } = await supabase
    .from('mentorship_requests')
    .select('id, mentor_id, mentee_id, status, conversation_id')
    .eq('id', requestId)
    .maybeSingle()

  if (fetchError) throw new MentorRequestReviewError(fetchError.message, 500)
  if (!request) throw new MentorRequestReviewError('الطلب غير موجود', 404)
  if (request.mentor_id !== mentorId) {
    throw new MentorRequestReviewError('غير مصرح', 403)
  }
  if (request.status !== 'pending') {
    throw new MentorRequestReviewError('الطلب ليس قيد الانتظار', 409)
  }

  const now = new Date().toISOString()

  if (parsed.decision === 'accept') {
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('mentor_id', request.mentor_id)
      .eq('mentee_id', request.mentee_id)
      .maybeSingle()

    let conversationId = existingConversation?.id ?? null

    if (!conversationId) {
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          mentorship_request_id: request.id,
          mentor_id: request.mentor_id,
          mentee_id: request.mentee_id,
        })
        .select('id')
        .single()

      if (conversationError) {
        throw new MentorRequestReviewError(conversationError.message, 500)
      }
      conversationId = conversation.id
    }

    const { data: updated, error: updateError } = await supabase
      .from('mentorship_requests')
      .update({
        status: 'accepted',
        conversation_id: conversationId,
        responded_at: now,
      })
      .eq('id', requestId)
      .eq('status', 'pending')
      .select('id, conversation_id, status')
      .maybeSingle()

    if (updateError || !updated) {
      throw new MentorRequestReviewError(updateError?.message ?? 'تعذّر قبول الطلب', 500)
    }

    return updated
  }

  const { data: declined, error: declineError } = await supabase
    .from('mentorship_requests')
    .update({
      status: 'declined',
      decline_reason: parsed.decline_reason!.trim(),
      responded_at: now,
    })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select('id, status')
    .maybeSingle()

  if (declineError || !declined) {
    throw new MentorRequestReviewError(declineError?.message ?? 'تعذّر رفض الطلب', 500)
  }

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('declined_requests_count')
    .eq('user_id', mentorId)
    .maybeSingle()

  const nextCount = (mentorProfile?.declined_requests_count ?? 0) + 1

  const { error: incrementError } = await supabase
    .from('mentor_profiles')
    .update({ declined_requests_count: nextCount })
    .eq('user_id', mentorId)

  if (incrementError) {
    throw new MentorRequestReviewError(incrementError.message, 500)
  }

  return declined
}
