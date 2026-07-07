'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { STAFF_COMMITMENT_FLAG_THRESHOLD } from '@/lib/staff/entity-constants'
import type { StaffEntityListRow } from '@/types/staff-entities'
import { cn } from '@/lib/utils'

type EntitiesTableProps = {
  rows: StaffEntityListRow[]
  showCommitment?: boolean
}

export function EntitiesTable({ rows, showCommitment = true }: EntitiesTableProps) {
  const t = useTranslations('staff.entities.table')

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-jid-line bg-white p-8 text-center text-sm text-jid-ink/50">
        {t('empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-jid-line bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-jid-beige/50 text-start">
          <tr>
            <th className="px-4 py-3 font-medium">{t('columns.name')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.type')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.ownership')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.region')}</th>
            {showCommitment ? (
              <th className="px-4 py-3 font-medium">{t('columns.commitment')}</th>
            ) : null}
            <th className="px-4 py-3 font-medium">{t('columns.updated')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-jid-line">
          {rows.map((row) => {
            const lowCommitment = row.commitment_score < STAFF_COMMITMENT_FLAG_THRESHOLD
            return (
              <tr key={row.id} className="hover:bg-jid-beige/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/staff/entities/${row.id}`}
                    className="font-medium text-jid-olive hover:underline"
                  >
                    {row.name}
                  </Link>
                  {row.name_ar ? (
                    <p className="text-xs text-jid-ink/50">{row.name_ar}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{t(`types.${row.entity_type}`, { default: row.entity_type })}</td>
                <td className="px-4 py-3 text-jid-ink/70">
                  {row.ownership_type ? t(`ownership.${row.ownership_type}`, { default: row.ownership_type }) : '—'}
                </td>
                <td className="px-4 py-3 text-jid-ink/70">{row.region_name ?? '—'}</td>
                {showCommitment ? (
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'font-medium tabular-nums',
                        lowCommitment ? 'text-red-600' : 'text-jid-ink',
                      )}
                    >
                      {row.commitment_score.toFixed(1)}
                    </span>
                  </td>
                ) : null}
                <td className="px-4 py-3 text-jid-ink/70">
                  {new Date(row.updated_at).toLocaleDateString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
