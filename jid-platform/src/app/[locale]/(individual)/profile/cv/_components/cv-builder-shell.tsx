'use client'

import { useTranslations } from 'next-intl'
import { useCv } from '@/lib/cv/queries'
import { useCvBuilderAnalytics } from '@/lib/cv/hooks/use-cv-builder-analytics'
import { useSectionCompleteness } from '@/lib/cv/hooks/use-section-completeness'
import { useCvBuilderStore } from '@/stores/cv-builder-store'
import { LivePreviewPane } from './live-preview-pane'
import { MobileCvBuilder } from './mobile-cv-builder'
import { SectionFormPane } from './section-form-pane'
import { SectionSidebar } from './section-sidebar'
import type { CvFullRecord } from '@/types/cv'

type CvBuilderShellProps = {
  initialCv: CvFullRecord
  created: boolean
}

/** Section 7.3 — desktop sidebar | form | preview; Section 10 — mobile tabs + accordion. */
export function CvBuilderShell({ initialCv, created }: CvBuilderShellProps) {
  const t = useTranslations('cv.builder')
  const activeSection = useCvBuilderStore((s) => s.activeSection)
  const zoomLevel = useCvBuilderStore((s) => s.zoomLevel)

  const cvQuery = useCv(initialCv.id, initialCv)

  const cv = cvQuery.data
  const completeness = useSectionCompleteness(cv)

  useCvBuilderAnalytics({
    cvId: initialCv.id,
    created,
    completeness,
  })

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-arabic text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="text-sm text-jid-ink/60">
          {created ? t('createdBanner') : t('resumeBanner')}
        </p>
      </header>

      <div className="hidden min-h-[calc(100vh-12rem)] grid-cols-1 gap-4 xl:grid xl:grid-cols-12">
        <div className="xl:col-span-2">
          <SectionSidebar completeness={completeness} />
        </div>

        <div className="min-h-[420px] xl:col-span-5">
          <SectionFormPane section={activeSection} cv={cv} isLoading={cvQuery.isFetching} />
        </div>

        <div className="min-h-[420px] xl:col-span-5">
          {cv ? <LivePreviewPane cv={cv} zoomLevel={zoomLevel} /> : null}
        </div>
      </div>

      <div className="xl:hidden">
        <MobileCvBuilder
          cv={cv}
          completeness={completeness}
          isLoading={cvQuery.isFetching}
          zoomLevel={zoomLevel}
        />
      </div>
    </div>
  )
}
