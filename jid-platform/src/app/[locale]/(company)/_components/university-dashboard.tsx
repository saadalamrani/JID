'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { UniversityIntelligenceSnapshot } from '@/types/contracts/university'
import { EmptyUniversityState } from './empty-university-state'

export function UniversityDashboard({
  foundation,
}: {
  foundation: UniversityIntelligenceSnapshot
}) {
  const t = useTranslations('university.dashboard')
  const locale = useLocale()
  const router = useRouter()
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

  const coverage = foundation.known_outcome_coverage
  const cohorts = foundation.cohorts ?? []
  const distribution = foundation.outcome_distribution ?? []
  const alignment = foundation.alignment_evidence ?? []
  const activities = foundation.readiness_activities ?? []

  return (
    <div className="space-y-5" data-testid="university-intelligence">
      <header className="rounded-2xl border border-border bg-background p-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('intelligence.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t('intelligence.privacy')}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-background p-5">
        <label htmlFor="cohort" className="text-sm font-medium text-foreground">
          {t('intelligence.cohortLabel')}
        </label>
        <select
          id="cohort"
          className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 sm:max-w-xl"
          value={foundation.selected_cohort_id ?? ''}
          onChange={(event) =>
            router.replace(
              event.target.value
                ? `/university/dashboard?cohort=${event.target.value}`
                : '/university/dashboard',
            )
          }
        >
          <option value="">{t('intelligence.allCohorts')}</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.graduation_year} · {cohort.program_text ?? t('intelligence.unmappedProgram')}{' '}
              · {cohort.degree_level ?? t('intelligence.unknownDegree')}
            </option>
          ))}
        </select>
      </section>

      <section
        className="rounded-2xl border border-border bg-background p-5"
        data-testid="known-outcome-coverage"
      >
        <h2 className="text-lg font-semibold text-foreground">{t('intelligence.coverageTitle')}</h2>
        {foundation.suppressed ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('intelligence.suppressed')}</p>
        ) : coverage === null || coverage === undefined ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('intelligence.insufficient')}</p>
        ) : (
          <>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {new Intl.NumberFormat(locale, {
                style: 'percent',
                maximumFractionDigits: 1,
                numberingSystem: 'latn',
              }).format(coverage)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('intelligence.coverageCounts', {
                known: foundation.known_outcome_count ?? 0,
                eligible: foundation.eligible_population ?? 0,
              })}
            </p>
          </>
        )}
        <p className="mt-3 text-sm text-muted-foreground">{t('intelligence.notEmploymentRate')}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('intelligence.productThreshold', { count: foundation.suppression_threshold ?? 5 })}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('intelligence.distributionTitle')}
        </h2>
        {distribution.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t('intelligence.insufficient')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {distribution.map((row) => (
              <li
                key={`${row.source}-${row.category}`}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <span className="font-medium">{t(`intelligence.categories.${row.category}`)}</span>{' '}
                · {row.source}: {row.count}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('intelligence.alignmentTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('intelligence.alignmentMethod')}</p>
        {alignment.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('intelligence.alignmentEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {alignment.map((item) => (
              <li key={item.id} className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground">
                  {isAr ? item.title_ar : (item.title_en ?? item.title_ar)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAr ? item.statement_ar : item.statement_en}
                </p>
                {item.required_skills.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {item.required_skills.join(' · ')}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('intelligence.source')}: {item.provenance_ref}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('intelligence.readinessTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('intelligence.readinessMethod')}</p>
        {activities.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('intelligence.readinessEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground">
                  {isAr ? activity.title_ar : activity.title_en}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.activity_type} · {activity.status} ·{' '}
                  {new Date(activity.starts_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                    numberingSystem: 'latn',
                  })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.participation_count === null
                    ? t('intelligence.participationUnknown')
                    : t('intelligence.participationRecorded', {
                        count: activity.participation_count,
                      })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="text-lg font-semibold text-foreground">
          {t('intelligence.methodologyTitle')}
        </h2>
        <ul className="mt-3 space-y-4">
          {(foundation.methodology ?? []).map((metric) => (
            <li key={metric.metric_key} className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">
                {isAr ? metric.name_ar : metric.name_en}
              </p>
              <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">{t('foundation.metricSource')}</dt>
                  <dd>{metric.source_definition}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">
                    {t('foundation.metricPopulation')}
                  </dt>
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
                  <dt className="font-medium text-foreground">
                    {t('foundation.metricMissingness')}
                  </dt>
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
