'use client'

import type { ReactNode } from 'react'
import { ActiveWorkshopCard } from '@/components/profile/active-workshop-card'
import { MentorBioSection } from '@/components/profile/mentor-bio-section'
import { MentorExpertiseSection } from '@/components/profile/mentor-expertise-section'
import { MentorIdentityHeader } from '@/components/profile/mentor-identity-header'
import { MentorRequestCTA } from '@/components/profile/mentor-request-cta'
import { MentorResponseStatsSection } from '@/components/profile/mentor-response-stats'
import { MentorTrustSignals } from '@/components/profile/mentor-trust-signals'
import { buildMentorDeclaredSpecializations } from '@/lib/mentor/declared-specializations'
import type { MentorResponseStats } from '@/lib/mentor/response-stats'
import type { EarnedUserBadge, MentorPageContext } from '@/lib/profile/types'

type MentorProfileViewProps = {
  context: MentorPageContext
  badges: EarnedUserBadge[]
  isOwner: boolean
  isMentee: boolean
  responseStats: MentorResponseStats
  reviewsSlot: ReactNode
}

export function MentorProfileView({
  context,
  badges,
  isOwner,
  isMentee,
  responseStats,
  reviewsSlot,
}: MentorProfileViewProps) {
  const { mentor } = context
  const displayName = mentor.profile.full_name ?? '—'
  const declaredSpecializations = buildMentorDeclaredSpecializations(mentor)

  return (
    <main className="container-jid space-y-6 py-8">
      <MentorIdentityHeader
        isOwner={isOwner}
        fullName={displayName}
        headline={mentor.headline}
        bioSnippet={mentor.bio_short}
        avatarUrl={mentor.profile.avatar_url}
        isVerified={mentor.status === 'approved'}
        status={mentor.status !== 'approved' ? mentor.status : null}
        editHref={isOwner ? '/mentor/profile/edit' : undefined}
      />

      <MentorResponseStatsSection stats={responseStats} />

      <MentorTrustSignals badges={badges} ratingAvg={mentor.rating_avg} />

      <MentorBioSection bioLong={mentor.bio_long} careerHistory={mentor.career_history} />

      <MentorExpertiseSection
        declaredSpecializations={declaredSpecializations}
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
          expertiseAreas={declaredSpecializations}
          isAccepting
        />
      ) : null}
    </main>
  )
}
