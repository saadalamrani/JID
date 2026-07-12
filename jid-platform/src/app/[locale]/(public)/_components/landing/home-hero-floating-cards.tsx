import { Briefcase, CalendarClock, LineChart, UserRound } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import type { HomeHeroFloatingCard } from '@/lib/navigation/home-hero-cards'
import { cn } from '@/lib/utils'

type HomeHeroFloatingCardsProps = {
  cards: HomeHeroFloatingCard[]
}

const CARD_BASE =
  'rounded-xl border border-jid-line/50 bg-background/95 p-3 shadow-md backdrop-blur-sm motion-safe:transition-shadow md:p-3.5'

const LINK_CARD =
  'block min-h-[44px] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive focus-visible:ring-offset-2'

const ACCENT_VALUE: Record<string, string> = {
  default: 'text-jid-olive',
  olive: 'text-jid-olive',
  gold: 'text-jid-gold',
}

function CardIcon({ kind }: { kind: HomeHeroFloatingCard['kind'] }) {
  const className = 'h-4 w-4 shrink-0 text-jid-gold'
  switch (kind) {
    case 'latest_job':
      return <Briefcase className={className} aria-hidden />
    case 'pulse_metric':
      return <LineChart className={className} aria-hidden />
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
          <p className="mt-1 text-[11px] text-muted-foreground/80">
            {labels.relativeTime(card.relativeTime)}
          </p>
        </>
      )
    case 'pulse_metric':
      return (
        <>
          <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
          <p
            className={cn(
              'mt-1 text-xl font-semibold tabular-nums',
              ACCENT_VALUE[card.accentColor ?? 'default'],
            )}
          >
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
          <p className="mt-1 text-[11px] text-muted-foreground/80">
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
          <p className="text-[11px] font-medium text-muted-foreground">{labels.profileCompletion}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-jid-gold">
            {card.valueFormatted}
          </p>
        </>
      )
    default:
      return null
  }
}

function cardPositionClass(index: number, total: number): string {
  if (total === 1) return 'w-full max-w-[14rem] self-end'
  if (total === 2) {
    return index === 0
      ? 'w-[min(14rem,78vw)] shrink-0 self-start md:w-full md:max-w-[13rem]'
      : 'w-[min(14rem,78vw)] shrink-0 self-end md:w-full md:max-w-[13rem]'
  }
  return 'w-[min(13rem,72vw)] shrink-0 md:w-full md:max-w-[12.5rem]'
}

function CardShell({
  card,
  labels,
  index,
  total,
}: {
  card: HomeHeroFloatingCard
  labels: {
    latestJob: string
    radarUpdate: string
    upcomingSession: string
    profileCompletion: string
    relativeTime: (time: string) => string
  }
  index: number
  total: number
}) {
  const positionClass = cardPositionClass(index, total)
  const content = (
    <div className={cn(CARD_BASE, 'pointer-events-auto')}>
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
      <article key={`${card.kind}-${card.metricKey}`} className={positionClass}>
        {content}
      </article>
    )
  }

  return (
    <Link
      key={`${card.kind}-${card.href}-${index}`}
      href={card.href}
      className={cn(LINK_CARD, positionClass, 'pointer-events-auto')}
    >
      {content}
    </Link>
  )
}

/** Task 4 — presentational floating cards overlay (data resolved server-side). */
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
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex max-w-full gap-2.5 p-3 sm:p-4',
        cards.length > 1
          ? 'flex-row overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col md:overflow-visible [&::-webkit-scrollbar]:hidden'
          : 'flex-col',
      )}
      aria-label={t('groupAria')}
    >
      {cards.map((card, index) => (
        <CardShell
          key={`${card.kind}-${index}`}
          card={card}
          labels={labels}
          index={index}
          total={cards.length}
        />
      ))}
    </div>
  )
}
