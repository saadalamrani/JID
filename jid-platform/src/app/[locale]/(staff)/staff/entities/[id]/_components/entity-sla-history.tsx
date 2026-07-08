import { getTranslations } from 'next-intl/server'
import type { StaffEntitySlaEvent } from '@/types/staff-entities'

type EntitySlaHistoryProps = {
  events: StaffEntitySlaEvent[]
}

export async function EntitySlaHistory({ events }: EntitySlaHistoryProps) {
  const t = await getTranslations('staff.entities.detail.slaHistory')

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {events.map((event) => (
            <li key={`${event.kind}-${event.id}`} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{event.summary}</p>
                <p className="text-xs text-muted-foreground">{t(`kinds.${event.kind}`)}</p>
              </div>
              <time dateTime={event.occurred_at} className="shrink-0 text-xs text-muted-foreground">
                {new Date(event.occurred_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
