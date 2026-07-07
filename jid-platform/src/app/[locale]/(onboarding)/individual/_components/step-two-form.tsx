'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics/track'
import { saveStepTwo } from '@/lib/onboarding/actions'
import { useUniversitiesCatalog } from '@/lib/queries/universities'
import {
  onboardingStepTwoSchema,
  type OnboardingStepTwoValues,
} from '@/lib/validations/onboarding'

const selectClassName =
  'flex h-10 w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink'

function graduationYears(): number[] {
  const current = new Date().getFullYear()
  return Array.from({ length: 70 }, (_, index) => current + 10 - index)
}

type StepTwoFormProps = {
  defaultValues: OnboardingStepTwoValues
}

/** Section 11.2 — education form (universities_catalog + CV-aligned GPA fields). */
export function StepTwoForm({ defaultValues }: StepTwoFormProps) {
  const t = useTranslations('onboarding.individual.step2')
  const tCv = useTranslations('cv.builder.education')
  const tValidation = useTranslations('onboarding.validation')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const universitiesQuery = useUniversitiesCatalog()

  const form = useForm<OnboardingStepTwoValues>({
    resolver: zodResolver(onboardingStepTwoSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const universities = (universitiesQuery.data ?? []).map((university) => ({
    value: university.id,
    label: locale === 'ar' ? university.name_ar : university.name_en,
    description: university.short_code,
  }))

  function translateError(message?: string) {
    if (!message?.startsWith('onboarding.validation.')) return message
    return tValidation(message.replace('onboarding.validation.', '') as 'universityRequired')
  }

  function onSubmit(values: OnboardingStepTwoValues) {
    startTransition(async () => {
      track('onboarding_step_two_saved')
      const result = await saveStepTwo(values)
      if (!result.ok) {
        toast.error(t('saveFailed'))
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormField
        id="university_id"
        label={t('institutionLabel')}
        hint={t('institutionHint')}
        error={translateError(form.formState.errors.university_id?.message)}
      >
        <Combobox
          options={universities}
          value={form.watch('university_id') || null}
          onValueChange={(value) => form.setValue('university_id', value, { shouldDirty: true })}
          placeholder={universitiesQuery.isLoading ? t('loading') : t('institutionPlaceholder')}
          searchPlaceholder={t('institutionSearch')}
          emptyText={t('institutionEmpty')}
        />
      </FormField>

      <FormField
        id="degree"
        label={tCv('degree')}
        error={translateError(form.formState.errors.degree?.message)}
      >
        <Input id="degree" disabled={isPending} {...form.register('degree')} />
      </FormField>

      <FormField
        id="graduation_year"
        label={tCv('graduationYear')}
        error={translateError(form.formState.errors.graduation_year?.message)}
      >
        <select
          id="graduation_year"
          className={selectClassName}
          disabled={isPending}
          value={String(form.watch('graduation_year') ?? '')}
          onChange={(event) =>
            form.setValue('graduation_year', Number(event.target.value), { shouldDirty: true })
          }
        >
          <option value="">{t('graduationYearPlaceholder')}</option>
          {graduationYears().map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="gpa_value"
          label={tCv('gpaValue')}
          hint={t('gpaOptionalHint')}
          error={translateError(form.formState.errors.gpa_value?.message)}
        >
          <Input
            id="gpa_value"
            type="number"
            step="0.01"
            min={0}
            disabled={isPending}
            {...form.register('gpa_value')}
          />
        </FormField>
        <FormField
          id="gpa_scale"
          label={tCv('gpaScale')}
          hint={t('gpaOptionalHint')}
          error={translateError(form.formState.errors.gpa_scale?.message)}
        >
          <Input
            id="gpa_scale"
            type="number"
            step="0.01"
            min={0}
            disabled={isPending}
            {...form.register('gpa_scale')}
          />
        </FormField>
      </div>

      <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={isPending}>
        {isPending ? t('saving') : t('continue')}
      </Button>
    </form>
  )
}
