'use client'

import type { ReactNode } from 'react'
import { ActiveWorkshopCard } from '@/components/profile/active-workshop-card'
import { MentorBioSection } from '@/components/profile/mentor-bio-section'
import { MentorExpertiseSection } from '@/components/profile/mentor-expertise-section'
import { MentorIdentityHeader } from '@/components/profile/mentor-identity-header'
import { MentorRequestCTA } from '@/components/profile/mentor-request-cta'
import { MentorTrustSignals } from '@/components/profile/mentor-trust-signals'
import type { EarnedUserBadge, MentorPageContext } from '@/lib/profile/types'

type MentorProfileViewProps = {
  context: MentorPageContext
  badges: EarnedUserBadge[]
  isOwner: boolean
  isMentee: boolean
  reviewsSlot: ReactNode
}

export function MentorProfileView({
  context,
  badges,
  isOwner,
  isMentee,
  reviewsSlot,
}: MentorProfileViewProps) {
  const { mentor } = context
  const displayName = mentor.profile.full_name ?? '—'

  return (
    <main className="container-jid space-y-6 py-8">
      <MentorIdentityHeader
        isOwner={isOwner}
        fullName={displayName}
        headline={mentor.headline}
        bioSnippet={mentor.bio_short}
        avatarUrl={mentor.profile.avatar_url}
        isVerified={mentor.status === 'approved'}
        avgResponseHours={mentor.avg_response_hours}
        status={mentor.status !== 'approved' ? mentor.status : null}
        editHref={isOwner ? '/mentor/profile/edit' : undefined}
      />

      <MentorTrustSignals
        badges={badges}
        ratingAvg={mentor.rating_avg}
        sessionsCount={mentor.sessions_count}
        showSessionStats
      />

      <MentorBioSection bioLong={mentor.bio_long} careerHistory={mentor.career_history} />

      <MentorExpertiseSection
        sectors={mentor.expertise_sectors}
        yearsExperience={mentor.years_experience}
      />

      {mentor.active_workshop ? (
        <ActiveWorkshopCard workshop={mentor.active_workshop} />
      ) : null}

      {reviewsSlot}

      {isMentee ? (
        <MentorRequestCTA
          mentorId={mentor.user_id}
          mentorName={displayName}
          mentorHeadline={mentor.headline}
          expertiseAreas={mentor.expertise_sectors}
          isAccepting
        />
      ) : null}
    </main>
  )
}
