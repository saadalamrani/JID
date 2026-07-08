import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { ClaimsList } from '../_components/claims-list'
import { RealtimeClaimsUpdater } from '../_components/realtime-claims-updater'
import { fetchMyAssignedClaimsQueue } from '@/lib/staff/claims-queue'

export const revalidate = 60

/** Section 7.2 — claims assigned to the signed-in staff member. */
export default async function StaffMyClaimsQueuePage() {
  const t = await getTranslations('staff.claims.myQueue')
  const items = await fetchMyAssignedClaimsQueue(100)

  return (
    <div className="space-y-6">
      <RealtimeClaimsUpdater />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link href="/staff/claims" className="text-sm text-primary hover:underline">
          {t('backToQueue')}
        </Link>
      </header>

      <ClaimsList items={items} showAssignment={false} />
    </div>
  )
}
