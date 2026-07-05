'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { submitClaimRequest } from '@/lib/entity/claims'
import type { EntitySignupType } from '@/lib/entity/constants'
import { createClient } from '@/lib/supabase/client'
import { claimSubmissionSchema, type ClaimSubmissionFormValues } from '@/lib/validations/entity'

type ClaimSubmissionFormProps = {
  companyId: string
  companyName: string
  claimType: EntitySignupType
  defaultValues?: Partial<ClaimSubmissionFormValues>
  onSuccess: () => void
}

export function ClaimSubmissionForm({
  companyId,
  companyName,
  claimType,
  defaultValues,
  onSuccess,
}: ClaimSubmissionFormProps) {
  const t = useTranslations('entity.wizard.claim')
  const tValidation = useTranslations('entity.validation')
  const locale = useLocale() as 'ar' | 'en'
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ClaimSubmissionFormValues>({
    resolver: zodResolver(claimSubmissionSchema),
    defaultValues: {
      business_email: '',
      claimant_name: '',
      claimant_title: '',
      ...defaultValues,
    },
  })

  function translateError(message?: string) {
    if (!message?.startsWith('entity.validation.')) return message
    return tValidation(message.replace('entity.validation.', '') as 'emailInvalid')
  }

  async function onSubmit(values: ClaimSubmissionFormValues) {
    setSubmitting(true)
    try {
      const supabase = createClient()
      await submitClaimRequest(supabase, {
        ...values,
        companyId,
        companyName,
        claimType,
        locale,
      })
      toast.success(t('submitted'))
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('submitFailed')
      toast.error(message)
      form.setError('business_email', { message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="rounded-md bg-jid-beige p-3 text-sm text-jid-ink/80">
        <p className="font-medium text-jid-ink">{companyName}</p>
        <p className="mt-1">{t('domainHint')}</p>
      </div>

      <FormField
        id="business_email"
        label={t('businessEmail')}
        error={translateError(form.formState.errors.business_email?.message)}
      >
        <Input
          id="business_email"
          type="email"
          dir="ltr"
          className="text-start"
          disabled={submitting}
          {...form.register('business_email')}
        />
      </FormField>

      <FormField
        id="claimant_name"
        label={t('claimantName')}
        error={translateError(form.formState.errors.claimant_name?.message)}
      >
        <Input id="claimant_name" disabled={submitting} {...form.register('claimant_name')} />
      </FormField>

      <FormField
        id="claimant_title"
        label={t('claimantTitle')}
        error={translateError(form.formState.errors.claimant_title?.message)}
      >
        <Input id="claimant_title" disabled={submitting} {...form.register('claimant_title')} />
      </FormField>

      <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={submitting}>
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
