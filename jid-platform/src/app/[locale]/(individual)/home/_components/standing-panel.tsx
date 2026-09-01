import { getTranslations } from 'next-intl/server'
import type { IndividualHomeModel } from '@/lib/individual-home/get-individual-home-model'
import { relativeTimeFor } from '@/lib/individual-home/get-individual-home-model'

type StandingPanelProps = {
  model: IndividualHomeModel
}

/**
 * D1 R2, section 1 — the standing line. A plain-language reading of the Career
 * Record's state: never a score, percentage, or completeness bar (R1-C P3/P8).
 */
export async function StandingPanel({ model }: StandingPanelProps) {
  const t = await getTranslations('individualHome')

  return (
    <div>
      {model.fullName ? (
        <p className="text-2xl font-semibold text-foreground md:text-3xl">
          {t('greeting', { name: model.fullName })}
        </p>
      ) : null}
      <div className="text-foreground/75 mt-2 space-y-1 text-sm md:text-base">
        <p>{t('standing.skills', { count: model.skillCount })}</p>
        {model.universityName ? (
          <p>{t('standing.university', { university: model.universityName })}</p>
        ) : null}
        {model.updatedAt ? (
          <p className="text-foreground/55 text-xs md:text-sm">
            {t('standing.updated', {
              relativeTime: relativeTimeFor(model.updatedAt, model.locale),
            })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
