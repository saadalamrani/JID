'use client'

import { useTranslations } from 'next-intl'
import type { CvBuilderSection } from '@/lib/cv/constants'
import type { CvFullRecord } from '@/types/cv'
import { SectionAdditionalForm } from './section-additional-form'
import { SectionEducationForm } from './section-education-form'
import { SectionExperienceForm } from './section-experience-form'
import { SectionHeaderForm } from './section-header-form'
import { SectionSkillsForm } from './section-skills-form'

type SectionFormPaneProps = {
  section: CvBuilderSection
  cv: CvFullRecord | undefined
  isLoading: boolean
}

export function SectionFormPane({ section, cv, isLoading }: SectionFormPaneProps) {
  const t = useTranslations('cv.builder')
  const tSections = useTranslations('cv.builder.sections')

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">{tSections(section)}</h2>
        {isLoading ? <span className="text-xs text-foreground/40">{t('syncing')}</span> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {section === 'header' && cv ? (
          <SectionHeaderForm cv={cv} />
        ) : section === 'education' && cv ? (
          <SectionEducationForm cv={cv} />
        ) : section === 'experience' && cv ? (
          <SectionExperienceForm cv={cv} />
        ) : section === 'skills' && cv ? (
          <SectionSkillsForm cv={cv} />
        ) : section === 'additional' && cv ? (
          <SectionAdditionalForm cv={cv} />
        ) : (
          <div className="flex flex-1 flex-col justify-center rounded-lg border border-dashed border-border bg-background/20 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">{t('formPlaceholderTitle')}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t('formPlaceholderBody')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
