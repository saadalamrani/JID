'use client'

import { useMemo, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { generateUniversityReportSnapshot } from '@/lib/university/wave12-actions'
import { UNIVERSITY_REPORT_TYPES, type UniversityReportPayload, type UniversityReportType } from '@/types/contracts/university-reporting'
import { UniversityReportMethodology } from './university-report-methodology'
import { UniversityReportResults } from './university-report-results'

type CohortOption = {
  id: string
  graduation_year: number
  program_text: string | null
  degree_level: string | null
}

type HistoryItem = {
  report_id: string
  report_type: UniversityReportType
  status: string
  generated_at: string
  data_as_of: string
  population_label_ar: string
  population_label_en: string
}

type UniversityReportsWorkspaceProps = {
  preview: UniversityReportPayload | null
  cohorts: CohortOption[]
  history: HistoryItem[]
  initialType: UniversityReportType
  initialCohortId: string | null
}

function dateLabel(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale.startsWith('ar') ? 'ar-SA' : 'en-US', {
    numberingSystem: 'latn',
  })
}

export function UniversityReportsWorkspace({
  preview,
  cohorts,
  history,
  initialType,
  initialCohortId,
}: UniversityReportsWorkspaceProps) {
  const t = useTranslations('university.reports')
  const locale = useLocale()
  const isAr = locale.startsWith('ar')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<UniversityReportPayload | null>(null)

  const typeLabels = useMemo(
    () => ({
      cohort_outcome_summary: t('types.cohort_outcome_summary'),
      program_employability_evidence: t('types.program_employability_evidence'),
      employer_alignment_summary: t('types.employer_alignment_summary'),
      career_readiness_activity: t('types.career_readiness_activity'),
      data_coverage_methodology: t('types.data_coverage_methodology'),
    }),
    [t],
  )

  return (
    <div className="space-y-5" data-testid="university-reports-workspace">
      <header className="rounded-2xl border border-border bg-background p-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-foreground/65 mt-2 max-w-2xl text-sm leading-relaxed">{t('intro')}</p>
        <p className="text-foreground/65 mt-2 text-sm">{t('accreditation')}</p>
      </header>

      <form
        className="space-y-4 rounded-2xl border border-border bg-background p-5"
        method="get"
        data-testid="university-report-form"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">{t('chooseType')}</span>
            <select
              name="type"
              defaultValue={initialType}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {UNIVERSITY_REPORT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">{t('choosePopulation')}</span>
            <select
              name="cohort"
              defaultValue={initialCohortId ?? ''}
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">{t('institutionWide')}</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.graduation_year}
                  {cohort.program_text ? ` · ${cohort.program_text}` : ''}
                  {cohort.degree_level ? ` · ${cohort.degree_level}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t('preview')}
        </button>
      </form>

      {preview ? (
        <section className="space-y-4" data-testid="university-report-preview">
          <UniversityReportMethodology payload={preview} />
          <UniversityReportResults payload={preview} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium"
              onClick={() => {
                setError(null)
                startTransition(async () => {
                  const result = await generateUniversityReportSnapshot({
                    reportType: preview.report_type ?? initialType,
                    cohortId: preview.population?.cohort_id ?? initialCohortId,
                  })
                  if (!result.ok) {
                    setError(result.error)
                    return
                  }
                  setGenerated(result.payload)
                })
              }}
            >
              {pending ? t('generating') : t('generate')}
            </button>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {generated?.report_id ? (
            <p className="text-sm text-foreground">
              {t('generated')}{' '}
              <Link className="underline" href={`/university/reports/${generated.report_id}`}>
                {t('openSnapshot')}
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-background p-5" data-testid="university-report-history">
        <h2 className="text-lg font-semibold text-foreground">{t('historyTitle')}</h2>
        {history.length === 0 ? (
          <p className="text-foreground/65 mt-2 text-sm">{t('historyEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((item) => (
              <li key={item.report_id} className="rounded-lg border border-border px-3 py-3 text-sm">
                <Link className="font-medium text-foreground underline" href={`/university/reports/${item.report_id}`}>
                  {typeLabels[item.report_type]}
                </Link>
                <p className="text-foreground/65 mt-1">
                  {isAr ? item.population_label_ar : item.population_label_en}
                </p>
                <p className="text-foreground/65 mt-1">
                  {t('generatedAt')}: {dateLabel(item.generated_at, locale)} · {item.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
