'use client'

import { useTranslations } from 'next-intl'
import type { BecomeMentorInput } from '@/lib/validations/become-mentor'
import { TagInput, type BecomeMentorFieldErrors } from './form-fields'

type Step2ExpertiseAreasProps = {
  draft: BecomeMentorInput
  errors: BecomeMentorFieldErrors
  onChange: (patch: Partial<BecomeMentorInput>) => void
}

export function Step2ExpertiseAreas({ draft, errors, onChange }: Step2ExpertiseAreasProps) {
  const t = useTranslations('mentorship.becomeMentor.step2')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-arabic text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <TagInput
        label={t('areasLabel')}
        hint={t('areasHint')}
        items={draft.expertise_areas}
        maxItems={5}
        onChange={(expertise_areas) => onChange({ expertise_areas })}
        error={errors.expertise_areas}
        placeholder={t('areasPlaceholder')}
        addLabel={t('addTag')}
      />
    </div>
  )
}
