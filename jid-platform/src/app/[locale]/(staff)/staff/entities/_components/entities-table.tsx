'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { StaffEntityListRow } from '@/types/staff-entities'

type EntitiesTableProps = {
  rows: StaffEntityListRow[]
}

export function EntitiesTable({ rows }: EntitiesTableProps) {
  const t = useTranslations('staff.entities.table')

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
            <th className="px-4 py-3 font-medium">{t('columns.ownership')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.region')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.updated')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-background/30">
              <td className="px-4 py-3">
                <Link
                  href={`/staff/entities/${row.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {row.name}
                </Link>
                {row.name_ar ? (
                  <p className="text-xs text-muted-foreground">{row.name_ar}</p>
                ) : null}
              </td>
              <td className="px-4 py-3">{t(`types.${row.entity_type}`, { default: row.entity_type })}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.ownership_type ? t(`ownership.${row.ownership_type}`, { default: row.ownership_type }) : '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.region_name ?? '—'}</td>
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
