import { Link } from '@/lib/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { CompanyLogo } from '@/app/[locale]/(public)/catalog/_components/company-logo'
import type { OwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import type {
  CompanyDashboardMetrics,
  DashboardMetricResult,
} from '@/lib/queries/company-dashboard-metrics'
import { BriefcaseBusiness, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

type CompanyDashboardProps = {
  profile: OwnerBusinessProfile | null
  metrics?: CompanyDashboardMetrics | null
}

function statusPillClass(status: string) {
  switch (status) {
    case 'published':
      return 'border-primary/30 bg-primary/10 text-primary'
    case 'draft':
      return 'border-accent/40 bg-accent/15 text-foreground'
    case 'suspended':
      return 'border-destructive/40 bg-destructive/10 text-destructive'
    default:
      return 'border-border bg-background text-foreground/70'
  }
}

function MetricCard({
  label,
  result,
  valueLabel,
  errorLabel,
  testId,
}: {
  label: string
  result: DashboardMetricResult
  valueLabel: (value: number) => string
  errorLabel: string
  testId: string
}) {
  if (result.status === 'error') {
    return (
      <article
        className="rounded-2xl border border-border bg-background/60 p-4"
        data-testid={testId}
        data-metric-state="error"
        aria-label={`${label}: ${errorLabel}`}
      >
        <p className="text-sm font-medium text-foreground/75">{label}</p>
        <p className="mt-2 text-sm text-destructive" role="status">
          {errorLabel}
        </p>
      </article>
    )
  }

  const display = valueLabel(result.value)
  return (
    <article
      className="rounded-2xl border border-border bg-background/60 p-4"
      data-testid={testId}
      data-metric-state="ok"
      data-metric-value={String(result.value)}
      aria-label={`${label}: ${display}`}
    >
      <p className="text-sm font-medium text-foreground/75">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{display}</p>
    </article>
  )
}

/** Spec 08-B — honest Business dashboard: real owner-scoped counts or distinct error states. */
export async function CompanyDashboard({ profile, metrics = null }: CompanyDashboardProps) {
  const t = await getTranslations('company.dashboard')

  if (!profile) {
    return (
      <section className="space-y-3 rounded-2xl border border-border bg-background p-6">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-foreground/70">{t('noProfile')}</p>
        <Link
          href="/company/create-profile"
          className="inline-flex min-h-11 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('createProfileCta')}
        </Link>
      </section>
    )
  }

  const quickLinks = [
    { href: '/jobs', label: t('links.jobs'), icon: BriefcaseBusiness },
    { href: '/company/profile/edit', label: t('links.settings'), icon: Settings },
  ] as const

  // next-intl has no `defaultValue` translator option — silently ignored. All three
  // current status values have a matching key, but this keeps the fallback real if that
  // ever drifts.
  const statusLabel = ['draft', 'published', 'suspended'].includes(profile.status)
    ? t(`status.${profile.status}`)
    : profile.status

  return (
    <section className="space-y-6" data-testid="company-dashboard">
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-background p-6">
        <CompanyLogo
          name={profile.display_name_ar}
          logoUrl={profile.directory_logo_url}
          className="h-14 w-14"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-foreground">{profile.display_name_ar}</h1>
          {profile.tagline_ar ? (
            <p className="mt-1 text-sm text-foreground/70">{profile.tagline_ar}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium',
            statusPillClass(profile.status),
          )}
          data-testid="company-dashboard-status"
        >
          {statusLabel}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-2" data-testid="company-dashboard-metrics">
        {metrics ? (
          <>
            <MetricCard
              label={t('metrics.jobsPosted')}
              result={metrics.jobsPosted}
              valueLabel={(value) => t('metrics.value', { count: value })}
              errorLabel={t('metrics.error')}
              testId="company-metric-jobs-posted"
            />
            <MetricCard
              label={t('metrics.applicationsReceived')}
              result={metrics.applicationsReceived}
              valueLabel={(value) => t('metrics.value', { count: value })}
              errorLabel={t('metrics.error')}
              testId="company-metric-applications-received"
            />
          </>
        ) : (
          <p className="text-sm text-foreground/70 sm:col-span-2" role="status">
            {t('metrics.loading')}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
