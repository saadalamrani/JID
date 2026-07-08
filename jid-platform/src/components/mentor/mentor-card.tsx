'use client'

import { Star, Users } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { ProfileAvatar } from '@/components/profile/profile-avatar'
import { CrownBadge } from '@/components/mentor/crown-badge'
import { WorkshopChip } from '@/components/mentor/workshop-chip'
import { RequestSessionButton } from '@/components/mentorship/request-session-button'
import { Button } from '@/components/ui/button'
import { Link as LocaleLink } from '@/lib/i18n/navigation'
import { formatMentorNationality } from '@/lib/mentor/nationality-label'
import { isLiveActiveWorkshop } from '@/lib/mentor/workshop'
import type { MentorCardData } from '@/types/mentor'
import { cn } from '@/lib/utils'

type MentorCardProps = {
  mentor: MentorCardData
  className?: string
  previewMode?: boolean
}

export function MentorCard({ mentor, className, previewMode = false }: MentorCardProps) {
  const t = useTranslations('mentorship.card')
  const locale = useLocale() as 'ar' | 'en'
  const displayName = mentor.full_name?.trim() || t('unnamed')
  const profileHref = mentor.slug ? `/mentors/${mentor.slug}` : `/mentors/${mentor.user_id}`
  const nationalityLabel = formatMentorNationality(mentor.nationality, locale)
  const expertiseTags = mentor.expertise_areas.slice(0, 3)
  const liveWorkshop = isLiveActiveWorkshop(mentor.active_workshop) ? mentor.active_workshop : null

  return (
    <article
      role="listitem"
      className={cn(
        'relative flex min-h-[220px] flex-col rounded-xl border border-border/40 bg-card p-4 shadow-sm',
        !previewMode && 'transition-shadow hover:shadow-md',
        className,
      )}
    >
      {!previewMode ? (
        <LocaleLink
          href={profileHref}
          className={cn(
            'absolute inset-0 z-10 rounded-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
          aria-label={t('viewProfile', { name: displayName })}
        />
      ) : null}

      <header className="relative z-20 flex items-start gap-3 pointer-events-none">
        <div className="relative shrink-0">
          <ProfileAvatar
            src={mentor.avatar_url}
            alt={displayName}
            size="md"
            variant="circle"
          />
          {mentor.is_mentor_of_month ? (
            <span className="absolute -bottom-1 -end-1">
              <CrownBadge />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-arabic text-base font-semibold text-foreground">{displayName}</h2>
          {mentor.headline ? (
            <p className="mt-0.5 line-clamp-2 font-arabic text-xs text-muted-foreground">{mentor.headline}</p>
          ) : null}
          <p className="mt-1 font-arabic text-xs text-muted-foreground">
            {[nationalityLabel, mentor.years_experience != null ? t('years', { years: mentor.years_experience }) : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </header>

      {liveWorkshop ? (
        <div className="relative z-20 mt-3 pointer-events-none">
          <WorkshopChip workshop={liveWorkshop} />
        </div>
      ) : null}

      {expertiseTags.length > 0 ? (
        <div className="relative z-20 mt-3 flex flex-wrap gap-1 pointer-events-none">
          {expertiseTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2 py-0.5 font-arabic text-[10px] font-medium text-primary"
            >
              {tag}
            </span>
          ))}
          {mentor.expertise_areas.length > 3 ? (
            <span className="font-arabic text-[10px] text-foreground/40">
              {t('moreTags', { count: mentor.expertise_areas.length - 3 })}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-20 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-arabic text-xs text-muted-foreground pointer-events-none">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('sessions', { count: mentor.sessions_count })}
        </span>
        {mentor.rating_avg != null ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
            {mentor.rating_avg.toFixed(1)}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              mentor.is_accepting_requests ? 'bg-emerald-500' : 'bg-jid-line',
            )}
            aria-hidden
          />
          {mentor.is_accepting_requests ? t('available') : t('unavailable')}
        </span>
      </div>

      <div className={cn('relative z-30 mt-auto pt-4', previewMode ? 'pointer-events-none' : 'pointer-events-auto')}>
        {previewMode ? (
          <Button
            type="button"
            size="sm"
            disabled
            className="w-full bg-primary font-arabic hover:bg-primary/90 disabled:bg-border/30 disabled:text-muted-foreground"
          >
            {t('requestCta')}
          </Button>
        ) : (
          <RequestSessionButton
            mentorId={mentor.user_id}
            mentorName={displayName}
            mentorHeadline={mentor.headline}
            expertiseAreas={mentor.expertise_areas}
            isAccepting={mentor.is_accepting_requests}
            fullWidth
          />
        )}
      </div>
    </article>
  )
}
