import { getTranslations } from 'next-intl/server'
import { ConfigGroupedList } from '@/app/[locale]/(sys)/sys/config/_components/config-grouped-list'
import {
  fetchPlatformConfigRows,
  groupPlatformConfigByCategory,
} from '@/lib/sys/platform-config-queries'

export default async function SysConfigPage() {
  const t = await getTranslations('sys.config')
  const rows = await fetchPlatformConfigRows()
  const grouped = groupPlatformConfigByCategory(rows)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ConfigGroupedList grouped={grouped} />
      )}
    </div>
  )
}
