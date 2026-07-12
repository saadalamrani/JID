'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DIRECTORY_CORRECTION_FIELD_NAMES,
  getDirectoryFieldCurrentValue,
  type DirectoryCorrectionFieldName,
} from '@/types/catalog'
import { createClient } from '@/lib/supabase/client'
import type { CatalogLookupOption, Company } from '@/types/catalog'

type CorrectionSuggestionFormProps = {
  company: Company
  sectors: CatalogLookupOption[]
  regions: CatalogLookupOption[]
}

export function CorrectionSuggestionForm({
  company,
  sectors,
  regions,
}: CorrectionSuggestionFormProps) {
  const t = useTranslations('catalogPage.correction')
  const [open, setOpen] = useState(false)
  const [fieldName, setFieldName] = useState<DirectoryCorrectionFieldName>('city')
  const [suggestedValue, setSuggestedValue] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const currentValue = useMemo(
    () => getDirectoryFieldCurrentValue(company, fieldName),
    [company, fieldName],
  )

  const currentValueLabel = useMemo(() => {
    if (fieldName === 'sector_id') {
      const sector = sectors.find((item) => item.id === currentValue)
      return sector?.name_ar ?? sector?.name_en ?? currentValue
    }
    if (fieldName === 'region_id') {
      const region = regions.find((item) => item.id === currentValue)
      return region?.name_ar ?? region?.name_en ?? currentValue
    }
    return currentValue
  }, [currentValue, fieldName, regions, sectors])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!suggestedValue.trim()) {
      toast.error(t('valueRequired'))
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error(t('authRequired'))
        return
      }

      const { error } = await supabase.from('directory_correction_suggestions').insert({
        directory_id: company.id,
        suggested_by: user.id,
        field_name: fieldName,
        current_value: currentValue || null,
        suggested_value: suggestedValue.trim(),
        reason: reason.trim() || null,
      })

      if (error) {
        if (error.message.includes('directory_correction_suggestions_field_name_chk')) {
          toast.error(t('fieldNotAllowed'))
        } else {
          toast.error(error.message)
        }
        return
      }

      setSubmitted(true)
      setOpen(false)
      toast.success(t('submitted'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('submitFailed')
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return <p className="text-sm text-foreground/70">{t('submitted')}</p>
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-sm text-primary underline-offset-4 hover:underline"
        onClick={() => setOpen(true)}
      >
        {t('open')}
      </button>
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mt-2 space-y-3 rounded-lg border border-border bg-background p-4">
      <div className="space-y-1">
        <Label htmlFor="correction-field">{t('fieldLabel')}</Label>
        <select
          id="correction-field"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={fieldName}
          onChange={(event) => {
            setFieldName(event.target.value as DirectoryCorrectionFieldName)
            setSuggestedValue('')
          }}
        >
          {DIRECTORY_CORRECTION_FIELD_NAMES.map((field) => (
            <option key={field} value={field}>
              {t(`fields.${field}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label>{t('currentValue')}</Label>
        <Input value={currentValueLabel} readOnly disabled className="bg-muted/40" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="correction-suggested">{t('suggestedValue')}</Label>
        {fieldName === 'sector_id' ? (
          <select
            id="correction-suggested"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={suggestedValue}
            onChange={(event) => setSuggestedValue(event.target.value)}
            required
          >
            <option value="">{t('selectSector')}</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name_ar ?? sector.name_en}
              </option>
            ))}
          </select>
        ) : fieldName === 'region_id' ? (
          <select
            id="correction-suggested"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={suggestedValue}
            onChange={(event) => setSuggestedValue(event.target.value)}
            required
          >
            <option value="">{t('selectRegion')}</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name_ar ?? region.name_en}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id="correction-suggested"
            value={suggestedValue}
            onChange={(event) => setSuggestedValue(event.target.value)}
            required
          />
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="correction-reason">{t('reason')}</Label>
        <Textarea
          id="correction-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
