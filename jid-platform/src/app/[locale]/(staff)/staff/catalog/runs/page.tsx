import { getTranslations } from 'next-intl/server'
import { fetchCatalogRuns } from '@/lib/staff/catalog-operations'
export const dynamic = 'force-dynamic'
export default async function CatalogRunsPage() {
  const [t, runs] = await Promise.all([getTranslations('staff.catalog'), fetchCatalogRuns()])
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('runs')}</h1>
      {runs.length ? (
        <ul className="space-y-3">
          {runs.map((run) => (
            <li key={run.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{run.external_run_id ?? run.id}</strong>
                <span>{run.status}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('retrieved')}: {run.retrieved_count} · {t('accepted')}: {run.accepted_count} ·{' '}
                {t('skipped')}: {run.skipped_count} · {t('retries')}: {run.retry_count}
              </p>
              {run.failure_detail && (
                <p className="mt-2 text-sm text-destructive">
                  {run.failure_class}: {run.failure_detail}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{t('noRuns')}</p>
      )}
    </main>
  )
}
