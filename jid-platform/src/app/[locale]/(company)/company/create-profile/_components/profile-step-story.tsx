'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { uploadBusinessProfileCover } from '@/lib/profile/business-profile-media'
import {
  EMPLOYEE_COUNT_RANGES,
  type BusinessProfileDraft,
  type EmployeeCountRange,
} from '@/lib/validations/business-profile'

type ProfileStepStoryProps = {
  draft: BusinessProfileDraft
  errors: Partial<Record<keyof BusinessProfileDraft, string>>
  onChange: (patch: Partial<BusinessProfileDraft>) => void
}

export function ProfileStepStory({ draft, errors, onChange }: ProfileStepStoryProps) {
  const t = useTranslations('company.profileCreation.story')
  const tMedia = useTranslations('company.profileCreation.media')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleCoverSelect(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadBusinessProfileCover(file)
      onChange({ cover_image_url: url })
      toast.success(tMedia('uploaded'))
    } catch (error) {
      const message = error instanceof Error ? error.message : tMedia('uploadFailed')
      if (message === 'businessProfile.media.invalidType') {
        toast.error(tMedia('invalidType'))
      } else if (message === 'businessProfile.media.tooLarge') {
        toast.error(tMedia('tooLarge'))
      } else {
        toast.error(message)
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <FormField id="about_ar" label={t('aboutAr')} error={errors.about_ar}>
        <Textarea
          id="about_ar"
          rows={5}
          value={draft.about_ar ?? ''}
          onChange={(e) => onChange({ about_ar: e.target.value })}
        />
      </FormField>

      <FormField id="about_en" label={t('aboutEn')} error={errors.about_en}>
        <Textarea
          id="about_en"
          rows={5}
          dir="ltr"
          className="text-start"
          value={draft.about_en ?? ''}
          onChange={(e) => onChange({ about_en: e.target.value })}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="founded_year" label={t('foundedYear')} error={errors.founded_year as string}>
          <Input
            id="founded_year"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            value={draft.founded_year ?? ''}
            onChange={(e) =>
              onChange({
                founded_year: e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </FormField>

        <FormField
          id="employee_count_range"
          label={t('employeeCount')}
          error={errors.employee_count_range as string}
        >
          <select
            id="employee_count_range"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={draft.employee_count_range ?? ''}
            onChange={(e) =>
              onChange({
                employee_count_range:
                  e.target.value === '' ? null : (e.target.value as EmployeeCountRange),
              })
            }
          >
            <option value="">{t('employeeCountPlaceholder')}</option>
            {EMPLOYEE_COUNT_RANGES.map((range) => (
              <option key={range} value={range}>
                {t(`employeeRanges.${range}`)}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField id="cover_image" label={t('coverImage')} error={errors.cover_image_url as string}>
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleCoverSelect(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? tMedia('uploading') : t('coverUpload')}
          </Button>
          {draft.cover_image_url ? (
            <div
              className="h-28 rounded-md border border-border bg-cover bg-center"
              style={{ backgroundImage: `url(${draft.cover_image_url})` }}
              role="img"
              aria-label={t('coverPreviewAlt')}
            />
          ) : null}
          <p className="text-xs text-muted-foreground">{tMedia('hint')}</p>
        </div>
      </FormField>
    </div>
  )
}
