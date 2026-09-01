import { getTranslations } from 'next-intl/server'
import type { IndividualHomeModel } from '@/lib/individual-home/get-individual-home-model'
import { relativeTimeFor } from '@/lib/individual-home/get-individual-home-model'

type ChangesPanelProps = {
  model: IndividualHomeModel
}

/**
 * D1 R2, section 3 — "what changed". Bounded, typed, factual — never a feed
 * (R1-C P8): finite (top 3), no engagement affordance, collapses when empty.
 */
export async function ChangesPanel({ model }: ChangesPanelProps) {
  const [t, tStatus] = await Promise.all([
    getTranslations('individualHome.changes'),
    getTranslations('landing.hero.cards.applicationStatus'),
  ])

  return (
    <section aria-labelledby="changes-title">
      <h2 id="changes-title" className="text-sm font-semibold text-jid-olive">
        {t('title')}
      </h2>

      {model.changes.length === 0 ? (
        <p className="text-foreground/60 mt-2 text-sm">{t('empty')}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {model.changes.map((change) => (
            <li key={change.id} className="text-foreground/80 text-sm leading-relaxed">
              {t('statusUpdate', {
                jobTitle: change.jobTitle,
                status: tStatus(change.status),
                relativeTime: relativeTimeFor(change.at, model.locale),
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
