'use client'

import { CheckCircle2, ChevronDown, Circle, CircleDashed } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { CV_BUILDER_SECTIONS, type CvBuilderSection } from '@/lib/cv/constants'
import type { SectionCompletenessMap } from '@/lib/cv/hooks/use-section-completeness'
import { useCvBuilderStore } from '@/stores/cv-builder-store'
import type { CvFullRecord } from '@/types/cv'
import { cn } from '@/lib/utils'
import { SectionAdditionalForm } from './section-additional-form'
import { SectionEducationForm } from './section-education-form'
import { SectionExperienceForm } from './section-experience-form'
import { SectionHeaderForm } from './section-header-form'
import { SectionSkillsForm } from './section-skills-form'

type MobileSectionAccordionProps = {
  cv: CvFullRecord | undefined
  completeness: SectionCompletenessMap
  isLoading: boolean
}

/** Section 10 — accordion-stacked section editors for mobile. */
export function MobileSectionAccordion({ cv, completeness, isLoading }: MobileSectionAccordionProps) {
  const tSections = useTranslations('cv.builder.sections')
  const tBuilder = useTranslations('cv.builder')
  const activeSection = useCvBuilderStore((s) => s.activeSection)
  const setActiveSection = useCvBuilderStore((s) => s.setActiveSection)

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="px-1 text-xs text-foreground/40">{tBuilder('syncing')}</p>
      ) : null}

      {CV_BUILDER_SECTIONS.map((section) => {
        const isOpen = activeSection === section

        return (
          <div
            key={section}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setActiveSection(section)}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-3 text-start text-sm transition-colors',
                isOpen ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              <CompletenessIcon status={completeness[section]} section={section} />
              <span className="flex-1">{tSections(section)}</span>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                aria-hidden
              />
            </button>

            {isOpen && cv ? (
              <div className="border-t border-border px-4 py-4">
                <SectionFormBody section={section} cv={cv} />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function SectionFormBody({ section, cv }: { section: CvBuilderSection; cv: CvFullRecord }) {
  switch (section) {
    case 'header':
      return <SectionHeaderForm cv={cv} />
    case 'education':
      return <SectionEducationForm cv={cv} />
    case 'experience':
      return <SectionExperienceForm cv={cv} />
    case 'skills':
      return <SectionSkillsForm cv={cv} />
    case 'additional':
      return <SectionAdditionalForm cv={cv} />
    default:
      return null
  }
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
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-label={label} />
  }
  if (status === 'partial') {
    return <CircleDashed className="h-4 w-4 shrink-0 text-accent" aria-label={label} />
  }
  return <Circle className="h-4 w-4 shrink-0 text-foreground/30" aria-label={label} />
}
