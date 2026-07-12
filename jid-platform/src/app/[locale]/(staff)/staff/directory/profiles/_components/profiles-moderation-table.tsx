'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Link } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { reinstateProfileAction, suspendProfileAction } from '@/app/[locale]/(staff)/staff/directory/actions'
import type { ModerationProfileRow } from '@/lib/staff/directory-queries'

type ProfilesModerationTableProps = {
  rows: ModerationProfileRow[]
  initialQ?: string
}

export function ProfilesModerationTable({ rows, initialQ = '' }: ProfilesModerationTableProps) {
  const t = useTranslations('staff.directory.profiles')
  const [q, setQ] = useState(initialQ)
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function auditHref(row: ModerationProfileRow): string {
    const params = new URLSearchParams({
      entity_type: `${row.profileType}_profile`,
      entity_id: row.id,
    })
    return `/staff/audit?${params.toString()}`
  }

  async function handleSuspend(row: ModerationProfileRow) {
    const reason = (reasonById[row.id] ?? '').trim()
    if (reason.length < 3) {
      toast.error(t('reasonRequired'))
      return
    }
    const result = await suspendProfileAction({
      profileId: row.id,
      profileType: row.profileType,
      reason,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('suspended'))
    startTransition(() => window.location.reload())
  }

  async function handleReinstate(row: ModerationProfileRow, targetStatus: 'draft' | 'published') {
    const result = await reinstateProfileAction({
      profileId: row.id,
      profileType: row.profileType,
      targetStatus,
      reason: reasonById[row.id]?.trim() || undefined,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(t('reinstated'))
    startTransition(() => window.location.reload())
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const params = new URLSearchParams()
          if (q.trim()) params.set('q', q.trim())
          window.location.href = `/staff/directory/profiles?${params.toString()}`
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="h-10 min-w-[16rem] flex-1 rounded-md border border-border px-3 text-sm"
        />
        <Button type="submit" variant="outline">
          {t('search')}
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">{t('table.profile')}</th>
              <th className="px-4 py-3 font-medium">{t('table.type')}</th>
              <th className="px-4 py-3 font-medium">{t('table.status')}</th>
              <th className="px-4 py-3 font-medium">{t('table.owner')}</th>
              <th className="px-4 py-3 font-medium">{t('table.directory')}</th>
              <th className="px-4 py-3 font-medium">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.profileType}-${row.id}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{row.displayName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.profileType}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.ownerName ?? row.ownerUserId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.directoryName}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <Label className="text-xs">{t('reasonLabel')}</Label>
                      <input
                        value={reasonById[row.id] ?? ''}
                        onChange={(e) =>
                          setReasonById((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        placeholder={t('reasonPlaceholder')}
                        className="h-9 w-full min-w-[12rem] rounded-md border border-border px-2 text-xs"
                      />
                      <div className="flex flex-wrap gap-1">
                        {row.status !== 'suspended' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => handleSuspend(row)}
                          >
                            {t('suspend')}
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() => handleReinstate(row, 'draft')}
                            >
                              {t('reinstateDraft')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => handleReinstate(row, 'published')}
                            >
                              {t('reinstatePublished')}
                            </Button>
                          </>
                        )}
                        <Link
                          href={auditHref(row)}
                          className="inline-flex h-8 items-center rounded-md border border-border px-2 text-xs text-primary hover:bg-muted"
                        >
                          {t('audit')}
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
