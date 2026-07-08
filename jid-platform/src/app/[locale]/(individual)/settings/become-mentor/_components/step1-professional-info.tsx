'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BecomeMentorInput } from '@/lib/validations/become-mentor'
import type { BecomeMentorFieldErrors } from './form-fields'

type Step1ProfessionalInfoProps = {
  draft: BecomeMentorInput
  errors: BecomeMentorFieldErrors
  onChange: (patch: Partial<BecomeMentorInput>) => void
}

export function Step1ProfessionalInfo({ draft, errors, onChange }: Step1ProfessionalInfoProps) {
  const t = useTranslations('mentorship.becomeMentor.step1')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-arabic text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline" className="font-arabic text-foreground">
          {t('headline')}
        </Label>
        <Input
          id="headline"
          value={draft.headline}
          onChange={(event) => onChange({ headline: event.target.value })}
          placeholder={t('headlinePlaceholder')}
          className="font-arabic border-border"
        />
        {errors.headline ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.headline}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="current_job_title" className="font-arabic text-foreground">
            {t('jobTitle')}
          </Label>
          <Input
            id="current_job_title"
            value={draft.current_job_title}
            onChange={(event) => onChange({ current_job_title: event.target.value })}
            placeholder={t('jobTitlePlaceholder')}
            className="font-arabic border-border"
          />
          {errors.current_job_title ? (
            <p className="font-arabic text-xs text-red-600" role="alert">
              {errors.current_job_title}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_company" className="font-arabic text-foreground">
            {t('company')}
          </Label>
          <Input
            id="current_company"
            value={draft.current_company}
            onChange={(event) => onChange({ current_company: event.target.value })}
            placeholder={t('companyPlaceholder')}
            className="font-arabic border-border"
          />
          {errors.current_company ? (
            <p className="font-arabic text-xs text-red-600" role="alert">
              {errors.current_company}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="years_experience" className="font-arabic text-foreground">
          {t('yearsExperience')}
        </Label>
        <Input
          id="years_experience"
          type="number"
          min={0}
          max={60}
          value={draft.years_experience || ''}
          onChange={(event) =>
            onChange({ years_experience: Number.parseInt(event.target.value, 10) || 0 })
          }
          className="font-arabic border-border"
        />
        {errors.years_experience ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.years_experience}
          </p>
        ) : null}
      </div>
    </div>
  )
}
