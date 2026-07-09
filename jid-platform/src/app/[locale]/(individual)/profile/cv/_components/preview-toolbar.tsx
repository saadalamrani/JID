'use client'

import { useTranslations } from 'next-intl'
import { CV_ZOOM_LEVELS } from '@/lib/cv/constants'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import { useCvBuilderStore } from '@/stores/cv-builder-store'
import { cn } from '@/lib/utils'
import { ExportBar } from './export-bar'
import type { CvFullRecord } from '@/types/cv'

type PreviewToolbarProps = {
  cv: CvFullRecord
  format: CvExportFormatKey
  isPreviewStale?: boolean
}

/** Zoom controls + export bar (Prompt 1). */
export function PreviewToolbar({ cv, format, isPreviewStale = false }: PreviewToolbarProps) {
  const t = useTranslations('cv.builder.preview')
  const zoomLevel = useCvBuilderStore((s) => s.zoomLevel)
  const setZoomLevel = useCvBuilderStore((s) => s.setZoomLevel)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t('zoomLabel')}</span>
        <div className="flex flex-wrap gap-1.5">
          {CV_ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoomLevel(level)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                zoomLevel === level
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {Math.round(level * 100)}%
            </button>
          ))}
        </div>
        {isPreviewStale ? (
          <span className="text-xs text-foreground/40">{t('updating')}</span>
        ) : null}
      </div>

      <ExportBar cv={cv} format={format} />
    </div>
  )
}
