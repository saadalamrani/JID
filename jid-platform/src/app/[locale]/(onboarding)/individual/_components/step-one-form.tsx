'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics/track'
import { saveStepOne } from '@/lib/onboarding/actions'
import { phoneToNationalInput } from '@/lib/onboarding/phone-display'
import { bilingualNameSchema } from '@/lib/utils/validators'
import {
  saudiPhoneSchema,
  type OnboardingStepOneValues,
} from '@/lib/validations/onboarding'

type StepOneFormProps = {
  defaultFullName: string
  defaultPhone: string
}

const stepOneFormSchema = z.object({
  full_name: bilingualNameSchema,
  phone: saudiPhoneSchema,
})

/** Section 11.1 — basic info form (bilingualNameSchema + saudiPhoneSchema). */
export function StepOneForm({ defaultFullName, defaultPhone }: StepOneFormProps) {
  const t = useTranslations('onboarding.individual.step1')
  const tValidation = useTranslations('onboarding.validation')
  const [isPending, startTransition] = useTransition()

  const form = useForm<OnboardingStepOneValues>({
    resolver: zodResolver(stepOneFormSchema),
    defaultValues: {
      full_name: defaultFullName,
      phone: defaultPhone,
    },
    mode: 'onBlur',
  })

  function translateError(message?: string) {
    if (!message?.startsWith('onboarding.validation.')) return message
    return tValidation(message.replace('onboarding.validation.', '') as 'fullNameMin')
  }

  function onSubmit(values: OnboardingStepOneValues) {
    startTransition(async () => {
      track('onboarding_step_one_saved')
      const result = await saveStepOne(values)
      if (!result.ok) {
        toast.error(
          result.error.startsWith('onboarding.')
            ? tValidation(result.error.replace('onboarding.validation.', '') as 'fullNameMin')
            : t('saveFailed'),
        )
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormField
        id="full_name"
        label={t('fullNameLabel')}
        hint={t('fullNameHint')}
        error={translateError(form.formState.errors.full_name?.message)}
      >
        <Input id="full_name" autoComplete="name" disabled={isPending} {...form.register('full_name')} />
      </FormField>

      <FormField
        id="phone"
        label={t('phoneLabel')}
        hint={t('phoneHint')}
        error={translateError(form.formState.errors.phone?.message)}
      >
        <div className="flex gap-2" dir="ltr">
          <span className="flex h-10 items-center rounded-md border border-border bg-background px-3 text-sm text-muted-foreground">
            +966
          </span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="5XXXXXXXX"
            className="flex-1 font-mono tabular-nums"
            disabled={isPending}
            {...form.register('phone')}
          />
        </div>
      </FormField>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isPending}>
        {isPending ? t('saving') : t('continue')}
      </Button>
    </form>
  )
}

export function toStepOneDefaults(fullName: string | null, phone: string | null) {
  return {
    defaultFullName: fullName ?? '',
    defaultPhone: phoneToNationalInput(phone),
  }
}
