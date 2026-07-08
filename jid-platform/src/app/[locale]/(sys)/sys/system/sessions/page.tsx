import { getTranslations } from 'next-intl/server'
import { SessionsTable } from '@/app/[locale]/(sys)/sys/system/sessions/_components/sessions-table'
import { fetchAllActiveSessions } from '@/lib/sys/sessions-admin-queries'

export default async function SysSessionsPage() {
  const t = await getTranslations('sys.sessions')
  const sessions = await fetchAllActiveSessions()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <SessionsTable sessions={sessions} />
    </div>
  )
}
