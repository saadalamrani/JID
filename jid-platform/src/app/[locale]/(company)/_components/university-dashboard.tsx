'use client'

import { useLocale, useTranslations } from 'next-intl'
import type { UniversityOwnerFoundationSnapshot } from '@/types/contracts/university'
import { EmptyUniversityState } from './empty-university-state'

function dateLocaleTag(locale: string): string {
  return locale.startsWith('ar') ? 'ar-SA' : 'en-US'
}

type UniversityDashboardProps = {
  foundation: UniversityOwnerFoundationSnapshot
}

export function UniversityDashboard({ foundation }: UniversityDashboardProps) {
  const t = useTranslations('university.dashboard')
  const locale = useLocale()
  const isAr = locale.startsWith('ar')

  if (!foundation.mapping_present) {
    return (
      <EmptyUniversityState
        title={t('unmapped.title')}
        description={t('unmapped.description')}
        ctaHref="/university/profile"
        ctaLabel={t('unmapped.cta')}
      />
    )
  }

  const mappedAt = foundation.mapped_at
    ? new Date(foundation.mapped_at).toLocaleString(dateLocaleTag(locale), { numberingSystem: 'latn' })
    : null

  return (
    <div className="space-y-5" data-testid="university-dashboard-foundation">
      <header className="rounded-2xl border border-border bg-background p-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('foundation.title')}</h1>
        {mappedAt ? (
          <p className="text-foreground/65 mt-1 text-sm">
            {t('foundation.mappedAt')}: {mappedAt}
          </p>
        ) : null}
        <p className="text-foreground/65 mt-2 max-w-2xl text-sm leading-relaxed">
          {t('foundation.privacy')}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-background p-5" data-testid="university-verified-count">
        <h2 className="text-lg font-semibold text-foreground">{t('foundation.verifiedTitle')}</h2>
        <p className="mt-2 text-3xl font-semibold text-foreground">
          {foundation.verified_affiliation_count ?? 0}
        </p>
        <p className="text-foreground/65 mt-2 text-sm">{t('foundation.verifiedHint')}</p>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('foundation.cohortsTitle')}</h2>
        {foundation.cohorts && foundation.cohorts.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {foundation.cohorts.map((cohort) => (
              <li
                key={cohort.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <p className="font-medium text-foreground">
                  {cohort.graduation_year}
                  {cohort.program_text ? ` · ${cohort.program_text}` : ''}
                  {cohort.degree_level ? ` · ${cohort.degree_level}` : ''}
                </p>
                <p className="text-foreground/65 mt-1">
                  {t('foundation.membershipCount', { count: cohort.active_membership_count })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-foreground/65 mt-2 text-sm">{t('foundation.cohortsEmpty')}</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('foundation.outcomesTitle')}</h2>
        <p className="text-foreground/65 mt-2 text-sm">{t('foundation.outcomesHint')}</p>
        {foundation.outcome_counts && foundation.outcome_counts.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {foundation.outcome_counts.map((row) => (
              <li key={`${row.source}-${row.presence}-${row.category}`} className="text-sm">
                {row.source} · {row.presence} · {row.category}: {row.count}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-foreground/65 mt-2 text-sm">{t('foundation.outcomesEmpty')}</p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">{t('foundation.metricsTitle')}</h2>
        <ul className="mt-3 space-y-4">
          {(foundation.metrics ?? []).map((metric) => (
            <li key={metric.metric_key} className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">{isAr ? metric.name_ar : metric.name_en}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground" data-testid={`metric-${metric.metric_key}`}>
                {metric.computability === 'CONTRACT_ONLY' || metric.value === null
                  ? t('foundation.metricUnknown')
                  : String(metric.value)}
              </p>
              <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">{t('foundation.metricSource')}</dt>
                  <dd>{metric.source_definition}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">{t('foundation.metricPopulation')}</dt>
                  <dd>{metric.population_definition}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">{t('foundation.metricWindow')}</dt>
                  <dd>{metric.window_definition}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">{t('foundation.metricCoverage')}</dt>
                  <dd>{metric.coverage_rule}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">{t('foundation.metricMissingness')}</dt>
                  <dd>{metric.missingness_rule}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">{t('foundation.metricPrivacy')}</dt>
                  <dd>{metric.privacy_rule}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
