import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { fetchCatalogOverview, requireCatalogStaffAccess } from '@/lib/staff/catalog-operations'
import { CatalogAdminControls } from './_components/catalog-admin-controls'

export const dynamic = 'force-dynamic'

export default async function StaffCatalogPage() {
  const t = await getTranslations('staff.catalog')
  const [data, actor] = await Promise.all([fetchCatalogOverview(), requireCatalogStaffAccess()])
  const ingestion = data.flags['catalog.phase1_ingestion'] === true
  const connector = data.flags['catalog.gleif_connector_enabled'] === true
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t('coverage')}</p>
      </header>
      <nav aria-label={t('navLabel')} className="flex flex-wrap gap-3 text-sm">
        <Link className="text-primary hover:underline" href="/staff/catalog/review">
          {t('reviewQueue')}
        </Link>
        <Link className="text-primary hover:underline" href="/staff/catalog/runs">
          {t('runs')}
        </Link>
        <Link className="text-primary hover:underline" href="/staff/catalog/dead-letters">
          {t('deadLetters')}
        </Link>
      </nav>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('liveState')}>
        <State label={t('ingestionFlag')} value={ingestion ? t('enabled') : t('disabled')} />
        <State label={t('connectorFlag')} value={connector ? t('enabled') : t('disabled')} />
        <State label={t('openReviews')} value={String(data.openReviews)} />
        <State label={t('openDeadLetters')} value={String(data.openDeadLetters)} />
      </section>
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">{t('sourceHealth')}</h2>
        {data.source ? (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Pair label={t('source')} value={data.source.display_name} />
            <Pair label={t('lifecycle')} value={data.source.lifecycle_state} />
            <Pair label={t('health')} value={data.source.health_state} />
            <Pair label={t('lastSuccess')} value={data.source.last_successful_sync ?? t('never')} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t('sourceMissing')}</p>
        )}
      </section>
      <CatalogAdminControls isSuperAdmin={actor.role === 'super_admin'} />
      <section>
        <h2 className="font-semibold">{t('recentRuns')}</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-start text-sm">
            <thead className="bg-muted">
              <tr>
                <Th>{t('runId')}</Th>
                <Th>{t('status')}</Th>
                <Th>{t('retrieved')}</Th>
                <Th>{t('accepted')}</Th>
                <Th>{t('started')}</Th>
              </tr>
            </thead>
            <tbody>
              {data.runs.length ? (
                data.runs.map((run) => (
                  <tr className="border-t border-border" key={run.id}>
                    <Td>{run.external_run_id ?? run.id}</Td>
                    <Td>{run.status}</Td>
                    <Td>{String(run.retrieved_count)}</Td>
                    <Td>{String(run.accepted_count)}</Td>
                    <Td>{run.started_at}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <Td colSpan={5}>{t('noRuns')}</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function State({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}
function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  )
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-start font-medium">{children}</th>
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className="px-3 py-2 align-top">
      {children}
    </td>
  )
}
