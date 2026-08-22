'use client'

import { ShieldCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'

/**
 * Fail-closed institutional state for the University dashboard.
 *
 * `university_dashboard_snapshot` (Supabase materialized view) aggregates every
 * profile with a matching `university_id`, with no filter on
 * `show_profile_in_university_stats` — the same per-student consent flag that
 * gates individual row-level reads elsewhere (see `profiles_select_university_stats`
 * RLS policy). Ownership/identity scoping to this university IS reconciled and
 * correct (`university_profiles.owner_user_id`); the aggregate figures themselves
 * are not yet consent-scoped, so they are not authorized to render as real
 * institutional intelligence. This is a presentational fail-closed state only —
 * no query, RLS, or migration change. See DEPENDENCY_REQUIRED note in the
 * design/UX evidence report.
 */
export function UniversityConsentGateState() {
  const t = useTranslations('university.dashboard.consentGate')

  return (
    <section
      className="rounded-2xl border border-border bg-background p-8"
      data-testid="university-dashboard-consent-gate"
    >
      <div className="flex items-start gap-4">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
              {t('description')}
            </p>
          </div>

          <div className="border-s-2 border-accent/50 ps-4">
            <p className="text-sm font-medium text-foreground">{t('methodologyTitle')}</p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-foreground/70">
              {t('methodologyBody')}
            </p>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t('nextAction')}
          </p>

          <Link
            href="/university/profile"
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-jid-beige/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('cta')}
          </Link>
        </div>
      </div>
    </section>
  )
}
