import { getTranslations } from 'next-intl/server'
import { FlagsGroupedList } from '@/app/[locale]/(sys)/sys/flags/_components/flags-grouped-list'
import { fetchFeatureFlags, groupFeatureFlagsByCategory } from '@/lib/sys/feature-flags'

export default async function SysFeatureFlagsPage() {
  const t = await getTranslations('sys.flags')
  const flags = await fetchFeatureFlags()
  const grouped = groupFeatureFlagsByCategory(flags)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </header>

      <FlagsGroupedList grouped={grouped} />
    </div>
  )
}
