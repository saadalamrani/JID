'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useTransition } from 'react'
import type { SysUserRoleFilter, SysUserStatusFilter } from '@/types/sys-users'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const ROLE_FILTER_OPTIONS: SysUserRoleFilter[] = [
  'all',
  'individual',
  'mentor',
  'company_admin',
  'university_admin',
  'staff',
  'admin',
  'super_admin',
]

const STATUS_FILTER_OPTIONS: SysUserStatusFilter[] = ['all', 'active', 'suspended']

/** Section 8.1 — search + role + status filters (URL-driven). */
export function UsersFilters() {
  const t = useTranslations('sys.users.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const role = (searchParams.get('role') as SysUserRoleFilter | null) ?? 'all'
  const status = (searchParams.get('status') as SysUserStatusFilter | null) ?? 'all'

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      params.delete('page')
      startTransition(() => {
        router.push(`/sys/users?${params.toString()}`)
      })
    },
    [router, searchParams],
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
          status: String(formData.get('status') ?? 'all'),
        })
      }}
    >
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="users-q">{t('search')}</Label>
        <Input id="users-q" name="q" defaultValue={q} placeholder={t('searchPlaceholder')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="users-role">{t('role')}</Label>
        <select
          id="users-role"
          name="role"
          defaultValue={role}
          className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm"
        >
          {ROLE_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`roles.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="users-status">{t('status')}</Label>
        <select
          id="users-status"
          name="status"
          defaultValue={status}
          className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm"
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
