import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import type { SysEntityListRow } from '@/types/sys-entities'
import { cn } from '@/lib/utils'

type EntitiesTableProps = {
  rows: SysEntityListRow[]
}

export function EntitiesTable({ rows }: EntitiesTableProps) {
  const t = useTranslations('sys.entities.table')

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
            <th className="px-4 py-3 font-medium">{t('columns.state')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.verified')}</th>
            <th className="px-4 py-3 font-medium">{t('columns.updated')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-jid-line">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-jid-beige/30">
              <td className="px-4 py-3">
                <Link href={`/sys/entities/${row.id}`} className="font-medium text-jid-olive hover:underline">
                  {row.name}
                </Link>
                {row.name_ar ? <p className="text-xs text-jid-ink/50">{row.name_ar}</p> : null}
              </td>
              <td className="px-4 py-3">{t(`types.${row.entity_type}`, { default: row.entity_type })}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    row.entity_state === 'approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : row.entity_state === 'suspended'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-jid-beige text-jid-ink/70',
                  )}
                >
                  {t(`states.${row.entity_state}`, { default: row.entity_state })}
                </span>
              </td>
              <td className="px-4 py-3">{row.is_verified ? t('yes') : t('no')}</td>
              <td className="px-4 py-3 text-jid-ink/70">
                {new Date(row.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
