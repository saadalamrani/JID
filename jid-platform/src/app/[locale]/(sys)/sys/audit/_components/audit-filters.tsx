'use client'

import { useSearchParams } from 'next/navigation'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useTransition } from 'react'
import { listAuditActionFilterOptions } from '@/lib/sys/audit-catalog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/** Section 10 — actor, action_type, date range filters (URL-driven). */
export function AuditFilters() {
  const t = useTranslations('sys.audit.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const actor = searchParams.get('actor') ?? ''
  const actionType = searchParams.get('action_type') ?? 'all'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const actionOptions = listAuditActionFilterOptions()

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      params.delete('before')
      startTransition(() => router.push(`/sys/audit?${params.toString()}`))
    },
    [router, searchParams],
  )

  return (
    <form
      className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-5"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        pushParams({
          actor: String(formData.get('actor') ?? '').trim() || null,
          action_type: String(formData.get('action_type') ?? 'all'),
          from: String(formData.get('from') ?? '').trim() || null,
          to: String(formData.get('to') ?? '').trim() || null,
        })
      }}
    >
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="audit-actor">{t('actor')}</Label>
        <Input
          id="audit-actor"
          name="actor"
          defaultValue={actor}
          placeholder={t('actorPlaceholder')}
        />
      </div>

      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="audit-action">{t('actionType')}</Label>
        <select
          id="audit-action"
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
        <Label htmlFor="audit-from">{t('from')}</Label>
        <Input id="audit-from" name="from" type="date" defaultValue={from} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="audit-to">{t('to')}</Label>
        <Input id="audit-to" name="to" type="date" defaultValue={to} />
      </div>

      <div className="flex flex-wrap items-end gap-2 md:col-span-5">
        <Button type="submit" disabled={pending}>
          {pending ? t('applying') : t('apply')}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/sys/audit/export?${searchParams.toString()}`}>{t('exportCsv')}</Link>
        </Button>
      </div>
    </form>
  )
}
