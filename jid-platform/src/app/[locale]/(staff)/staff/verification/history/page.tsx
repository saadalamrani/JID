import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { ClaimsListWithFilters } from '../../claims/_components/claims-list'
import { fetchMyClaimsHistory } from '@/lib/staff/claims-queue'

export default async function VerificationHistoryPage() {
  const t = await getTranslations('staff.verification.history')
  const items = await fetchMyClaimsHistory(100)

  return (
    <div className="space-y-6">
      <header>
        <Link href="/staff/verification" className="text-sm text-primary hover:underline">
          {t('backToQueue')}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <ClaimsListWithFilters items={items} showAssignment={false} />
    </div>
  )
}
