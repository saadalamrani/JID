import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { ClaimsListWithFilters } from './_components/claims-list'
import { RealtimeClaimsUpdater } from './_components/realtime-claims-updater'
import { fetchPendingClaimsQueue } from '@/lib/staff/claims-queue'

export const revalidate = 60

/** Section 7.2 — unified pending claims queue (server-fetched top 100). */
export default async function StaffClaimsPage() {
  const t = await getTranslations('staff.claims')
  const items = await fetchPendingClaimsQueue(100)

  return (
    <div className="space-y-6">
      <RealtimeClaimsUpdater />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm">
          <Link href="/staff/claims/my-queue" className="text-primary hover:underline">
            {t('nav.myQueue')}
          </Link>
          <Link href="/staff/claims/history" className="text-primary hover:underline">
            {t('nav.history')}
          </Link>
        </nav>
      </header>

      <p className="text-sm text-muted-foreground">{t('count', { count: items.length })}</p>

      <ClaimsListWithFilters items={items} />
    </div>
  )
}
