'use client'

import { useTranslations } from 'next-intl'
import { FormField } from '@/components/auth/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { BusinessProfileDraft } from '@/lib/validations/business-profile'

type ProfileStepIdentityProps = {
  draft: BusinessProfileDraft
  directoryNameAr: string | null
  errors: Partial<Record<keyof BusinessProfileDraft, string>>
  onChange: (patch: Partial<BusinessProfileDraft>) => void
}

export function ProfileStepIdentity({
  draft,
  directoryNameAr,
  errors,
  onChange,
}: ProfileStepIdentityProps) {
  const t = useTranslations('company.profileCreation.identity')

  return (
    <div className="space-y-4">
      {directoryNameAr ? (
        <p className="rounded-md bg-background p-3 text-sm text-foreground/70">
          {t('directoryHint', { name: directoryNameAr })}
        </p>
      ) : null}

      <FormField
        id="display_name_ar"
        label={t('displayNameAr')}
        error={errors.display_name_ar}
      >
        <Input
          id="display_name_ar"
          value={draft.display_name_ar}
          onChange={(e) => onChange({ display_name_ar: e.target.value })}
        />
      </FormField>

      <FormField id="display_name_en" label={t('displayNameEn')} error={errors.display_name_en}>
        <Input
          id="display_name_en"
          dir="ltr"
          className="text-start"
          value={draft.display_name_en ?? ''}
          onChange={(e) => onChange({ display_name_en: e.target.value })}
        />
      </FormField>

      <FormField id="tagline_ar" label={t('taglineAr')} error={errors.tagline_ar}>
        <Textarea
          id="tagline_ar"
          rows={2}
          value={draft.tagline_ar ?? ''}
          onChange={(e) => onChange({ tagline_ar: e.target.value })}
        />
      </FormField>
    </div>
  )
}
