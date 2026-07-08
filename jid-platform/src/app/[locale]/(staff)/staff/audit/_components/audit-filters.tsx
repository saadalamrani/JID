'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useTransition } from 'react'
import { listStaffAuditActionFilterOptions } from '@/lib/staff/audit-action-options'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/** Section 11 — action_type + date range filters (URL-driven, actor always self). */
export function AuditFilters() {
  const t = useTranslations('staff.audit.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const actionType = searchParams.get('action_type') ?? 'all'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const actionOptions = listStaffAuditActionFilterOptions()

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      params.delete('before')
      startTransition(() => router.push(`/staff/audit?${params.toString()}`))
    },
    [router, searchParams],
  )

  return (
    <form
      className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        pushParams({
          action_type: String(formData.get('action_type') ?? 'all'),
          from: String(formData.get('from') ?? '').trim() || null,
          to: String(formData.get('to') ?? '').trim() || null,
        })
      }}
    >
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="staff-audit-action">{t('actionType')}</Label>
        <select
          id="staff-audit-action"
          name="action_type"
          defaultValue={actionType}
          className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
        >
          <option value="all">{t('allActions')}</option>
          {actionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="staff-audit-from">{t('from')}</Label>
        <Input id="staff-audit-from" name="from" type="date" defaultValue={from} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="staff-audit-to">{t('to')}</Label>
        <Input id="staff-audit-to" name="to" type="date" defaultValue={to} />
      </div>

      <div className="flex items-end md:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? t('applying') : t('apply')}
        </Button>
      </div>
    </form>
  )
}
