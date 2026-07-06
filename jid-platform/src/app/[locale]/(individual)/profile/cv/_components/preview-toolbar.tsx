'use client'

import { useTranslations } from 'next-intl'
import { CV_ZOOM_LEVELS } from '@/lib/cv/constants'
import { useCvBuilderStore } from '@/stores/cv-builder-store'
import { cn } from '@/lib/utils'
import { ExportButton } from './export-button'
import type { CvFullRecord } from '@/types/cv'

type PreviewToolbarProps = {
  cv: CvFullRecord
  isPreviewStale?: boolean
}

/** Section 7.5 — zoom controls + export action. */
export function PreviewToolbar({ cv, isPreviewStale = false }: PreviewToolbarProps) {
  const t = useTranslations('cv.builder.preview')
  const zoomLevel = useCvBuilderStore((s) => s.zoomLevel)
  const setZoomLevel = useCvBuilderStore((s) => s.setZoomLevel)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-jid-ink/60">{t('zoomLabel')}</span>
        <div className="flex flex-wrap gap-1.5">
          {CV_ZOOM_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setZoomLevel(level)}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                zoomLevel === level
                  ? 'border-jid-olive bg-jid-olive/10 text-jid-olive'
                  : 'border-jid-line text-jid-ink/70 hover:bg-jid-beige/60',
              )}
            >
              {Math.round(level * 100)}%
            </button>
          ))}
        </div>
        {isPreviewStale ? (
          <span className="text-xs text-jid-ink/40">{t('updating')}</span>
        ) : null}
      </div>

      <ExportButton cv={cv} />
    </div>
  )
}
