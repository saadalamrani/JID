import { getTranslations } from 'next-intl/server'
import { FlagsList } from '@/app/[locale]/(staff)/staff/moderation/_components/flags-list'
import { fetchStaffOpenFlags } from '@/lib/staff/moderation-queries'

/** Section 10 — open content flags queue (oldest first). */
export default async function StaffModerationPage() {
  const t = await getTranslations('staff.moderation')
  const flags = await fetchStaffOpenFlags()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t('openCount', { count: flags.length })}</p>
      </header>

      <FlagsList flags={flags} />
    </div>
  )
}
