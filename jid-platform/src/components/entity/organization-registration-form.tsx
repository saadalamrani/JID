'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics/track'
import { submitVerificationRequest } from '@/lib/entity/claims'
import type { EntitySignupType } from '@/lib/entity/constants'
import { createClient } from '@/lib/supabase/client'
import {
  organizationRegistrationSchema,
  type OrganizationRegistrationFormValues,
} from '@/lib/validations/entity'

type OrganizationRegistrationFormProps = {
  signupType: EntitySignupType
  defaultValues?: Partial<OrganizationRegistrationFormValues>
  onSuccess: () => void
}

export function OrganizationRegistrationForm({
  signupType,
  defaultValues,
  onSuccess,
}: OrganizationRegistrationFormProps) {
  const t = useTranslations('entity.wizard.registration')
  const tValidation = useTranslations('entity.validation')
  const locale = useLocale() as 'ar' | 'en'
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<OrganizationRegistrationFormValues>({
    resolver: zodResolver(organizationRegistrationSchema),
    defaultValues: {
      organization_name: '',
      organization_name_ar: '',
      website: '',
      domain: '',
      business_email: '',
      representative_name: '',
      representative_title: '',
      ...defaultValues,
    },
  })

  function translateError(message?: string) {
    if (!message?.startsWith('entity.validation.')) return message
    return tValidation(message.replace('entity.validation.', '') as 'emailInvalid')
  }

  async function onSubmit(values: OrganizationRegistrationFormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      await submitVerificationRequest(supabase, {
        ...values,
        signupType,
        locale,
      })
      if (signupType === 'university') {
        track('entity_verification_submitted', { signup_type: signupType })
      }
      toast.success(t('submitted'))
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('submitFailed')
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
      data-testid="organization-registration-form"
    >
      <div className="rounded-md bg-background p-3 text-sm text-foreground/80">
        <p className="font-medium text-foreground">{t(`intro.${signupType}`)}</p>
        <p className="mt-1">{t('evidenceHint')}</p>
      </div>

      <FormField
        id="organization_name"
        label={t(`organizationName.${signupType}`)}
        error={translateError(form.formState.errors.organization_name?.message)}
      >
        <Input
          id="organization_name"
          autoComplete="organization"
          disabled={submitting}
          {...form.register('organization_name')}
        />
      </FormField>

      <FormField
        id="organization_name_ar"
        label={t('organizationNameAr')}
        error={translateError(form.formState.errors.organization_name_ar?.message)}
      >
        <Input
          id="organization_name_ar"
          disabled={submitting}
          {...form.register('organization_name_ar')}
        />
      </FormField>

      <FormField
        id="website"
        label={t('website')}
        error={translateError(form.formState.errors.website?.message)}
      >
        <Input
          id="website"
          dir="ltr"
          className="text-start"
          placeholder="https://"
          disabled={submitting}
          {...form.register('website')}
        />
      </FormField>

      <FormField
        id="domain"
        label={t('domain')}
        hint={t('domainHint')}
        error={translateError(form.formState.errors.domain?.message)}
      >
        <Input
          id="domain"
          dir="ltr"
          className="text-start font-mono text-sm"
          placeholder="example.com"
          disabled={submitting}
          {...form.register('domain')}
        />
      </FormField>

      <FormField
        id="business_email"
        label={t(`workEmail.${signupType}`)}
        error={translateError(form.formState.errors.business_email?.message)}
      >
        <Input
          id="business_email"
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          disabled={submitting}
          {...form.register('business_email')}
        />
      </FormField>

      <FormField
        id="representative_name"
        label={t('representativeName')}
        error={translateError(form.formState.errors.representative_name?.message)}
      >
        <Input
          id="representative_name"
          autoComplete="name"
          disabled={submitting}
          {...form.register('representative_name')}
        />
      </FormField>

      <FormField
        id="representative_title"
        label={t('representativeTitle')}
        error={translateError(form.formState.errors.representative_title?.message)}
      >
        <Input
          id="representative_title"
          disabled={submitting}
          {...form.register('representative_title')}
        />
      </FormField>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
