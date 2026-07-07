'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useTransition } from 'react'
import type { StaffOwnershipFilter, StaffRegionOption } from '@/types/staff-entities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const OWNERSHIP_OPTIONS: StaffOwnershipFilter[] = [
  'all',
  'government',
  'semi_government',
  'private',
]

type EntitiesFiltersProps = {
  basePath?: string
  regions: StaffRegionOption[]
}

export function EntitiesFilters({ basePath = '/staff/entities', regions }: EntitiesFiltersProps) {
  const t = useTranslations('staff.entities.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''
  const ownership = (searchParams.get('ownership') as StaffOwnershipFilter | null) ?? 'all'
  const regionId = searchParams.get('region') ?? ''

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === 'all') params.delete(key)
        else params.set(key, value)
      }
      params.delete('page')
      startTransition(() => router.push(`${basePath}?${params.toString()}`))
    },
    [basePath, router, searchParams],
  )

  return (
    <form
      className="grid gap-4 rounded-lg border border-jid-line bg-white p-4 md:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        pushParams({
          q: String(formData.get('q') ?? '').trim() || null,
          ownership: String(formData.get('ownership') ?? 'all'),
          region: String(formData.get('region') ?? '') || null,
        })
      }}
    >
      <div className="space-y-1 md:col-span-2">
        <Label htmlFor="entities-q">{t('search')}</Label>
        <Input id="entities-q" name="q" defaultValue={q} placeholder={t('searchPlaceholder')} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="entities-ownership">{t('ownership')}</Label>
        <select
          id="entities-ownership"
          name="ownership"
          defaultValue={ownership}
          className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm"
        >
          {OWNERSHIP_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`ownershipOptions.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="entities-region">{t('region')}</Label>
        <select
          id="entities-region"
          name="region"
          defaultValue={regionId}
          className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm"
        >
          <option value="">{t('allRegions')}</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name_en}
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
