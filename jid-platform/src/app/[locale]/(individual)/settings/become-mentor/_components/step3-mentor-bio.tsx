'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Label } from '@/components/ui/label'
import {
  MENTOR_LANGUAGE_OPTIONS,
  MENTOR_MEDIUM_OPTIONS,
} from '@/lib/mentor-application/constants'
import type { BecomeMentorInput } from '@/lib/validations/become-mentor'
import { MultiSelectChips, type BecomeMentorFieldErrors } from './form-fields'

type Step3MentorBioProps = {
  draft: BecomeMentorInput
  errors: BecomeMentorFieldErrors
  onChange: (patch: Partial<BecomeMentorInput>) => void
}

export function Step3MentorBio({ draft, errors, onChange }: Step3MentorBioProps) {
  const t = useTranslations('mentorship.becomeMentor.step3')
  const locale = useLocale()
  const isEn = locale === 'en'

  const languageOptions = MENTOR_LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: isEn ? option.labelEn : option.labelAr,
  }))

  const mediumOptions = MENTOR_MEDIUM_OPTIONS.map((option) => ({
    value: option.value,
    label: isEn ? option.labelEn : option.labelAr,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-arabic text-lg font-semibold text-jid-ink">{t('title')}</h2>
        <p className="mt-1 font-arabic text-sm text-jid-ink/60">{t('subtitle')}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="bio_long" className="font-arabic text-jid-ink">
            {t('bioLabel')}
          </Label>
          <span className="font-arabic text-xs text-jid-ink/50">
            {t('bioCount', { count: draft.bio_long.length })}
          </span>
        </div>
        <textarea
          id="bio_long"
          value={draft.bio_long}
          maxLength={500}
          rows={6}
          onChange={(event) => onChange({ bio_long: event.target.value })}
          placeholder={t('bioPlaceholder')}
          className="w-full rounded-md border border-jid-line bg-white px-3 py-2 font-arabic text-sm text-jid-ink outline-none ring-jid-olive/30 focus:ring-2"
        />
        {errors.bio_long ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.bio_long}
          </p>
        ) : null}
      </div>

      <MultiSelectChips
        label={t('languagesLabel')}
        hint={t('languagesHint')}
        options={languageOptions}
        values={draft.languages}
        onChange={(languages) => onChange({ languages })}
        error={errors.languages}
      />

      <MultiSelectChips
        label={t('mediumsLabel')}
        hint={t('mediumsHint')}
        options={mediumOptions}
        values={draft.preferred_mediums}
        onChange={(preferred_mediums) => onChange({ preferred_mediums })}
        error={errors.preferred_mediums}
      />
    </div>
  )
}
