/**
 * Timeline meeting types — Section 8.1 / 8.4.
 *
 * NOTE (Section 8.4 path correction): mentor display fields live on
 * `meeting.mentor.profile.full_name` / `avatar_url`, NOT `meeting.mentor.full_name`.
 * MeetingCard JSX must use the nested `profile` object when implemented on Day 8.
 */

export type TimelineMentorProfileRef = {
  full_name: string | null
  avatar_url: string | null
}

export type TimelineMentorRef = {
  id: string
  slug: string | null
  /** Mapped from mentor_profiles.headline (spec name: current_role). */
  current_role: string | null
  profile: TimelineMentorProfileRef | null
}

export type TimelineConversationRef = {
  id: string
}

export type TimelineMeeting = {
  id: string
  scheduled_for: string | null
  medium: string | null
  meeting_url: string | null
  duration_text: string | null
  status: string
  expected_end_at: string | null
  should_show_feedback: boolean
  feedback_rating: number | null
  mentor: TimelineMentorRef | null
  conversation: TimelineConversationRef | null
}

export type UpcomingMeetingsResult = {
  meetings: TimelineMeeting[]
  count: number
}
