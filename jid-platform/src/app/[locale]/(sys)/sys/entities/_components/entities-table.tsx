import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { SysEntityListRow } from '@/types/sys-entities'
import { cn } from '@/lib/utils'

type EntitiesTableProps = {
  rows: SysEntityListRow[]
}

// next-intl has no `default`/`defaultValue` translator option (unlike i18next) — the same
// bug confirmed live on the equivalent Staff entities table ("staff.entities.table.types.
// business" rendered as raw text because only a stale 'company' key existed for the
// 'business' entity_type value). Explicit membership checks make the fallback real.
const KNOWN_ENTITY_TYPES = ['company', 'business', 'university'] as const
const KNOWN_ENTITY_STATES = ['unclaimed', 'pending', 'pending_review', 'approved', 'suspended'] as const

function entityTypeLabel(entityType: string, t: (key: string) => string): string {
  return (KNOWN_ENTITY_TYPES as readonly string[]).includes(entityType)
    ? t(`types.${entityType}`)
    : entityType
}

function entityStateLabel(entityState: string, t: (key: string) => string): string {
  return (KNOWN_ENTITY_STATES as readonly string[]).includes(entityState)
    ? t(`states.${entityState}`)
    : entityState
}

export function EntitiesTable({ rows }: EntitiesTableProps) {
  const t = useTranslations('sys.entities.table')

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead className="bg-background/50 text-start">
          <tr>
            <th className="px-4 py-3 font-medium">{t('columns.name')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.type')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.state')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.verified')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.updated')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-background/30">
              <td className="px-4 py-3">
                <Link href={`/sys/entities/${row.id}`} className="font-medium text-primary hover:underline">
                  {row.name}
                </Link>
                {row.name_ar ? <p className="text-xs text-muted-foreground">{row.name_ar}</p> : null}
              </td>
              <td className="px-4 py-3">{entityTypeLabel(row.entity_type, t)}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    row.entity_state === 'approved'
                      ? 'bg-primary/10 text-primary'
                      : row.entity_state === 'suspended'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-background text-muted-foreground',
                  )}
                >
                  {entityStateLabel(row.entity_state, t)}
                </span>
              </td>
              <td className="px-4 py-3">{row.is_verified ? t('yes') : t('no')}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(row.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
