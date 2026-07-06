/** Hours after meeting start before Radar card morphs into feedback prompt (Section 4.14). */
export const MEETING_FEEDBACK_DELAY_HOURS =
  Number(process.env.NEXT_PUBLIC_MEETING_FEEDBACK_HOURS) || 2

export const MEETING_FEEDBACK_DELAY_MS = MEETING_FEEDBACK_DELAY_HOURS * 60 * 60 * 1000

export const RADAR_TYPE_MENTORSHIP_MEETING = 'mentorship_meeting'
export const RADAR_TYPE_MEETING_FEEDBACK = 'meeting_feedback'
