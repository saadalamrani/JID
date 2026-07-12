'use client'

import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActiveWorkshopCard } from '@/components/profile/active-workshop-card'
import { MentorBioSection } from '@/components/profile/mentor-bio-section'
import { MentorExpertiseSection } from '@/components/profile/mentor-expertise-section'
import { MentorResponseStatsSection } from '@/components/profile/mentor-response-stats'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { CrownBadge } from '@/components/mentor/crown-badge'
import { MentorViewedTracker } from '@/components/mentor/mentor-viewed-tracker'
import { PreferredMediumsIcons } from '@/components/mentor/preferred-mediums-icons'
import { RequestSessionButton } from '@/components/mentorship/request-session-button'
import { buildMentorDeclaredSpecializations } from '@/lib/mentor/declared-specializations'
import { formatMentorNationality } from '@/lib/mentor/nationality-label'
import type { MentorResponseStats } from '@/lib/mentor/response-stats'
import { isLiveActiveWorkshop } from '@/lib/mentor/workshop'
import type { MentorPublicDetail } from '@/types/mentor'
import { cn } from '@/lib/utils'

type MentorPublicDetailViewProps = {
  mentor: MentorPublicDetail
  locale: 'ar' | 'en'
  responseStats: MentorResponseStats
}

export function MentorPublicDetailView({
  mentor,
  locale,
  responseStats,
}: MentorPublicDetailViewProps) {
  const t = useTranslations('mentorship.detail')
  const displayName = mentor.full_name?.trim() || t('unnamed')
  const nationalityLabel = formatMentorNationality(mentor.nationality, locale)
  const liveWorkshop = isLiveActiveWorkshop(mentor.active_workshop) ? mentor.active_workshop : null
  const declaredSpecializations = buildMentorDeclaredSpecializations(mentor)

  return (
    <div className="space-y-6">
      <MentorViewedTracker mentorId={mentor.user_id} slug={mentor.slug} />
      <header className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <ProfileAvatar
              src={mentor.avatar_url}
              alt={displayName}
              size="lg"
              variant="circle"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-arabic text-2xl font-semibold text-foreground">{displayName}</h1>
              {mentor.is_mentor_of_month ? <CrownBadge /> : null}
            </div>
            {mentor.headline ? (
              <p className="font-arabic text-sm font-medium text-primary/90">{mentor.headline}</p>
            ) : null}
            <p className="font-arabic text-sm text-muted-foreground">
              {[nationalityLabel, mentor.years_experience != null ? t('years', { years: mentor.years_experience }) : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      </header>

      <MentorResponseStatsSection stats={responseStats} namespace="mentorship.detail" />

      {mentor.rating_avg != null ? (
        <section className="grid gap-4 sm:grid-cols-1">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
              <Star className="h-5 w-5 shrink-0" aria-hidden />
              <p className="font-arabic text-xs text-muted-foreground">{t('ratingLabel')}</p>
            </div>
            <p className="mt-1 font-arabic text-2xl font-semibold tabular-nums text-foreground">
              {mentor.rating_avg.toFixed(1)}
            </p>
          </div>
        </section>
      ) : null}

      <MentorBioSection bioLong={mentor.bio_long} careerHistory={mentor.career_history} />

      <MentorExpertiseSection
        declaredSpecializations={declaredSpecializations}
        yearsExperience={mentor.years_experience}
      />

      <PreferredMediumsIcons mediums={mentor.preferred_mediums} />

      {liveWorkshop ? <ActiveWorkshopCard workshop={liveWorkshop} /> : null}

      <div className="sticky bottom-4 rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-arabic text-sm text-muted-foreground">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                mentor.is_accepting_requests ? 'bg-emerald-500' : 'bg-border',
              )}
              aria-hidden
            />
            {mentor.is_accepting_requests ? t('accepting') : t('notAccepting')}
          </div>
          <RequestSessionButton
            mentorId={mentor.user_id}
            mentorName={displayName}
            mentorHeadline={mentor.headline}
            expertiseAreas={declaredSpecializations}
            isAccepting={mentor.is_accepting_requests}
            size="default"
            className="disabled:bg-border/30"
          />
        </div>
      </div>
    </div>
  )
}
