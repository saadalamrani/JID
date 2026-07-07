import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { ClaimsList } from '../_components/claims-list'
import { fetchMyClaimsHistory } from '@/lib/staff/claims-queue'

export const revalidate = 60

/** Section 7.2 — claims previously reviewed by the signed-in staff member. */
export default async function StaffClaimsHistoryPage() {
  const t = await getTranslations('staff.claims.history')
  const items = await fetchMyClaimsHistory(100)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
        </div>
        <Link href="/staff/claims" className="text-sm text-jid-olive hover:underline">
          {t('backToQueue')}
        </Link>
      </header>

      <ClaimsList items={items} showAssignment={false} />
    </div>
  )
}
