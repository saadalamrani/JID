'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { upsertDirectoryRecord } from '../actions'
import type { StaffDirectoryRow } from '@/lib/staff/directory-queries'
import type { StaffRegionOption, StaffSectorOption } from '@/types/staff-entities'
import type { OwnershipType } from '@/types/catalog'
import { OWNERSHIP_TYPES } from '@/types/catalog'

type DirectoryEditorModalProps = {
  row: StaffDirectoryRow | null
  sectors: StaffSectorOption[]
  regions: StaffRegionOption[]
  onClose: () => void
  onSaved: () => void
}

export function DirectoryEditorModal({
  row,
  sectors,
  regions,
  onClose,
  onSaved,
}: DirectoryEditorModalProps) {
  const t = useTranslations('staff.directory.editor')
  const [pending, startTransition] = useTransition()
  const isCreate = !row

  const [name, setName] = useState(row?.name ?? '')
  const [nameAr, setNameAr] = useState(row?.name_ar ?? '')
  const [entityType, setEntityType] = useState<'company' | 'university'>(
    (row?.entity_type as 'company' | 'university') ?? 'company',
  )
  const [ownershipType, setOwnershipType] = useState<OwnershipType | ''>(
    row?.ownership_type ?? '',
  )
  const [sectorId, setSectorId] = useState(row?.sector_id ?? '')
  const [regionId, setRegionId] = useState(row?.region_id ?? '')
  const [domains, setDomains] = useState((row?.domains ?? []).join(', '))
  const [careerPortalUrl, setCareerPortalUrl] = useState(row?.career_portal_url ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(row?.website_url ?? '')
  const [logoUrl, setLogoUrl] = useState(row?.logo_url ?? '')
  const [isActive, setIsActive] = useState(row?.is_active ?? true)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = await upsertDirectoryRecord({
      id: row?.id,
      name: name.trim(),
      name_ar: nameAr.trim(),
      entity_type: entityType,
      ownership_type: ownershipType || null,
      sector_id: sectorId || null,
      region_id: regionId || null,
      domains: domains
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      career_portal_url: careerPortalUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
      is_active: isActive,
    })

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(isCreate ? t('created') : t('saved'))
    startTransition(() => {
      onSaved()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-foreground">
          {isCreate ? t('createTitle') : t('editTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('boundaryHint')}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name_en">{t('nameEn')}</Label>
            <input
              id="name_en"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name_ar">{t('nameAr')}</Label>
            <input
              id="name_ar"
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity_type">{t('entityType')}</Label>
            <select
              id="entity_type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as 'company' | 'university')}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
            >
              <option value="company">{t('entityCompany')}</option>
              <option value="university">{t('entityUniversity')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownership">{t('ownership')}</Label>
            <select
              id="ownership"
              value={ownershipType}
              onChange={(e) => setOwnershipType(e.target.value as OwnershipType | '')}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
            >
              <option value="">{t('none')}</option>
              {OWNERSHIP_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">{t('sector')}</Label>
            <select
              id="sector"
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
            >
              <option value="">{t('none')}</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name_en}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">{t('region')}</Label>
            <select
              id="region"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
            >
              <option value="">{t('none')}</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name_en}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="domains">{t('domains')}</Label>
          <input
            id="domains"
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="example.com, careers.example.com"
            className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
            dir="ltr"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="career_portal">{t('careerPortal')}</Label>
            <input
              id="career_portal"
              type="url"
              value={careerPortalUrl}
              onChange={(e) => setCareerPortalUrl(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">{t('website')}</Label>
            <input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
              dir="ltr"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logo">{t('logo')}</Label>
            <input
              id="logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border px-3 text-sm"
              dir="ltr"
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          {t('isActive')}
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
