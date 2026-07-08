'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { FormField } from '@/components/auth/form-field'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordRequirementsPanel } from '@/components/ui/password-requirements-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { entityAccountSchema, type EntityAccountFormValues } from '@/lib/validations/entity'

type StepAccountProps = {
  defaultValues?: Partial<EntityAccountFormValues>
  submitting: boolean
  onSubmit: (values: EntityAccountFormValues) => Promise<void>
}

export function StepAccount({ defaultValues, submitting, onSubmit }: StepAccountProps) {
  const t = useTranslations('entity.wizard.account')
  const tValidation = useTranslations('entity.validation')

  const form = useForm<EntityAccountFormValues>({
    resolver: zodResolver(entityAccountSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      accept_terms: false,
      ...defaultValues,
    },
  })

  const passwordValue = form.watch('password')

  function translateError(message?: string) {
    if (!message?.startsWith('entity.validation.')) return message
    return tValidation(message.replace('entity.validation.', '') as 'emailInvalid')
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="full_name"
        label={t('fullName')}
        error={translateError(form.formState.errors.full_name?.message)}
      >
        <Input id="full_name" disabled={submitting} {...form.register('full_name')} />
      </FormField>

      <FormField
        id="email"
        label={t('email')}
        error={translateError(form.formState.errors.email?.message)}
      >
        <Input
          id="email"
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          disabled={submitting}
          {...form.register('email')}
        />
      </FormField>

      <FormField
        id="password"
        label={t('password')}
        error={translateError(form.formState.errors.password?.message)}
        hint={t('passwordHint')}
      >
        <PasswordInput id="password" disabled={submitting} {...form.register('password')} />
        <PasswordRequirementsPanel password={passwordValue} className="mt-2" />
      </FormField>

      <FormField
        id="accept_terms"
        label={t('acceptTerms')}
        error={translateError(form.formState.errors.accept_terms?.message)}
      >
        <Controller
          control={form.control}
          name="accept_terms"
          render={({ field }) => (
            <label className="flex items-start gap-2 text-sm text-jid-ink/80">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-jid-line text-jid-olive focus:ring-jid-gold"
                disabled={submitting}
                checked={field.value === true}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                ref={field.ref}
              />
              <span>{t('acceptTermsLabel')}</span>
            </label>
          )}
        />
      </FormField>

      <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={submitting}>
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
