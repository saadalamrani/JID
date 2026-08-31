'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { UniversityReportPayload } from '@/types/contracts/university-reporting'

type UniversityReportResultsProps = {
  payload: UniversityReportPayload
}

export function UniversityReportResults({ payload }: UniversityReportResultsProps) {
  const t = useTranslations('university.reports')
  const locale = useLocale()
  const isAr = locale.startsWith('ar')

  return (
    <section className="rounded-2xl border border-border bg-background p-5" data-testid="university-report-results">
      <h2 className="text-lg font-semibold text-foreground">{t('resultsTitle')}</h2>
      <p className="text-foreground/65 mt-2 text-sm">{t('benchmarkUnavailable')}</p>
      {!payload.coverage.sufficient ? (
        <p className="mt-3 rounded-lg border border-border px-3 py-2 text-sm" data-testid="university-report-insufficient">
          {isAr ? payload.coverage.notes_ar : payload.coverage.notes_en}
        </p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {payload.aggregates.map((row) => (
          <li key={row.key} className="rounded-lg border border-border px-3 py-3 text-sm">
            <p className="font-medium text-foreground">{isAr ? row.label_ar : row.label_en}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground" data-testid={`aggregate-${row.key}`}>
              {row.status === 'contract_only'
                ? t('contractOnly')
                : row.suppressed
                  ? t('suppressed')
                  : row.status === 'insufficient' || row.status === 'unknown' || row.value === null
                    ? t('unavailable')
                    : String(row.value)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
