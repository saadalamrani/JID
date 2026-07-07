import { getTranslations } from 'next-intl/server'
import type { StaffEntitySlaEvent } from '@/types/staff-entities'

type EntitySlaHistoryProps = {
  events: StaffEntitySlaEvent[]
}

export async function EntitySlaHistory({ events }: EntitySlaHistoryProps) {
  const t = await getTranslations('staff.entities.detail.slaHistory')

  return (
    <section className="rounded-lg border border-jid-line bg-white p-5">
      <h2 className="text-sm font-semibold text-jid-ink">{t('title')}</h2>
      <p className="mt-1 text-sm text-jid-ink/55">{t('subtitle')}</p>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-jid-ink/50">{t('empty')}</p>
      ) : (
        <ul className="mt-4 divide-y divide-jid-line">
          {events.map((event) => (
            <li key={`${event.kind}-${event.id}`} className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-jid-ink">{event.summary}</p>
                <p className="text-xs text-jid-ink/50">{t(`kinds.${event.kind}`)}</p>
              </div>
              <time dateTime={event.occurred_at} className="shrink-0 text-xs text-jid-ink/45">
                {new Date(event.occurred_at).toLocaleString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
