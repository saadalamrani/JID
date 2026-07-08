'use client'

import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BecomeMentorInput } from '@/lib/validations/become-mentor'
import type { BecomeMentorFieldErrors } from './form-fields'

type Step4VerificationDocsProps = {
  draft: BecomeMentorInput
  errors: BecomeMentorFieldErrors
  onChange: (patch: Partial<BecomeMentorInput>) => void
}

export function Step4VerificationDocs({ draft, errors, onChange }: Step4VerificationDocsProps) {
  const t = useTranslations('mentorship.becomeMentor.step4')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-arabic text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="rounded-lg border border-border bg-background/30 p-4">
        <p className="font-arabic text-sm text-muted-foreground">{t('noUploadsNote')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="linkedin_url" className="font-arabic text-foreground">
          {t('linkedinLabel')}
        </Label>
        <Input
          id="linkedin_url"
          type="url"
          inputMode="url"
          value={draft.linkedin_url}
          onChange={(event) => onChange({ linkedin_url: event.target.value })}
          placeholder={t('linkedinPlaceholder')}
          className="font-arabic border-border"
          required
        />
        {errors.linkedin_url ? (
          <p className="font-arabic text-xs text-red-600" role="alert">
            {errors.linkedin_url}
          </p>
        ) : null}
      </div>
    </div>
  )
}
