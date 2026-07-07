'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useTransition } from 'react'
import { STAFF_USER_ROLE_FILTERS, type StaffUserStatusFilter } from '@/types/staff-users'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const STATUS_FILTER_OPTIONS: StaffUserStatusFilter[] = ['all', 'active', 'suspended']

type UsersFiltersProps = {
  basePath?: string
  lockStatus?: StaffUserStatusFilter
}

/** Section 8 — bounded search + role (individual/mentor) + status filters. */
export function UsersFilters({ basePath = '/staff/users', lockStatus }: UsersFiltersProps) {
  const t = useTranslations('staff.users.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const role = searchParams.get('role') ?? 'all'
  const status = lockStatus ?? (searchParams.get('status') as StaffUserStatusFilter | null) ?? 'all'

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      if (lockStatus) params.set('status', lockStatus)
      params.delete('page')
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`)
      })
    },
    [basePath, lockStatus, router, searchParams],
  )

  return (
    <form
      className="grid gap-4 rounded-lg border border-jid-line bg-white p-4 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        pushParams({
          q: String(formData.get('q') ?? '').trim() || null,
          role: String(formData.get('role') ?? 'all'),
          status: lockStatus ?? String(formData.get('status') ?? 'all'),
        })
      }}
    >
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="staff-users-q">{t('search')}</Label>
        <Input id="staff-users-q" name="q" defaultValue={q} placeholder={t('searchPlaceholder')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="staff-users-role">{t('role')}</Label>
        <select
          id="staff-users-role"
          name="role"
          defaultValue={role}
          className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm"
        >
          {STAFF_USER_ROLE_FILTERS.map((option) => (
            <option key={option} value={option}>
              {t(`roles.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="staff-users-status">{t('status')}</Label>
        <select
          id="staff-users-status"
          name="status"
          defaultValue={status}
          disabled={Boolean(lockStatus)}
          className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm disabled:opacity-60"
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`statuses.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-4">
        <Button type="submit" disabled={pending}>
          {pending ? t('applying') : t('apply')}
        </Button>
      </div>
    </form>
  )
}
