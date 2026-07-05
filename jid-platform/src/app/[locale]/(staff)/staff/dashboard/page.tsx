import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function StaffDashboardPage() {
  const t = await getTranslations('staff.dashboard')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-2 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('claimsCard.title')}</CardTitle>
            <CardDescription>{t('claimsCard.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/staff/claims/queue"
              className="inline-flex text-sm font-medium text-jid-olive underline-offset-4 hover:underline"
            >
              {t('claimsCard.cta')}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
