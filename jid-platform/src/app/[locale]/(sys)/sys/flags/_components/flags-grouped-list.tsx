'use client'

import { useTranslations } from 'next-intl'
import type { FeatureFlag, FeatureFlagCategory } from '@/lib/governance/schemas'
import { FEATURE_FLAG_CATEGORY_ORDER } from '@/lib/sys/feature-flags'
import { FlagRow } from './flag-row'

type FlagsGroupedListProps = {
  grouped: Record<FeatureFlagCategory, FeatureFlag[]>
}

/** Section 7.2 — flags grouped by category. */
export function FlagsGroupedList({ grouped }: FlagsGroupedListProps) {
  const t = useTranslations('sys.flags')

  return (
    <div className="space-y-8">
      {FEATURE_FLAG_CATEGORY_ORDER.map((category) => {
        const flags = grouped[category]
        if (!flags.length) return null

        return (
          <section key={category} aria-labelledby={`flags-${category}`}>
            <h2 id={`flags-${category}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-jid-ink/50">
              {t(`categories.${category}`)}
            </h2>
            <div className="space-y-2">
              {flags.map((flag) => (
                <FlagRow key={flag.key} flag={flag} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
