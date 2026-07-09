'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { track } from '@/lib/analytics/track'
import { estimatePageCount } from '@/lib/cv/estimate-page-count'
import { useDebounce } from '@/lib/hooks/use-debounce'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'
import type { CvData } from '@/types/cv'

const OVERFLOW_PAGE_THRESHOLD = 1
const MEASURE_DEBOUNCE_MS = 500

type PageOverflowWarningProps = {
  data: CvData
  format?: CvExportFormatKey
}

/** Warns when rendered PDF exceeds one page (measured via temp render). */
export function PageOverflowWarning({ data, format = 'basic_free' }: PageOverflowWarningProps) {
  const t = useTranslations('cv.builder.overflow')
  const debouncedData = useDebounce(data, MEASURE_DEBOUNCE_MS)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const requestIdRef = useRef(0)
  const overflowTrackedRef = useRef(false)

  useEffect(() => {
    const requestId = ++requestIdRef.current
    setIsMeasuring(true)

    void estimatePageCount(debouncedData, format)
      .then((count) => {
        if (requestId !== requestIdRef.current) return
        setPageCount(count)
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return
        setPageCount(null)
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return
        setIsMeasuring(false)
      })
  }, [debouncedData, format])

  useEffect(() => {
    if (pageCount == null || pageCount <= OVERFLOW_PAGE_THRESHOLD || overflowTrackedRef.current) {
      return
    }
    overflowTrackedRef.current = true
    track('cv_overflow_warning_shown', { page_count: pageCount })
  }, [pageCount])

  if (isMeasuring && pageCount == null) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {t('measuring')}
      </p>
    )
  }

  if (pageCount == null || pageCount <= OVERFLOW_PAGE_THRESHOLD) {
    return null
  }

  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <p>{t('warning', { count: pageCount })}</p>
    </div>
  )
}
