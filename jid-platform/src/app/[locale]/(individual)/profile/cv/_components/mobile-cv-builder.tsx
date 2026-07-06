'use client'

import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CvZoomLevel } from '@/lib/cv/constants'
import type { SectionCompletenessMap } from '@/lib/cv/hooks/use-section-completeness'
import type { CvFullRecord } from '@/types/cv'
import { LivePreviewPane } from './live-preview-pane'
import { MobileSectionAccordion } from './mobile-section-accordion'

type MobileCvBuilderProps = {
  cv: CvFullRecord | undefined
  completeness: SectionCompletenessMap
  isLoading: boolean
  zoomLevel: CvZoomLevel
}

/** Section 10 — mobile Edit/Preview tab switch with accordion editors. */
export function MobileCvBuilder({ cv, completeness, isLoading, zoomLevel }: MobileCvBuilderProps) {
  const t = useTranslations('cv.builder.mobile')

  return (
    <Tabs defaultValue="edit" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="edit">{t('editTab')}</TabsTrigger>
        <TabsTrigger value="preview">{t('previewTab')}</TabsTrigger>
      </TabsList>

      <TabsContent value="edit" className="mt-0">
        <MobileSectionAccordion cv={cv} completeness={completeness} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="preview" className="mt-0">
        {cv ? (
          <div className="min-h-[calc(100vh-16rem)]">
            <LivePreviewPane cv={cv} zoomLevel={zoomLevel} />
          </div>
        ) : null}
      </TabsContent>
    </Tabs>
  )
}
