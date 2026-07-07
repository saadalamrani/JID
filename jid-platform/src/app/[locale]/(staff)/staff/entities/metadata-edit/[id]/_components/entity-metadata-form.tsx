'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { updateEntityMetadata } from '@/app/[locale]/(staff)/staff/entities/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRouter } from '@/lib/i18n/navigation'
import type { StaffEntityDetail, StaffRegionOption, StaffSectorOption } from '@/types/staff-entities'

type EntityMetadataFormProps = {
  entity: StaffEntityDetail
  sectors: StaffSectorOption[]
  regions: StaffRegionOption[]
}

export function EntityMetadataForm({ entity, sectors, regions }: EntityMetadataFormProps) {
  const t = useTranslations('staff.entities.metadataForm')
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [sectorId, setSectorId] = useState(entity.sector_id ?? '')
  const [regionId, setRegionId] = useState(entity.region_id ?? '')
  const [descriptionEn, setDescriptionEn] = useState(entity.description_en ?? '')
  const [descriptionAr, setDescriptionAr] = useState(entity.description_ar ?? '')
  const [logoUrl, setLogoUrl] = useState(entity.logo_url ?? '')
  const [reason, setReason] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (reason.trim().length < 3) {
      toast.error(t('reasonRequired'))
      return
    }

    const result = await updateEntityMetadata({
      entityId: entity.id,
      sectorId: sectorId || null,
      regionId: regionId || null,
      descriptionEn: descriptionEn.trim() || null,
      descriptionAr: descriptionAr.trim() || null,
      logoUrl: logoUrl.trim() || null,
      reason: reason.trim(),
    })

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(t('saved'))
    startTransition(() => {
      router.push(`/staff/entities/${entity.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-jid-line bg-white p-5">
      <p className="text-sm text-jid-ink/60">{t('hint')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sector">{t('sector')}</Label>
          <select
            id="sector"
            value={sectorId}
            onChange={(e) => setSectorId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm"
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
            className="flex h-10 w-full rounded-md border border-jid-line bg-white px-3 text-sm"
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

      <div className="space-y-2">
        <Label htmlFor="logo_url">{t('logoUrl')}</Label>
        <input
          id="logo_url"
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="flex h-10 w-full rounded-md border border-jid-line px-3 text-sm"
          placeholder="https://"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_en">{t('descriptionEn')}</Label>
        <textarea
          id="description_en"
          rows={4}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          className="w-full rounded-md border border-jid-line px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_ar">{t('descriptionAr')}</Label>
        <textarea
          id="description_ar"
          rows={4}
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          className="w-full rounded-md border border-jid-line px-3 py-2 text-sm"
          dir="rtl"
        />
      </div>

      <div className="space-y-2 border-t border-jid-line pt-4">
        <Label htmlFor="metadata_reason">{t('reasonLabel')}</Label>
        <textarea
          id="metadata_reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-jid-line px-3 py-2 text-sm"
          placeholder={t('reasonPlaceholder')}
        />
      </div>

      <Button type="submit" className="bg-jid-olive hover:bg-jid-olive/90" disabled={pending}>
        {pending ? t('saving') : t('submit')}
      </Button>
    </form>
  )
}
