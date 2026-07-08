import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { NotificationsFilters } from '@/app/[locale]/(individual)/notifications/_components/notifications-filters'
import { NotificationsList } from '@/app/[locale]/(individual)/notifications/_components/notifications-list'
import { NotificationsWorkspaceActions } from '@/app/[locale]/(individual)/notifications/_components/notifications-workspace-actions'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchUserNotifications } from '@/lib/notifications/queries'

type NotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const t = await getTranslations('notifications.page')
  const userId = await requireAuthenticatedUser()
  const params = await searchParams

  const status = readParam(params.status)
  const category = readParam(params.category)

  const notifications = await fetchUserNotifications(userId, { status, category })

  return (
    <main className="container-jid py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-arabic text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <NotificationsWorkspaceActions />
      </header>

      <div className="space-y-4">
        <Suspense fallback={<div className="h-28 rounded-lg border border-border bg-card" />}>
          <NotificationsFilters />
        </Suspense>

        <NotificationsList notifications={notifications} />
      </div>
    </main>
  )
}

export async function generateMetadata() {
  const t = await getTranslations('notifications.page')
  return { title: t('title') }
}
