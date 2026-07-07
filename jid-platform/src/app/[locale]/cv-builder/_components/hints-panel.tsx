'use client'

import { Lightbulb } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { FeatureGateClient } from '@/lib/feature-flags/feature-gate-client'
import { FLAG_KEYS } from '@/lib/feature-flags/keys'
import type { CvBuilderSection } from '@/lib/cv/constants'
import { useCvBuilderStore } from '@/stores/cv-builder-store'

const HINT_SECTIONS: CvBuilderSection[] = [
  'header',
  'education',
  'experience',
  'skills',
  'additional',
]

function HintsPanelContent() {
  const t = useTranslations('cv.builder.hints')
  const activeSection = useCvBuilderStore((s) => s.activeSection)

  return (
    <aside
      className="rounded-xl border border-jid-gold/40 bg-jid-beige-warm px-4 py-3"
      aria-label={t('title')}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-jid-gold/30 bg-white/80">
          <Lightbulb className="h-4 w-4 text-jid-gold" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-jid-ink">{t('title')}</p>
          <p className="mt-1 text-xs leading-relaxed text-jid-ink/65">{t(activeSection)}</p>
        </div>
      </div>
    </aside>
  )
}

/** Smart contextual hints — silently hidden when the flag is off. */
export function HintsPanel() {
  return (
    <FeatureGateClient flag={FLAG_KEYS.CV_BUILDER_SMART_HINTS} fallback={null}>
      <HintsPanelContent />
    </FeatureGateClient>
  )
}

export { HINT_SECTIONS }
