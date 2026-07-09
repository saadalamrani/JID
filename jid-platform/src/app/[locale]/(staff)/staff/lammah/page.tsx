import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { fetchStaffLammahModerationQueue } from '@/lib/staff/lammah-queries'
import { LammahReviewRow } from './_components/lammah-review-row'

export default async function StaffLammahPage() {
  const t = await getTranslations('staff.lammah')
  const queue = await fetchStaffLammahModerationQueue()

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('queueCount', { count: queue.length })}</p>
        </div>
        <Link
          href="/staff/lammah/sources"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t('manageSources')}
        </Link>
      </header>

      {queue.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </div>
      ) : (
        <ul className="grid gap-3">
          {queue.map((row) => (
            <li key={row.id}>
              <LammahReviewRow row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
