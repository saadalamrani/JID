import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { AuditEventRow } from '@/app/[locale]/(sys)/sys/audit/_components/audit-event-row'
import { AuditFilters } from '@/app/[locale]/(sys)/sys/audit/_components/audit-filters'
import { fetchSysAuditTimeline } from '@/lib/sys/audit-queries'
import type { SysAuditFilters } from '@/types/sys-audit'

type SysAuditPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** Section 10 — global audit log with filters and cursor pagination. */
export default async function SysAuditPage({ searchParams }: SysAuditPageProps) {
  const t = await getTranslations('sys.audit')

  const filters: SysAuditFilters = {
    actor: readParam(searchParams.actor),
    actionType: readParam(searchParams.action_type),
    from: readParam(searchParams.from),
    to: readParam(searchParams.to),
    before: readParam(searchParams.before),
  }

  const result = await fetchSysAuditTimeline(filters)

  const nextParams = new URLSearchParams()
  if (filters.actor) nextParams.set('actor', filters.actor)
  if (filters.actionType && filters.actionType !== 'all') {
    nextParams.set('action_type', filters.actionType)
  }
  if (filters.from) nextParams.set('from', filters.from)
  if (filters.to) nextParams.set('to', filters.to)
  if (result.nextBefore) nextParams.set('before', result.nextBefore)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-jid-ink">{t('title')}</h1>
          <p className="mt-1 text-sm text-jid-ink/70">{t('subtitle')}</p>
        </div>
        <Link href="/sys/dashboard" className="text-sm text-jid-olive hover:underline">
          {t('back')}
        </Link>
      </header>

      <Suspense fallback={<div className="h-32 rounded-lg border border-jid-line bg-white" />}>
        <AuditFilters />
      </Suspense>

      {result.events.length === 0 ? (
        <div className="rounded-lg border border-jid-line bg-white p-8 text-center text-sm text-jid-ink/50">
          {t('empty')}
        </div>
      ) : (
        <ul className="space-y-3">
          {result.events.map((event) => (
            <li key={event.id}>
              <AuditEventRow event={event} />
            </li>
          ))}
        </ul>
      )}

      {result.hasMore && result.nextBefore ? (
        <div className="flex justify-center">
          <Link
            href={`/sys/audit?${nextParams.toString()}`}
            className="rounded-md border border-jid-line bg-white px-4 py-2 text-sm text-jid-olive hover:bg-jid-beige/40"
          >
            {t('loadMore')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
