'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ActiveWorkshopCard } from '@/components/profile/active-workshop-card'
import { MentorBioSection } from '@/components/profile/mentor-bio-section'
import { MentorExpertiseSection } from '@/components/profile/mentor-expertise-section'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { CrownBadge } from '@/components/mentor/crown-badge'
import { PreferredMediumsIcons } from '@/components/mentor/preferred-mediums-icons'
import { Button } from '@/components/ui/button'
import { formatMentorNationality } from '@/lib/mentor/nationality-label'
import { isLiveActiveWorkshop } from '@/lib/mentor/workshop'
import type { MentorPublicDetail } from '@/types/mentor'
import { cn } from '@/lib/utils'

type MentorPublicDetailViewProps = {
  mentor: MentorPublicDetail
  locale: 'ar' | 'en'
}

export function MentorPublicDetailView({ mentor, locale }: MentorPublicDetailViewProps) {
  const t = useTranslations('mentorship.detail')
  const displayName = mentor.full_name?.trim() || t('unnamed')
  const nationalityLabel = formatMentorNationality(mentor.nationality, locale)
  const liveWorkshop = isLiveActiveWorkshop(mentor.active_workshop) ? mentor.active_workshop : null

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-jid-line bg-white p-6 shadow-sm">
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
              <h1 className="font-arabic text-2xl font-semibold text-jid-ink">{displayName}</h1>
              {mentor.is_mentor_of_month ? <CrownBadge /> : null}
            </div>
            {mentor.headline ? (
              <p className="font-arabic text-sm font-medium text-jid-olive/90">{mentor.headline}</p>
            ) : null}
            <p className="font-arabic text-sm text-jid-ink/60">
              {[nationalityLabel, mentor.years_experience != null ? t('years', { years: mentor.years_experience }) : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
          <p className="font-arabic text-xs text-jid-ink/50">{t('sessionsLabel')}</p>
          <p className="mt-1 font-arabic text-2xl font-semibold text-jid-ink">
            {mentor.sessions_count}
          </p>
        </div>
        <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
          <p className="font-arabic text-xs text-jid-ink/50">{t('ratingLabel')}</p>
          <p className="mt-1 font-arabic text-2xl font-semibold text-jid-ink">
            {mentor.rating_avg != null ? mentor.rating_avg.toFixed(1) : '—'}
          </p>
        </div>
      </section>

      <MentorBioSection bioLong={mentor.bio_long} careerHistory={mentor.career_history} />

      <MentorExpertiseSection
        sectors={mentor.expertise_areas.length > 0 ? mentor.expertise_areas : mentor.expertise_sectors}
        yearsExperience={mentor.years_experience}
      />

      <PreferredMediumsIcons mediums={mentor.preferred_mediums} />

      {liveWorkshop ? <ActiveWorkshopCard workshop={liveWorkshop} /> : null}

      <div className="sticky bottom-4 rounded-xl border border-jid-line bg-white p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-arabic text-sm text-jid-ink/70">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                mentor.is_accepting_requests ? 'bg-emerald-500' : 'bg-jid-line',
              )}
              aria-hidden
            />
            {mentor.is_accepting_requests ? t('accepting') : t('notAccepting')}
          </div>
          <Button
            type="button"
            disabled={!mentor.is_accepting_requests}
            className="bg-jid-olive font-arabic hover:bg-jid-olive/90 disabled:bg-jid-line/40"
            onClick={() => console.info('Request mentorship', mentor.user_id)}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t('requestCta')}
          </Button>
        </div>
      </div>
    </div>
  )
}
