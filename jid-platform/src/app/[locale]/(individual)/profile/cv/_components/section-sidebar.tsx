'use client'

import { CheckCircle2, Circle, CircleDashed } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CV_BUILDER_SECTIONS, type CvBuilderSection } from '@/lib/cv/constants'
import type { SectionCompletenessMap } from '@/lib/cv/hooks/use-section-completeness'
import { useCvBuilderStore } from '@/stores/cv-builder-store'
import { cn } from '@/lib/utils'

type SectionSidebarProps = {
  completeness: SectionCompletenessMap
}

/** Section 7.4 / 7.5 — five sections with live completeness indicators. */
export function SectionSidebar({ completeness }: SectionSidebarProps) {
  const t = useTranslations('cv.builder.sections')
  const tBuilder = useTranslations('cv.builder')
  const activeSection = useCvBuilderStore((s) => s.activeSection)
  const setActiveSection = useCvBuilderStore((s) => s.setActiveSection)

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-xl border border-jid-line bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-jid-ink/80">{tBuilder('sidebarTitle')}</h2>

      <nav aria-label={tBuilder('sidebarTitle')} className="space-y-1">
        {CV_BUILDER_SECTIONS.map((section) => (
          <button
            key={section}
            type="button"
            onClick={() => setActiveSection(section)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors',
              activeSection === section
                ? 'bg-jid-olive/10 font-medium text-jid-olive'
                : 'text-jid-ink/80 hover:bg-jid-beige/60',
            )}
          >
            <CompletenessIcon status={completeness[section]} section={section} />
            <span>{t(section)}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function CompletenessIcon({
  status,
  section,
}: {
  status: SectionCompletenessMap[CvBuilderSection]
  section: CvBuilderSection
}) {
  const t = useTranslations('cv.builder.completeness')
  const tSections = useTranslations('cv.builder.sections')

  const sectionLabel = tSections(section)
  const label =
    status === 'complete'
      ? t('complete', { section: sectionLabel })
      : status === 'partial'
        ? t('partial', { section: sectionLabel })
        : t('empty', { section: sectionLabel })

  if (status === 'complete') {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-jid-olive" aria-label={label} />
  }
  if (status === 'partial') {
    return <CircleDashed className="h-4 w-4 shrink-0 text-jid-gold" aria-label={label} />
  }
  return <Circle className="h-4 w-4 shrink-0 text-jid-ink/30" aria-label={label} />
}
