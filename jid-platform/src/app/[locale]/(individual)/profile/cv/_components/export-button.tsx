'use client'

import { Download, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics/track'
import { canExport } from '@/lib/cv/can-export'
import { downloadCvPdfBlob, renderCvPdfBlob } from '@/lib/cv/export-cv-pdf'
import { logCvExportClient } from '@/lib/cv/client'
import { mapCvFullRecordToCvData } from '@/lib/cv/mappers'
import type { CvFullRecord } from '@/types/cv'

type ExportButtonProps = {
  cv: CvFullRecord
}

/** Section 7.11 — client-side PDF export with `cv_generations` audit log. */
export function ExportButton({ cv }: ExportButtonProps) {
  const t = useTranslations('cv.builder.export')
  const [isExporting, setIsExporting] = useState(false)
  const exportCheck = canExport(cv)

  const handleExport = useCallback(async () => {
    if (!exportCheck.ok || isExporting) return

    setIsExporting(true)
    try {
      const data = mapCvFullRecordToCvData(cv)
      const blob = await renderCvPdfBlob(data)
      downloadCvPdfBlob(blob, cv.full_name ?? 'Resume')
      await logCvExportClient(cv.id)
      track('cv_pdf_generated', { cv_id: cv.id })
    } catch (error) {
      console.error('CV export failed', error)
      track('cv_pdf_failed', {
        cv_id: cv.id,
        error: error instanceof Error ? error.message : 'unknown',
      })
    } finally {
      setIsExporting(false)
    }
  }, [cv, exportCheck.ok, isExporting])

  const disabledReason = !exportCheck.ok
    ? t(`disabled.${exportCheck.reasons[0] ?? 'missing_cv'}`)
    : undefined

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        className="gap-1.5 bg-primary hover:bg-primary/90"
        disabled={!exportCheck.ok || isExporting}
        onClick={() => void handleExport()}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="h-4 w-4" aria-hidden />
        )}
        {isExporting ? t('exporting') : t('action')}
      </Button>
      {disabledReason ? (
        <p className="max-w-[220px] text-end text-[11px] text-muted-foreground">{disabledReason}</p>
      ) : null}
    </div>
  )
}
