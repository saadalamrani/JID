'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { PlusGate } from '@/components/monetization/plus-gate'
import { useCvBuilderPrefs, FormatPicker } from './format-picker'
import { HintsPanel } from '@/app/[locale]/cv-builder/_components/hints-panel'
import { useCv } from '@/lib/cv/queries'
import { useCvBuilderAnalytics } from '@/lib/cv/hooks/use-cv-builder-analytics'
import { useSectionCompleteness } from '@/lib/cv/hooks/use-section-completeness'
import { useCvBuilderStore } from '@/stores/cv-builder-store'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import { formatRequiresPlus } from '@/lib/cv/formats/registry'
import { LivePreviewPane } from './live-preview-pane'
import { MobileCvBuilder } from './mobile-cv-builder'
import { SectionFormPane } from './section-form-pane'
import { SectionSidebar } from './section-sidebar'
import type { CvFullRecord } from '@/types/cv'

type CvBuilderShellProps = {
  initialCv: CvFullRecord
  created: boolean
}

/** Desktop sidebar | form | preview with Plus-gated pro formats (Prompt 1). */
export function CvBuilderShell({ initialCv, created }: CvBuilderShellProps) {
  const t = useTranslations('cv.builder')
  const activeSection = useCvBuilderStore((s) => s.activeSection)
  const zoomLevel = useCvBuilderStore((s) => s.zoomLevel)
  const prefsQuery = useCvBuilderPrefs()
  const [selectedFormat, setSelectedFormat] = useState<CvExportFormatKey>('basic_free')

  const cvQuery = useCv(initialCv.id, initialCv)
  const cv = cvQuery.data
  const completeness = useSectionCompleteness(cv)

  useEffect(() => {
    if (prefsQuery.data?.preferredFormat) {
      setSelectedFormat(prefsQuery.data.preferredFormat)
    }
  }, [prefsQuery.data?.preferredFormat])

  useCvBuilderAnalytics({
    cvId: initialCv.id,
    created,
    completeness,
  })

  const previewPane =
    cv ? <LivePreviewPane cv={cv} zoomLevel={zoomLevel} format={selectedFormat} /> : null

  const gatedPreview =
    formatRequiresPlus(selectedFormat) && previewPane ? (
      <PlusGate feature="cv_pro_formats" teaserPreview={previewPane}>
        {previewPane}
      </PlusGate>
    ) : (
      previewPane
    )

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-arabic text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {created ? t('createdBanner') : t('resumeBanner')}
        </p>
      </header>

      <FormatPicker value={selectedFormat} onChange={setSelectedFormat} />

      <HintsPanel />

      <div className="hidden min-h-[calc(100vh-12rem)] grid-cols-1 gap-4 xl:grid xl:grid-cols-12">
        <div className="xl:col-span-2">
          <SectionSidebar completeness={completeness} />
        </div>

        <div className="min-h-[420px] xl:col-span-5">
          <SectionFormPane section={activeSection} cv={cv} isLoading={cvQuery.isFetching} />
        </div>

        <div className="min-h-[420px] xl:col-span-5">{gatedPreview}</div>
      </div>

      <div className="xl:hidden">
        <MobileCvBuilder
          cv={cv}
          completeness={completeness}
          isLoading={cvQuery.isFetching}
          zoomLevel={zoomLevel}
          format={selectedFormat}
          preview={gatedPreview}
        />
      </div>
    </div>
  )
}
