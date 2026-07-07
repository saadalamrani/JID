import { getTranslations } from 'next-intl/server'
import { BouncesTable } from '@/app/[locale]/(sys)/sys/system/notifications/_components/bounces-table'
import { EmailLogsTable } from '@/app/[locale]/(sys)/sys/system/notifications/_components/email-logs-table'
import { EmailQuotaCard } from '@/app/[locale]/(sys)/sys/system/notifications/_components/email-quota-card'
import { fetchNotificationsHealthSnapshot } from '@/lib/sys/notifications-health-queries'

export default async function SysNotificationsHealthPage() {
  const t = await getTranslations('sys.notificationsHealth')
  const { quota, logs, bounces } = await fetchNotificationsHealthSnapshot()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
        <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
      </header>

      <EmailQuotaCard
        quota={quota}
        circuitBanner={t('circuitBanner')}
        dailyLabel={t('quota.daily')}
        monthlyLabel={t('quota.monthly')}
        usedLabel={t('quota.used')}
        limitLabel={t('quota.limit')}
        remainingLabel={t('quota.remaining')}
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-jid-ink">{t('logsTitle')}</h2>
          <p className="text-sm text-jid-ink/60">{t('logsSubtitle', { count: logs.length })}</p>
        </div>
        <EmailLogsTable
          logs={logs}
          columns={{
            destination: t('logs.columns.destination'),
            status: t('logs.columns.status'),
            category: t('logs.columns.category'),
            attempted: t('logs.columns.attempted'),
            sent: t('logs.columns.sent'),
            error: t('logs.columns.error'),
            empty: t('logs.empty'),
          }}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-jid-ink">{t('bouncesTitle')}</h2>
          <p className="text-sm text-jid-ink/60">{t('bouncesSubtitle', { count: bounces.length })}</p>
        </div>
        <BouncesTable
          bounces={bounces}
          columns={{
            email: t('bounces.columns.email'),
            type: t('bounces.columns.type'),
            count: t('bounces.columns.count'),
            firstSeen: t('bounces.columns.firstSeen'),
            lastSeen: t('bounces.columns.lastSeen'),
            empty: t('bounces.empty'),
          }}
        />
      </section>
    </div>
  )
}

export async function generateMetadata() {
  const t = await getTranslations('sys.notificationsHealth')
  return { title: t('title') }
}
