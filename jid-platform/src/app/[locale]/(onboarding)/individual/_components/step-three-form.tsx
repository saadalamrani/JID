'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SectorFilter } from '@/components/filters/sector-filter'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCatalogSectors } from '@/hooks/use-catalog-metadata'
import { saveStepThree } from '@/lib/onboarding/actions'
import {
  onboardingStepThreeSchema,
  type OnboardingStepThreeValues,
} from '@/lib/validations/onboarding'

type StepThreeFormProps = {
  defaultValues: OnboardingStepThreeValues
}

/** Section 11.3 — optional career interests (progressive disclosure). */
export function StepThreeForm({ defaultValues }: StepThreeFormProps) {
  const t = useTranslations('onboarding.individual.step3')
  const tValidation = useTranslations('onboarding.validation')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const sectorsQuery = useCatalogSectors()

  const form = useForm<OnboardingStepThreeValues>({
    resolver: zodResolver(onboardingStepThreeSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const selectedSectors = form.watch('target_sectors') ?? []

  function translateError(message?: string) {
    if (!message?.startsWith('onboarding.validation.')) return message
    return tValidation(message.replace('onboarding.validation.', '') as 'salaryRange')
  }

  function toggleSector(slug: string) {
    const current = form.getValues('target_sectors') ?? []
    if (current.includes(slug)) {
      form.setValue(
        'target_sectors',
        current.filter((value) => value !== slug),
        { shouldDirty: true },
      )
      return
    }
    if (current.length >= 3) {
      toast.error(t('sectorsMax'))
      return
    }
    form.setValue('target_sectors', [...current, slug], { shouldDirty: true })
  }

  function onSubmit(values: OnboardingStepThreeValues) {
    startTransition(async () => {
      const result = await saveStepThree(values)
      if (!result.ok) {
        toast.error(t('saveFailed'))
      }
    })
  }

  const sectors = (sectorsQuery.data ?? []).map((sector) => ({
    ...sector,
    name_ar: sector.name_ar ?? sector.name_en,
    name_en: sector.name_en ?? sector.name_ar,
  }))

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <p className="text-sm text-jid-ink/60">{t('optionalIntro')}</p>

      <SectorFilter
        label={t('sectorsLabel')}
        sectors={sectors}
        selected={selectedSectors}
        onToggle={toggleSector}
        emptyLabel={t('sectorsPlaceholder')}
        selectedLabel={(count) => t('sectorsSelected', { count })}
      />

      <FormField id="target_job_titles" label={t('jobTitlesLabel')} hint={t('jobTitlesHint')}>
        <textarea
          id="target_job_titles"
          rows={3}
          maxLength={500}
          className="flex w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink"
          disabled={isPending}
          placeholder={t('jobTitlesPlaceholder')}
          {...form.register('target_job_titles')}
        />
      </FormField>

      <fieldset className="space-y-3 rounded-md border border-jid-line/70 p-4">
        <legend className="px-1 text-sm font-medium text-jid-ink">{t('salaryLegend')}</legend>
        <p className="text-xs text-jid-ink/55">{t('salaryHint')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="salary_min"
            label={t('salaryMin')}
            error={translateError(form.formState.errors.salary_min?.message)}
          >
            <Input
              id="salary_min"
              type="number"
              min={0}
              step={500}
              dir="ltr"
              disabled={isPending}
              {...form.register('salary_min')}
            />
          </FormField>
          <FormField
            id="salary_max"
            label={t('salaryMax')}
            error={translateError(form.formState.errors.salary_max?.message)}
          >
            <Input
              id="salary_max"
              type="number"
              min={0}
              step={500}
              dir="ltr"
              disabled={isPending}
              {...form.register('salary_max')}
            />
          </FormField>
        </div>
      </fieldset>

      <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={isPending}>
        {isPending ? t('saving') : t('continue')}
      </Button>
    </form>
  )
}
