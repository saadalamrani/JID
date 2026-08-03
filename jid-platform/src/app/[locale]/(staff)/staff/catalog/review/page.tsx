import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import { fetchCatalogQueue } from '@/lib/staff/catalog-operations'

type Props = {
  searchParams: Promise<{
    q?: string
    state?: string
    outcome?: string
    flag?: string
    run?: string
    sort?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function CatalogReviewQueuePage({ searchParams }: Props) {
  const [t, params, rows] = await Promise.all([
    getTranslations('staff.catalog'),
    searchParams,
    fetchCatalogQueue(),
  ])
  const q = params.q?.trim().toLowerCase()
  const filtered = rows.filter(
    (row) =>
      (!q ||
        row.candidate.normalized_identity.toLowerCase().includes(q) ||
        row.candidate.lei?.toLowerCase() === q) &&
      (!params.state || params.state === 'all' || row.status === params.state) &&
      (!params.outcome ||
        params.outcome === 'all' ||
        row.candidate.match_outcome === params.outcome) &&
      (!params.flag || params.flag === 'all' || row.candidate.review_flags.includes(params.flag)) &&
      (!params.run || row.candidate.run_id === params.run),
  )
  if (params.sort === 'newest') filtered.reverse()
  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">{t('reviewQueue')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('reviewSubtitle')}</p>
      </header>
      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <label className="lg:col-span-2">
          <span className="text-xs text-muted-foreground">{t('search')}</span>
          <input
            name="q"
            defaultValue={params.q}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <Select
          name="state"
          label={t('state')}
          value={params.state}
          options={[
            'all',
            'pending',
            'in_review',
            'approved_pending_domain',
            'approved',
            'rejected',
            'returned',
            'quarantined',
            'published',
          ]}
        />
        <Select
          name="outcome"
          label={t('matchOutcome')}
          value={params.outcome}
          options={[
            'all',
            'new',
            'update_existing',
            'ambiguous',
            'duplicate_candidate',
            'quarantined',
          ]}
        />
        <Select
          name="flag"
          label={t('flags')}
          value={params.flag}
          options={[
            'all',
            'lapsed_registration',
            'domain_conflict',
            'jurisdiction_mismatch',
            'no_domain',
            'inactive_entity',
            'ambiguous_match',
          ]}
        />
        <Select name="sort" label={t('sort')} value={params.sort} options={['oldest', 'newest']} />
        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground sm:col-span-2 lg:col-span-1">
          {t('applyFilters')}
        </button>
      </form>
      <p className="text-sm text-muted-foreground">
        {t('resultCount', { count: filtered.length })}
      </p>
      {filtered.length ? (
        <ul className="space-y-3">
          {filtered.map((row) => (
            <li key={row.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/staff/catalog/review/${row.candidate_id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {row.candidate.normalized_identity}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {row.candidate.lei ?? '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{row.status}</Badge>
                  <Badge>{row.candidate.match_outcome}</Badge>
                  {row.candidate.review_flags.map((flag) => (
                    <Badge key={flag}>{flag}</Badge>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {t('created')}: {row.created_at} · {t('assignee')}:{' '}
                {row.assigned_to ?? t('unassigned')}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          {t('emptyQueue')}
        </p>
      )}
    </main>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-muted px-2 py-1 text-xs">{children}</span>
  )
}
function Select({
  name,
  label,
  value,
  options,
}: {
  name: string
  label: string
  value?: string
  options: string[]
}) {
  return (
    <label>
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        name={name}
        defaultValue={value ?? options[0]}
        className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
