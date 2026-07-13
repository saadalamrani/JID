'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { mapCvFullRecordToCvData } from '@/lib/cv/mappers'
import { registerCvPdfFonts } from '@/lib/cv/formats/pdf-fonts'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import { formatRequiresPlus } from '@/lib/cv/formats/registry'
import type { CvFullRecord } from '@/types/cv'
import type { CvZoomLevel } from '@/lib/cv/constants'
import { cn } from '@/lib/utils'
import { PageOverflowWarning } from './page-overflow-warning'
import { PreviewToolbar } from './preview-toolbar'

const PDFViewerPane = dynamic(
  () => import('@/lib/cv/cv-pdf-preview').then((mod) => mod.CvFormatPdfPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-sm text-muted-foreground">…</p>
      </div>
    ),
  },
)

const PREVIEW_DEBOUNCE_MS = 300

type LivePreviewPaneProps = {
  cv: CvFullRecord
  zoomLevel: CvZoomLevel
  format: CvExportFormatKey
}

/** Live document preview with format-aware renderer (Prompt 1). */
export function LivePreviewPane({ cv, zoomLevel, format }: LivePreviewPaneProps) {
  const t = useTranslations('cv.builder.preview')
  const debouncedCv = useDebounce(cv, PREVIEW_DEBOUNCE_MS)
  const isPreviewStale = debouncedCv !== cv

  const pdfData = useMemo(() => mapCvFullRecordToCvData(debouncedCv), [debouncedCv])

  useEffect(() => {
    if (formatRequiresPlus(format)) {
      registerCvPdfFonts()
    }
  }, [format])

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-background/20 p-4">
      <div className="mb-3 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t('title')}</h2>
        <PreviewToolbar cv={cv} format={format} isPreviewStale={isPreviewStale} />
        <PageOverflowWarning data={pdfData} format={format} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-card p-3">
        <div
          className={cn('origin-top transition-transform')}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        >
          <PDFViewerPane data={pdfData} format={format} />
        </div>
      </div>
    </div>
  )
}
