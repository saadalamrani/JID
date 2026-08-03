import { getTranslations } from 'next-intl/server'
import { fetchCatalogDeadLetters, requireCatalogStaffAccess } from '@/lib/staff/catalog-operations'
import { DeadLetterRedrive } from '../_components/dead-letter-redrive'
export const dynamic = 'force-dynamic'
export default async function CatalogDeadLettersPage() {
  const [t, rows, actor] = await Promise.all([
    getTranslations('staff.catalog'),
    fetchCatalogDeadLetters(),
    requireCatalogStaffAccess(),
  ])
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('deadLetters')}</h1>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={String(row.id)} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{String(row.error_class)}</strong>
                <span>{String(row.retry_state)}</span>
              </div>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                {String(row.source_record_key ?? '—')}
              </p>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(row.sanitized_details, null, 2)}
              </pre>
              <DeadLetterRedrive id={String(row.id)} allowed={actor.role === 'super_admin'} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          {t('noDeadLetters')}
        </p>
      )}
    </main>
  )
}
