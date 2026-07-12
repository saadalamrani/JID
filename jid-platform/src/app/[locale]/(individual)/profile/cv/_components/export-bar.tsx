'use client'

import { Download, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useEntitlement } from '@/lib/monetization/use-entitlement'
import { canExport, buildExportFilename } from '@/lib/cv/can-export'
import { logCvExportClient } from '@/lib/cv/client'
import { mapCvFullRecordToCvData } from '@/lib/cv/mappers'
import {
  renderCvFormatPdfBlob,
  stashCvDataForArPrint,
} from '@/lib/cv/formats/render-format-pdf'
import type { CvExportFormatKey, CvExportLanguage } from '@/lib/cv/formats/registry'
import { formatRequiresPlus } from '@/lib/cv/formats/registry'
import { cn } from '@/lib/utils'
import type { CvFullRecord } from '@/types/cv'

type ExportBarProps = {
  cv: CvFullRecord
  format: CvExportFormatKey
  className?: string
}

/**
 * Generate → download export bar (Prompt 1).
 * Plus: EN react-pdf / AR print-CSS / bilingual pair.
 */
export function ExportBar({ cv, format, className }: ExportBarProps) {
  const t = useTranslations('cv.builder.exportBar')
  const locale = useLocale() as 'ar' | 'en'
  const { enabled: hasPlus } = useEntitlement('cv_pro_formats')
  const [exportLanguage, setExportLanguage] = useState<CvExportLanguage>('en')
  const [isExporting, setIsExporting] = useState(false)

  const exportCheck = canExport(cv)
  const plusFormatSelected = formatRequiresPlus(format)
  const exportBlocked = !exportCheck.ok || (plusFormatSelected && !hasPlus)

  const downloadPdfBlob = useCallback((blob: Blob, suffix: string) => {
    const filename = buildExportFilename(cv.full_name ?? 'Resume').replace(/\.pdf$/i, `${suffix}.pdf`)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }, [cv.full_name])

  const openArPrintWindow = useCallback(
    (data: ReturnType<typeof mapCvFullRecordToCvData>) => {
      stashCvDataForArPrint({ ...data, locale: 'ar' })
      const path = `/${locale}/profile/cv/print-cv-ar`
      window.open(path, '_blank', 'noopener,noreferrer')
    },
    [locale],
  )

  const handleExport = useCallback(async () => {
    if (exportBlocked || isExporting) return

    setIsExporting(true)
    try {
      const data = mapCvFullRecordToCvData(cv)

      if (exportLanguage === 'ar') {
        if (!hasPlus) {
          toast.error(t('plusRequired'))
          return
        }
        openArPrintWindow(data)
        await logCvExportClient(cv.id)
        if (process.env.NODE_ENV === 'development') {
          console.debug('[analytics]', 'cv_generated', { format, language: 'ar' })
        }
        return
      }

      if (exportLanguage === 'bilingual') {
        if (!hasPlus) {
          toast.error(t('plusRequired'))
          return
        }
        const enBlob = await renderCvFormatPdfBlob(format, { ...data, locale: 'en' })
        downloadPdfBlob(enBlob, '-en')
        openArPrintWindow(data)
        await logCvExportClient(cv.id)
        if (process.env.NODE_ENV === 'development') {
          console.debug('[analytics]', 'cv_generated', { format, language: 'bilingual' })
        }
        return
      }

      const blob = await renderCvFormatPdfBlob(format, { ...data, locale: 'en' })
      downloadPdfBlob(blob, plusFormatSelected ? `-${format}` : '')
      await logCvExportClient(cv.id)

      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', 'cv_generated', { format, language: 'en' })
      }
    } catch (error) {
      console.error('CV export failed', error)
      toast.error(error instanceof Error ? error.message : t('failed'))
    } finally {
      setIsExporting(false)
    }
  }, [
    cv,
    downloadPdfBlob,
    exportBlocked,
    exportLanguage,
    format,
    hasPlus,
    isExporting,
    openArPrintWindow,
    plusFormatSelected,
    t,
  ])

  const disabledReason = !exportCheck.ok
    ? t(`disabled.${exportCheck.reasons[0] ?? 'missing_cv'}`)
    : plusFormatSelected && !hasPlus
      ? t('plusRequired')
      : undefined

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      {hasPlus ? (
        <div
          className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
          role="tablist"
          aria-label={t('languageToggle')}
        >
          {(['en', 'ar', 'bilingual'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={exportLanguage === lang}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-arabic transition-colors',
                exportLanguage === lang
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setExportLanguage(lang)}
            >
              {t(`languages.${lang}`)}
            </button>
          ))}
        </div>
      ) : null}

      <Button
        type="button"
        size="sm"
        className="gap-1.5 bg-primary font-arabic text-primary-foreground hover:bg-primary/90"
        disabled={exportBlocked || isExporting}
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
        <p className="max-w-[260px] text-end font-arabic text-[11px] text-muted-foreground">
          {disabledReason}
        </p>
      ) : null}
    </div>
  )
}
