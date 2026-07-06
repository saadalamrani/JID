'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { mapCvFullRecordToCvData } from '@/lib/cv/mappers'
import type { CvFullRecord } from '@/types/cv'
import type { CvZoomLevel } from '@/lib/cv/constants'
import { cn } from '@/lib/utils'
import { PageOverflowWarning } from './page-overflow-warning'
import { PreviewToolbar } from './preview-toolbar'

const PDFViewerPane = dynamic(
  () => import('@/lib/cv/cv-pdf-preview').then((mod) => mod.CvPdfPreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] items-center justify-center rounded-lg border border-jid-line bg-white">
        <p className="text-sm text-jid-ink/50">…</p>
      </div>
    ),
  },
)

const PREVIEW_DEBOUNCE_MS = 300

type LivePreviewPaneProps = {
  cv: CvFullRecord
  zoomLevel: CvZoomLevel
}

/** Section 7.5 — debounced Harvard PDF live preview with toolbar + overflow warning. */
export function LivePreviewPane({ cv, zoomLevel }: LivePreviewPaneProps) {
  const t = useTranslations('cv.builder.preview')
  const debouncedCv = useDebounce(cv, PREVIEW_DEBOUNCE_MS)
  const isPreviewStale = debouncedCv !== cv

  const pdfData = useMemo(() => mapCvFullRecordToCvData(debouncedCv), [debouncedCv])

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-jid-line bg-jid-beige/20 p-4">
      <div className="mb-3 space-y-3">
        <h2 className="text-sm font-medium text-jid-ink/80">{t('title')}</h2>
        <PreviewToolbar cv={cv} isPreviewStale={isPreviewStale} />
        <PageOverflowWarning data={pdfData} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-jid-line bg-white p-3">
        <div
          className={cn('origin-top transition-transform')}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
        >
          <PDFViewerPane data={pdfData} />
        </div>
      </div>
    </div>
  )
}
