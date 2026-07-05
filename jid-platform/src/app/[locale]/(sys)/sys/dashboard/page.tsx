import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SysDashboardPage() {
  const t = await getTranslations('sys.dashboard')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-2 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('staffCard.title')}</CardTitle>
            <CardDescription>{t('staffCard.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/sys/staff"
              className="text-sm font-medium text-jid-olive underline-offset-4 hover:underline"
            >
              {t('staffCard.viewStaff')}
            </Link>
            <Link
              href="/sys/staff/new"
              className="text-sm font-medium text-jid-olive underline-offset-4 hover:underline"
            >
              {t('staffCard.inviteStaff')}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
