'use client'

import { useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { track } from '@/lib/analytics/track'
import {
  type UniversityDashboardSnapshot,
  useUniversityDashboard,
} from '@/lib/queries/university-dashboard'
import { EmptyUniversityState } from './empty-university-state'
import { UniversityConsentGateState } from './university-consent-gate-state'

function pickSnapshot(
  rows: UniversityDashboardSnapshot[] | undefined,
): UniversityDashboardSnapshot | null {
  if (!rows?.length) return null
  return rows[0] ?? null
}

function dateLocaleTag(locale: string): string {
  return locale.startsWith('ar') ? 'ar-SA' : 'en-US'
}

/**
 * Spec 05-B DEF-04/06 — honest snapshot-present / absent / error states with AR/EN parity.
 *
 * The KPI grid, status/college charts, and PDF export that used to render here have
 * been replaced with `UniversityConsentGateState`: `university_dashboard_snapshot`
 * aggregates every student who selected this university, not only students who opted
 * in via `show_profile_in_university_stats` — the per-student consent boundary the
 * platform already enforces on individual profile reads. Until the aggregate is bound
 * to that same consent boundary, these numbers are not authorized to render as real
 * institutional intelligence (see DEPENDENCY_REQUIRED note in the design/UX evidence
 * report). This keeps identity (owner-scoped snapshot presence) and the honest
 * loading/error/empty states unchanged.
 */
export function UniversityDashboard() {
  const t = useTranslations('university.dashboard')
  const locale = useLocale()
  const query = useUniversityDashboard()

  const snapshot = useMemo(() => pickSnapshot(query.data), [query.data])

  useEffect(() => {
    if (!snapshot) return
    track('university_dashboard_viewed', { university_id: snapshot.university_id })
  }, [snapshot])

  if (query.isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-background p-6" role="status">
        <p className="text-foreground/60 text-sm">{t('loading')}</p>
      </section>
    )
  }

  if (query.isError) {
    return (
      <section
        className="rounded-2xl border border-border bg-background p-6"
        data-testid="university-dashboard-error"
      >
        <p className="text-sm text-destructive" role="alert">
          {t('error')}
        </p>
      </section>
    )
  }

  // Spec 05-B DEF-04: absent snapshot → EmptyUniversityState (not zero-filled KPIs).
  if (!snapshot) {
    return <EmptyUniversityState />
  }

  const refreshedLabel = new Date(snapshot.refreshed_at).toLocaleString(dateLocaleTag(locale), {
    numberingSystem: 'latn',
  })

  return (
    <div className="space-y-5" data-testid="university-dashboard-snapshot">
      <header className="rounded-2xl border border-border bg-background p-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-foreground/65 mt-1 text-sm">
          {t('refreshedAt')}: {refreshedLabel}
        </p>
      </header>

      <UniversityConsentGateState />
    </div>
  )
}
