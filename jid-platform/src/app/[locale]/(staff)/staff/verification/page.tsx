import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { VerificationListWithFilters } from './_components/verification-list'
import { RealtimeVerificationUpdater } from './_components/realtime-verification-updater'
import { VerificationKanban } from './_components/verification-kanban'
import {
  fetchPendingClaimsQueue,
  fetchVerificationKanbanBuckets,
} from '@/lib/staff/claims-queue'

export const revalidate = 60

/** P-108 — verification review queue (verification_requests + mentor applications). */
export default async function StaffVerificationPage() {
  const t = await getTranslations('staff.verification')
  const [items, buckets] = await Promise.all([
    fetchPendingClaimsQueue(100),
    fetchVerificationKanbanBuckets(),
  ])

  return (
    <div className="space-y-6">
      <RealtimeVerificationUpdater />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/staff/verification/my-queue" className="text-primary hover:underline">
            {t('nav.myQueue')}
          </Link>
          <Link href="/staff/verification/history" className="text-primary hover:underline">
            {t('nav.history')}
          </Link>
        </nav>
      </header>

      <VerificationKanban
        pending={buckets.pending}
        overdue={buckets.overdue}
        completedToday={buckets.completedToday}
      />

      <p className="text-sm text-muted-foreground">{t('count', { count: items.length })}</p>

      <VerificationListWithFilters items={items} />
    </div>
  )
}
