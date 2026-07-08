'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useTransition } from 'react'
import type { SysEntityStateFilter, SysEntityTypeFilter } from '@/types/sys-entities'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type EntitiesFiltersProps = {
  fixedEntityType?: SysEntityTypeFilter
}

const STATE_OPTIONS: SysEntityStateFilter[] = [
  'all',
  'unclaimed',
  'pending',
  'pending_review',
  'approved',
  'suspended',
]

export function EntitiesFilters({ fixedEntityType }: EntitiesFiltersProps) {
  const t = useTranslations('sys.entities.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const state = (searchParams.get('state') as SysEntityStateFilter | null) ?? 'all'

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      params.delete('page')
      const basePath =
        fixedEntityType === 'company'
          ? '/sys/entities/companies'
          : fixedEntityType === 'university'
            ? '/sys/entities/universities'
            : '/sys/entities'
      startTransition(() => router.push(`${basePath}?${params.toString()}`))
    },
    [router, searchParams, fixedEntityType],
  )

  return (
    <form
      className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        pushParams({
          q: String(formData.get('q') ?? '').trim() || null,
          state: String(formData.get('state') ?? 'all'),
        })
      }}
    >
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="entities-q">{t('search')}</Label>
        <Input id="entities-q" name="q" defaultValue={q} placeholder={t('searchPlaceholder')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="entities-state">{t('state')}</Label>
        <select
          id="entities-state"
          name="state"
          defaultValue={state}
          className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm"
        >
          {STATE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`states.${option}`)}
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
