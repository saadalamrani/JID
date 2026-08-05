import { Briefcase, CalendarClock, UserRound } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import type { HomeHeroFloatingCard } from '@/lib/navigation/home-hero-cards'
import { cn } from '@/lib/utils'

type HomeHeroFloatingCardsProps = {
  cards: HomeHeroFloatingCard[]
}

const CARD_BASE = 'rounded-lg border border-jid-line/40 bg-background p-3 md:p-3.5'

const LINK_CARD =
  'block min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2'

function CardIcon({ kind }: { kind: HomeHeroFloatingCard['kind'] }) {
  const className = 'h-4 w-4 shrink-0 text-jid-olive'
  switch (kind) {
    case 'latest_job':
      return <Briefcase className={className} aria-hidden />
    case 'radar_update':
      return <Briefcase className={className} aria-hidden />
    case 'upcoming_session':
      return <CalendarClock className={className} aria-hidden />
    case 'profile_completion':
      return <UserRound className={className} aria-hidden />
    default:
      return null
  }
}

function CardBody({
  card,
  labels,
}: {
  card: HomeHeroFloatingCard
  labels: {
    latestJob: string
    radarUpdate: string
    upcomingSession: string
    profileCompletion: string
    relativeTime: (time: string) => string
  }
}) {
  switch (card.kind) {
    case 'latest_job':
      return (
        <>
          <p className="text-[11px] font-medium text-muted-foreground">{labels.latestJob}</p>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">{card.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{card.orgName}</p>
          <p className="text-muted-foreground/80 mt-1 text-[11px]">
            {labels.relativeTime(card.relativeTime)}
          </p>
        </>
      )
    case 'pulse_metric':
      // Pulse metrics render only when query-backed; keep presentation quiet (no decorative chart icon).
      return (
        <>
          <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-jid-olive">
            {card.valueFormatted}
          </p>
        </>
      )
    case 'radar_update':
      return (
        <>
          <p className="text-[11px] font-medium text-muted-foreground">{labels.radarUpdate}</p>
          {card.jobTitle ? (
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
              {card.jobTitle}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">{card.statusLabel}</p>
          <p className="text-muted-foreground/80 mt-1 text-[11px]">
            {labels.relativeTime(card.relativeTime)}
          </p>
        </>
      )
    case 'upcoming_session':
      return (
        <>
          <p className="text-[11px] font-medium text-muted-foreground">{labels.upcomingSession}</p>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
            {card.mentorName}
          </p>
          <p className="text-xs text-muted-foreground">
            <time dateTime={card.scheduledAt}>{card.formattedDateTime}</time>
          </p>
        </>
      )
    case 'profile_completion':
      return (
        <>
          <p className="text-[11px] font-medium text-muted-foreground">
            {labels.profileCompletion}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-jid-olive">
            {card.valueFormatted}
          </p>
        </>
      )
    default:
      return null
  }
}

/** Grounded real-data cards for the hero (server-resolved only). */
export async function HomeHeroFloatingCards({ cards }: HomeHeroFloatingCardsProps) {
  if (cards.length === 0) return null

  const t = await getTranslations('landing.hero.cards')
  const labels = {
    latestJob: t('latestJob.label'),
    radarUpdate: t('radarUpdate.label'),
    upcomingSession: t('upcomingSession.label'),
    profileCompletion: t('profileCompletion.label'),
    relativeTime: (time: string) => t('relativeTime', { time }),
  }

  return (
    <div
      className="flex max-w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap"
      aria-label={t('groupAria')}
    >
      {cards.slice(0, 3).map((card, index) => {
        const content = (
          <div className={CARD_BASE}>
            <div className="flex items-start gap-2">
              <CardIcon kind={card.kind} />
              <div className="min-w-0 flex-1">
                <CardBody card={card} labels={labels} />
              </div>
            </div>
          </div>
        )

        if (card.kind === 'pulse_metric') {
          return (
            <article
              key={`${card.kind}-${card.metricKey}`}
              className="min-w-0 flex-1 basis-[12rem]"
            >
              {content}
            </article>
          )
        }

        return (
          <Link
            key={`${card.kind}-${card.href}-${index}`}
            href={card.href}
            className={cn(LINK_CARD, 'min-w-0 flex-1 basis-[12rem]')}
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}
