export type MeetingStatus =
  | 'pending_confirmation'
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type MeetingSummary = {
  id: string
  mentor_id: string
  mentee_id: string
  status: MeetingStatus
  scheduled_at: string | null
  duration_minutes: number | null
  meeting_url: string | null
  notes: string | null
  medium: string | null
  feedback_rating: number | null
  feedback_submitted_at: string | null
}

export type RadarItemRow = {
  id: string
  user_id: string | null
  type: string
  reference_id: string | null
  column_name: string | null
  status: string | null
  scheduled_for: string | null
  created_at: string | null
}

export type RadarMeetingItem = RadarItemRow & {
  meeting: MeetingSummary | null
}
