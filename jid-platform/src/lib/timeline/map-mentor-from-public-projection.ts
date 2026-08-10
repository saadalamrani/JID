import type { TimelineMentorRef } from '@/types/timeline'

export type MentorPublicTimelineRow = {
  user_id: string
  slug: string | null
  headline: string | null
  full_name: string | null
  avatar_url: string | null
}

export function mapMentorFromPublicProjection(
  mentorId: string,
  mentorsByUserId: Map<string, MentorPublicTimelineRow>,
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

  return {
    id: mentor.user_id,
    slug: mentor.slug,
    current_role: mentor.headline,
    profile:
      mentor.full_name != null || mentor.avatar_url != null
        ? {
            full_name: mentor.full_name,
            avatar_url: mentor.avatar_url,
          }
        : null,
  }
}
