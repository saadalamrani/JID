'use client'

import { createClient } from '@/lib/supabase/client'
import { includeMeetingInTimeline } from '@/lib/timeline/partition-meetings'
import type { UpcomingMeetingsResult } from '@/types/timeline'

/** Client fetch for Radar timeline — RLS limits to meeting participant. */
export async function fetchUpcomingMeetingsClient(
  userId: string,
): Promise<UpcomingMeetingsResult> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('mentorship_meetings')
    .select(
      `
      id,
      scheduled_at,
      medium,
      meeting_url,
      duration_minutes,
      status,
      expected_end_at,
      should_show_feedback,
      feedback_rating,
      mentor_id,
      request:mentorship_requests!request_id(
        conversation_id,
        conversation:conversations!conversation_id(id)
      )
    `,
    )
    .eq('mentee_id', userId)
    .or('should_show_feedback.eq.true,and(status.in.(pending_confirmation,confirmed))')
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)

  type MeetingRow = {
    id: string
    scheduled_at: string | null
    medium: string | null
    meeting_url: string | null
    duration_minutes: number | null
    status: string
    expected_end_at: string | null
    should_show_feedback: boolean
    feedback_rating: number | null
    mentor_id: string
    request:
      | {
          conversation_id: string | null
          conversation: { id: string } | { id: string }[] | null
        }
      | {
          conversation_id: string | null
          conversation: { id: string } | { id: string }[] | null
        }[]
      | null
  }

  const rows = ((data ?? []) as MeetingRow[]).filter((row) =>
    includeMeetingInTimeline({
      status: row.status,
      scheduled_for: row.scheduled_at,
      should_show_feedback: row.should_show_feedback,
      feedback_rating: row.feedback_rating,
    }),
  )

  const mentorIds = Array.from(new Set(rows.map((row) => row.mentor_id)))
  const mentorsByUserId = new Map<
    string,
    {
      user_id: string
      slug: string | null
      headline: string | null
      profile: { full_name: string | null; avatar_url: string | null } | null
    }
  >()

  if (mentorIds.length > 0) {
    const { data: mentors, error: mentorError } = await supabase
      .from('mentor_profiles')
      .select(
        'user_id, slug, headline, profile:profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)',
      )
      .in('user_id', mentorIds)

    if (mentorError) throw new Error(mentorError.message)

    for (const mentor of mentors ?? []) {
      const profile = Array.isArray(mentor.profile) ? mentor.profile[0] : mentor.profile
      mentorsByUserId.set(mentor.user_id, {
        user_id: mentor.user_id,
        slug: mentor.slug,
        headline: mentor.headline,
        profile: profile ?? null,
      })
    }
  }

  const meetings = rows.map((row) => {
    const request = Array.isArray(row.request) ? row.request[0] : row.request
    const conversation = request?.conversation
      ? Array.isArray(request.conversation)
        ? request.conversation[0]
        : request.conversation
      : null

    const mentor = mentorsByUserId.get(row.mentor_id)

    return {
      id: row.id,
      scheduled_for: row.scheduled_at,
      medium: row.medium,
      meeting_url: row.meeting_url,
      duration_text:
        row.duration_minutes != null && row.duration_minutes > 0
          ? `${row.duration_minutes} min`
          : null,
      status: row.status,
      expected_end_at: row.expected_end_at,
      should_show_feedback: row.should_show_feedback,
      feedback_rating: row.feedback_rating,
      mentor: {
        id: row.mentor_id,
        slug: mentor?.slug ?? null,
        current_role: mentor?.headline ?? null,
        profile: mentor?.profile ?? null,
      },
      conversation: conversation?.id
        ? { id: conversation.id }
        : request?.conversation_id
          ? { id: request.conversation_id }
          : null,
    }
  })

  return { meetings, count: meetings.length }
}
