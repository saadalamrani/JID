import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Info } from 'lucide-react'
import { StaffAnalyticsTracker } from '@/components/staff/staff-analytics-tracker'
import { AuditFilters } from '@/app/[locale]/(staff)/staff/audit/_components/audit-filters'
import { AuditTimeline } from '@/app/[locale]/(staff)/staff/audit/_components/audit-timeline'
import { fetchStaffPersonalAuditTimeline } from '@/lib/staff/audit-queries'
import type { StaffAuditFilters } from '@/types/staff-audit'

type StaffAuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Section 11 — personal audit log (own actions only). */
export default async function StaffAuditPage({ searchParams }: StaffAuditPageProps) {
  const t = await getTranslations('staff.audit')
  const params = await searchParams

  const filters: StaffAuditFilters = {
    actionType: readParam(params.action_type),
    entityType: readParam(params.entity_type),
    entityId: readParam(params.entity_id),
    from: readParam(params.from),
    to: readParam(params.to),
    before: readParam(params.before),
  }

  const result = await fetchStaffPersonalAuditTimeline(filters)

  const nextParams = new URLSearchParams()
  if (filters.actionType && filters.actionType !== 'all') {
    nextParams.set('action_type', filters.actionType)
  }
  if (filters.entityType) nextParams.set('entity_type', filters.entityType)
  if (filters.entityId) nextParams.set('entity_id', filters.entityId)
  if (filters.from) nextParams.set('from', filters.from)
  if (filters.to) nextParams.set('to', filters.to)
  if (result.nextBefore) nextParams.set('before', result.nextBefore)

  return (
    <div className="space-y-6">
      <StaffAnalyticsTracker event="staff.audit_viewed" />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link href="/staff" className="text-sm text-primary hover:underline">
          {t('back')}
        </Link>
      </header>

      <div
        role="status"
        className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>{t('scopeBanner')}</p>
      </div>

      <Suspense fallback={<div className="h-28 rounded-lg border border-border bg-card" />}>
        <AuditFilters />
      </Suspense>

      {result.events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </div>
      ) : (
        <AuditTimeline events={result.events} />
      )}

      {result.hasMore && result.nextBefore ? (
        <div className="flex justify-center">
          <Link
            href={`/staff/audit?${nextParams.toString()}`}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm text-primary hover:bg-background/40"
          >
            {t('loadMore')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
