'use client'

import { useTranslations } from 'next-intl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CvZoomLevel } from '@/lib/cv/constants'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import type { SectionCompletenessMap } from '@/lib/cv/hooks/use-section-completeness'
import type { CvFullRecord } from '@/types/cv'
import { MobileSectionAccordion } from './mobile-section-accordion'
import type { ReactNode } from 'react'

type MobileCvBuilderProps = {
  cv: CvFullRecord | undefined
  completeness: SectionCompletenessMap
  isLoading: boolean
  zoomLevel: CvZoomLevel
  format: CvExportFormatKey
  preview: ReactNode
}

/** Mobile Edit/Preview tabs with format-aware gated preview. */
export function MobileCvBuilder({
  cv,
  completeness,
  isLoading,
  preview,
}: MobileCvBuilderProps) {
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
        {cv ? <div className="min-h-[calc(100vh-16rem)]">{preview}</div> : null}
      </TabsContent>
    </Tabs>
  )
}
