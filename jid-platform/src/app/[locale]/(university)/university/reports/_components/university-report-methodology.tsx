'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { UniversityReportPayload } from '@/types/contracts/university-reporting'

type UniversityReportMethodologyProps = {
  payload: UniversityReportPayload
}

export function UniversityReportMethodology({ payload }: UniversityReportMethodologyProps) {
  const t = useTranslations('university.reports')
  const locale = useLocale()
  const isAr = locale.startsWith('ar')

  return (
    <details
      className="rounded-2xl border border-border bg-background p-5"
      data-testid="university-report-methodology"
      open
    >
      <summary className="min-h-11 cursor-pointer text-lg font-semibold text-foreground">
        {t('howComputed')}
      </summary>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-medium text-foreground">{t('population')}</dt>
          <dd className="text-foreground/70">
            {isAr ? payload.population?.label_ar : payload.population?.label_en}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{t('period')}</dt>
          <dd className="text-foreground/70">
            {isAr ? payload.time_window.label_ar : payload.time_window.label_en}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{t('dataAsOf')}</dt>
          <dd className="text-foreground/70" data-testid="university-report-data-as-of">
            {payload.data_as_of
              ? new Date(payload.data_as_of).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
                  numberingSystem: 'latn',
                })
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{t('methodologyVersion')}</dt>
          <dd className="text-foreground/70">{payload.methodology_version}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{t('coverage')}</dt>
          <dd className="text-foreground/70" data-testid="university-report-coverage">
            {isAr ? payload.coverage.notes_ar : payload.coverage.notes_en}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{t('missingness')}</dt>
          <dd className="text-foreground/70" data-testid="university-report-missingness">
            {isAr ? payload.missingness_notes_ar : payload.missingness_notes_en}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{t('source')}</dt>
          <dd className="text-foreground/70">{payload.intelligence_source}</dd>
        </div>
      </dl>
      <ul className="mt-4 space-y-3">
        {payload.metric_definitions.map((metric) => (
          <li key={metric.metric_key} className="rounded-lg border border-border p-3 text-xs">
            <p className="font-medium text-foreground">{isAr ? metric.name_ar : metric.name_en}</p>
            <p className="text-muted-foreground mt-1">{metric.source_definition}</p>
            <p className="text-muted-foreground">{metric.coverage_rule}</p>
          </li>
        ))}
      </ul>
    </details>
  )
}
