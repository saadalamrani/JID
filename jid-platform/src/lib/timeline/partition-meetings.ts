import type { TimelineMeeting } from '@/types/timeline'

/** Section 8.3 — split feedback prompts from upcoming sessions. */
export function partitionTimelineMeetings(meetings: TimelineMeeting[]) {
  const needsFeedback = meetings.filter(
    (meeting) => meeting.should_show_feedback && meeting.feedback_rating == null,
  )

  const upcoming = meetings.filter(
    (meeting) =>
      !meeting.should_show_feedback &&
      (meeting.status === 'pending_confirmation' || isUpcomingScheduled(meeting)),
  )

  return { needsFeedback, upcoming }
}

function isUpcomingScheduled(meeting: TimelineMeeting): boolean {
  if (!meeting.scheduled_for) return false
  return new Date(meeting.scheduled_for).getTime() >= Date.now()
}

export function includeMeetingInTimeline(meeting: {
  status: string
  scheduled_for: string | null
  should_show_feedback: boolean
  feedback_rating: number | null
}): boolean {
  if (meeting.should_show_feedback && meeting.feedback_rating == null) return true
  if (meeting.status === 'pending_confirmation') return true
  return isUpcomingScheduled({
    ...meeting,
    id: '',
    medium: null,
    meeting_url: null,
    duration_text: null,
    expected_end_at: null,
    mentor: null,
    conversation: null,
  })
}
