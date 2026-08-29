'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { SurfaceStateView } from '@/components/ui/surface-state'
import { Button } from '@/components/ui/button'
import type { CareerOperationsBoard } from '@/lib/career-operations/types'
import { KanbanBoard } from '@/components/radar/kanban-board'
import { MobileKanban } from '@/components/radar/mobile-kanban'
import { MentorshipTimeline } from '@/components/radar/mentorship-timeline'
import { CareerItemCard } from '@/components/radar/career-item-card'
import type { UserApplication } from '@/types/application'
import type { TimelineMeeting } from '@/types/timeline'

type RadarOperationsBoardProps = {
  userId: string
  board: CareerOperationsBoard
  applications: UserApplication[]
  meetings: TimelineMeeting[]
}

function ItemList({ items, empty }: { items: CareerOperationsBoard['items']; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <CareerItemCard item={item} />
        </li>
      ))}
    </ul>
  )
}

export function RadarOperationsBoard({
  userId,
  board,
  applications,
  meetings,
}: RadarOperationsBoardProps) {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('radar')
  const tOps = useTranslations('radar.operations')

  return (
    <div className="space-y-10">
      <PageHeader
        title={t('title')}
        description={tOps('subtitle')}
        actions={
          <Button asChild className="min-h-11">
            <Link href="/abhathli">{tOps('openAbhathli')}</Link>
          </Button>
        }
      />

      {board.insights.length > 0 ? (
        <section aria-labelledby="radar-insights-heading" className="space-y-3">
          <SectionHeader
            title={tOps('insightsTitle')}
            description={tOps('insightsBody')}
          />
          <ul className="space-y-3">
            {board.insights.map((insight) => (
              <li key={insight.id} className="rounded-lg border border-border bg-card p-4 text-sm">
                <p className="text-foreground">
                  {locale === 'ar' ? insight.statement_ar : insight.statement_en}
                </p>
                <p className="mt-2 text-muted-foreground">
                  {tOps('insightMeta', {
                    population: String(insight.source_population_size),
                    window: insight.time_window,
                    missing: tOps(`missingness.${insight.missingness}`),
                  })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="radar-attention-heading" className="space-y-3">
        <SectionHeader title={tOps('needsAttention')} description={tOps('needsAttentionBody')} />
        <ItemList items={board.needs_attention} empty={tOps('emptyAttention')} />
      </section>

      <section className="space-y-3">
        <SectionHeader title={tOps('upcoming')} description={tOps('upcomingBody')} />
        <ItemList items={board.upcoming} empty={tOps('emptyUpcoming')} />
      </section>

      <section className="space-y-3">
        <SectionHeader title={tOps('waiting')} description={tOps('waitingBody')} />
        <ItemList items={board.waiting} empty={tOps('emptyWaiting')} />
      </section>

      <section className="space-y-3">
        <SectionHeader title={tOps('changed')} description={tOps('changedBody')} />
        <ItemList items={board.changed} empty={tOps('emptyChanged')} />
      </section>

      <section className="space-y-3">
        <SectionHeader title={tOps('next')} description={tOps('nextBody')} />
        <ItemList items={board.next} empty={tOps('emptyNext')} />
      </section>

      <section className="space-y-3">
        <SectionHeader title={tOps('journey')} description={tOps('journeyBody')} />
        {board.items.length === 0 ? (
          <SurfaceStateView
            state="empty"
            title={t('emptyTitle')}
            description={tOps('emptyJourney')}
            action={
              <Button asChild variant="outline">
                <Link href="/opportunities">{t('emptyColumn.saved.cta')}</Link>
              </Button>
            }
          />
        ) : (
          <ItemList items={board.items} empty={tOps('emptyJourney')} />
        )}
      </section>

      {meetings.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader title={t('timeline.title')} />
          <MentorshipTimeline userId={userId} meetings={meetings} title={t('timeline.title')} />
        </section>
      ) : null}

      {applications.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader title={tOps('nativeBoard')} description={tOps('nativeBoardBody')} />
          <div className="hidden lg:block">
            <KanbanBoard userId={userId} applications={applications} meetings={[]} />
          </div>
          <div className="lg:hidden">
            <MobileKanban userId={userId} applications={applications} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
