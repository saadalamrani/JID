import { getTranslations } from 'next-intl/server'
import { PreferencesForm } from '@/app/[locale]/settings/notifications/_components/preferences-form'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { CATEGORY_GROUPS } from '@/lib/notifications/category-groups'
import { fetchUserNotificationPreferences } from '@/lib/notifications/preference-queries'

export default async function NotificationPreferencesPage() {
  const t = await getTranslations('settings.notifications')
  const userId = await requireAuthenticatedUser()
  const preferences = await fetchUserNotificationPreferences(userId)

  const matrixCategoryCount = CATEGORY_GROUPS.reduce(
    (sum, group) => sum + group.categories.length,
    0,
  )

  return (
    <main className="container-jid max-w-5xl py-8">
      <header className="mb-6">
        <h1 className="font-arabic text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/60">{t('subtitle')}</p>
      </header>

      <PreferencesForm initialPreferences={preferences} />

      <p className="sr-only">
        {t('matrixMeta', { count: matrixCategoryCount })} — {preferences.length}
      </p>
    </main>
  )
}

export async function generateMetadata() {
  const t = await getTranslations('settings.notifications')
  return { title: t('title') }
}
