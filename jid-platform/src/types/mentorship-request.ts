/**
 * Section 4.8 — mentorship request types.
 * Snapshot fields map to Unified Profile System columns (not live references).
 */

/** Immutable point-in-time copy stored in mentorship_requests.mentee_snapshot. */
export type MenteeSnapshot = {
  captured_at: string
  full_name: string | null
  headline: string | null
  avatar_url: string | null
  /** Resolved from profiles.university_id → universities.name */
  university: string | null
  /** Resolved from profiles.college_id → colleges.name (no separate major column in schema) */
  college: string | null
  /** profiles.target_regions[0] */
  city: string | null
  /** profiles.target_sectors */
  target_sectors: string[]
  /** profiles.target_program_types */
  target_program_types: string[]
}

export type MentorshipRequestRecord = {
  id: string
  mentee_id: string
  mentor_id: string
  status: string
  focus_area: string | null
  intent_statement: string | null
  preferred_medium: string | null
  mentee_snapshot: MenteeSnapshot | null
  created_at: string
  expires_at: string | null
}
