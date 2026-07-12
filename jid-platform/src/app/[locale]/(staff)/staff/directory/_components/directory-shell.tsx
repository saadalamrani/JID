'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import type { StaffDirectoryRow } from '@/lib/staff/directory-queries'
import type { StaffRegionOption, StaffSectorOption } from '@/types/staff-entities'
import { DirectoryEditorModal } from './directory-editor-modal'

type DirectoryShellProps = {
  rows: StaffDirectoryRow[]
  total: number
  sectors: StaffSectorOption[]
  regions: StaffRegionOption[]
  initialQ?: string
}

export function DirectoryShell({
  rows,
  total,
  sectors,
  regions,
  initialQ = '',
}: DirectoryShellProps) {
  const t = useTranslations('staff.directory')
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [editorRow, setEditorRow] = useState<StaffDirectoryRow | null | 'create'>(null)

  function applySearch() {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    router.push(`/staff/directory?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setEditorRow('create')}>{t('create')}</Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="h-10 min-w-[16rem] flex-1 rounded-md border border-border px-3 text-sm"
        />
        <Button type="button" variant="outline" onClick={applySearch}>
          {t('search')}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{t('count', { count: total })}</p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">{t('table.name')}</th>
              <th className="px-4 py-3 font-medium">{t('table.sector')}</th>
              <th className="px-4 py-3 font-medium">{t('table.region')}</th>
              <th className="px-4 py-3 font-medium">{t('table.active')}</th>
              <th className="px-4 py-3 font-medium">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{row.name_ar ?? row.name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {row.name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.sector_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.region_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {row.is_active ? t('table.yes') : t('table.no')}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => setEditorRow(row)}>
                      {t('edit')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editorRow !== null ? (
        <DirectoryEditorModal
          row={editorRow === 'create' ? null : editorRow}
          sectors={sectors}
          regions={regions}
          onClose={() => setEditorRow(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}
    </div>
  )
}
