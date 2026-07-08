import { getTranslations } from 'next-intl/server'
import { SessionList } from '@/components/auth/session-list'

export default async function SessionsSettingsPage() {
  const t = await getTranslations('auth.sessions')

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <SessionList />
    </div>
  )
}
