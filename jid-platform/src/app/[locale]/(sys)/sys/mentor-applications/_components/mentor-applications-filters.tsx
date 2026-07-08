'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useTransition } from 'react'
import type { SysMentorStatusFilter } from '@/types/sys-mentor-applications'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const STATUS_OPTIONS: SysMentorStatusFilter[] = [
  'all',
  'pending_review',
  'under_review',
  'approved',
  'rejected',
  'suspended',
]

export function MentorApplicationsFilters() {
  const t = useTranslations('sys.mentorApplications.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') as SysMentorStatusFilter | null) ?? 'all'

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      params.delete('page')
      startTransition(() => router.push(`/sys/mentor-applications?${params.toString()}`))
    },
    [router, searchParams],
  )

  return (
    <form
      className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        pushParams({
          q: String(formData.get('q') ?? '').trim() || null,
          status: String(formData.get('status') ?? 'all'),
        })
      }}
    >
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="mentor-q">{t('search')}</Label>
        <Input id="mentor-q" name="q" defaultValue={q} placeholder={t('searchPlaceholder')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="mentor-status">{t('status')}</Label>
        <select
          id="mentor-status"
          name="status"
          defaultValue={status}
          className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`statuses.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? t('applying') : t('apply')}
        </Button>
      </div>
    </form>
  )
}
