import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type {
  TimelineConversationRef,
  TimelineMeeting,
  TimelineMentorRef,
  UpcomingMeetingsResult,
} from '@/types/timeline'
import { includeMeetingInTimeline } from '@/lib/timeline/partition-meetings'

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: SupabaseClient<Database>): UntypedClient {
  return client as unknown as UntypedClient
}

export function timelineMeetingsQueryKey(userId: string) {
  return ['radar', 'timeline', 'meetings', userId] as const
}

const UPCOMING_MEETINGS_SELECT = `
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
` as const

const MENTOR_PROFILE_SELECT = `
  user_id,
  slug,
  headline,
  profile:profiles!mentor_profiles_user_id_fkey(full_name, avatar_url)
` as const

type ProfileEmbed = {
  full_name: string | null
  avatar_url: string | null
} | null

type MentorEmbed = {
  user_id: string
  slug: string | null
  headline: string | null
  profile: ProfileEmbed | ProfileEmbed[]
}

type ConversationEmbed = { id: string } | null

type RequestEmbed = {
  conversation_id: string | null
  conversation: ConversationEmbed | ConversationEmbed[]
} | null

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
  request: RequestEmbed | RequestEmbed[]
}

function normalizeEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function formatDurationText(minutes: number | null): string | null {
  if (minutes == null || minutes <= 0) return null
  return `${minutes} min`
}

function mapMentor(
  mentorId: string,
  mentorsByUserId: Map<string, MentorEmbed>,
): TimelineMentorRef {
  const mentor = mentorsByUserId.get(mentorId)
  if (!mentor) {
    return {
      id: mentorId,
      slug: null,
      current_role: null,
      profile: null,
    }
  }

  const profile = normalizeEmbed(mentor.profile)

  return {
    id: mentor.user_id,
    slug: mentor.slug,
    current_role: mentor.headline,
    profile: profile
      ? {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        }
      : null,
  }
}

function mapConversation(request: RequestEmbed | null): TimelineConversationRef | null {
  if (!request) return null
  const conversation = normalizeEmbed(request.conversation)
  if (conversation?.id) return { id: conversation.id }
  if (request.conversation_id) return { id: request.conversation_id }
  return null
}

function mapTimelineMeeting(row: MeetingRow, mentorsByUserId: Map<string, MentorEmbed>): TimelineMeeting {
  return {
    id: row.id,
    scheduled_for: row.scheduled_at,
    medium: row.medium,
    meeting_url: row.meeting_url,
    duration_text: formatDurationText(row.duration_minutes),
    status: row.status,
    expected_end_at: row.expected_end_at,
    should_show_feedback: row.should_show_feedback,
    feedback_rating: row.feedback_rating,
    mentor: mapMentor(row.mentor_id, mentorsByUserId),
    conversation: mapConversation(normalizeEmbed(row.request)),
  }
}

/** Section 8.1 / 8.3 — mentee meetings for Radar timeline (upcoming + feedback prompts). */
export async function fetchUpcomingMeetings(userId: string): Promise<UpcomingMeetingsResult> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data, error } = await client
    .from('mentorship_meetings')
    .select(UPCOMING_MEETINGS_SELECT)
    .eq('mentee_id', userId)
    .or('should_show_feedback.eq.true,and(status.in.(pending_confirmation,confirmed))')
    .order('scheduled_at', { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(error.message)
  }

  const rows = ((data ?? []) as unknown as MeetingRow[]).filter((row) =>
    includeMeetingInTimeline({
      status: row.status,
      scheduled_for: row.scheduled_at,
      should_show_feedback: row.should_show_feedback,
      feedback_rating: row.feedback_rating,
    }),
  )

  const mentorIds = Array.from(new Set(rows.map((row) => row.mentor_id)))
  const mentorsByUserId = new Map<string, MentorEmbed>()

  if (mentorIds.length > 0) {
    const { data: mentors, error: mentorError } = await client
      .from('mentor_profiles')
      .select(MENTOR_PROFILE_SELECT)
      .in('user_id', mentorIds)

    if (mentorError) {
      throw new Error(mentorError.message)
    }

    for (const mentor of (mentors ?? []) as unknown as MentorEmbed[]) {
      mentorsByUserId.set(mentor.user_id, mentor)
    }
  }

  const meetings: TimelineMeeting[] = rows.map((row) =>
    mapTimelineMeeting(row, mentorsByUserId),
  )

  return {
    meetings,
    count: meetings.length,
  }
}
