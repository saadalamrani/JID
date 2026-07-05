'use client'

import { useTranslations } from 'next-intl'
import { ClaimsList } from '@/app/[locale]/(staff)/_components/claims-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useClaimsQueue } from '@/hooks/use-claims-queue'
import { Link } from '@/lib/i18n/navigation'

export default function ClaimsQueuePage() {
  const t = useTranslations('staff.claimsQueue')
  const { data, isLoading, isError, error } = useClaimsQueue()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-2 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('stats.pending')} value={data?.stats.pending ?? 0} loading={isLoading} />
        <StatCard
          label={t('stats.overdue')}
          value={data?.stats.overdue ?? 0}
          loading={isLoading}
          variant="danger"
        />
        <StatCard label={t('stats.completedToday')} value={data?.stats.completedToday ?? 0} loading={isLoading} />
      </div>

      {isError ? (
        <p className="text-sm text-red-600">{error instanceof Error ? error.message : t('error')}</p>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-jid-ink">{t('listTitle')}</h2>
          <Link href="/staff/dashboard" className="text-sm text-jid-olive hover:underline">
            {t('backToDashboard')}
          </Link>
        </div>
        <ClaimsList claims={data?.claims ?? []} loading={isLoading} />
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  loading,
  variant = 'default',
}: {
  label: string
  value: number
  loading: boolean
  variant?: 'default' | 'danger'
}) {
  return (
    <Card className={variant === 'danger' && value > 0 ? 'border-red-200' : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-jid-ink/70">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            variant === 'danger' && value > 0
              ? 'text-3xl font-semibold text-red-600'
              : 'text-3xl font-semibold text-jid-ink'
          }
        >
          {loading ? '—' : value}
        </p>
      </CardContent>
    </Card>
  )
}
