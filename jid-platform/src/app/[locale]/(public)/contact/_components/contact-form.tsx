'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { submitContactMessage } from '@/app/[locale]/(public)/contact/actions'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CONTACT_CATEGORIES } from '@/lib/contact/constants'
import {
  contactFormSchema,
  type ContactFormValues,
} from '@/lib/contact/schema'
import type { Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

const fieldClassName =
  'flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-jid-olive focus:ring-2 focus:ring-jid-olive/20'

type ContactFormProps = {
  locale: Locale
  defaultFullName?: string
  defaultEmail?: string
}

/** Section 9.1 — contact form (React Hook Form + Zod, 5 categories). */
export function ContactForm({ locale, defaultFullName = '', defaultEmail = '' }: ContactFormProps) {
  const t = useTranslations('contactPage')
  const tValidation = useTranslations('contactPage.validation')
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      full_name: defaultFullName,
      email: defaultEmail,
      category: 'general',
      subject: '',
      body: '',
    },
    mode: 'onBlur',
  })

  function translateError(message?: string) {
    if (!message?.startsWith('contactPage.validation.')) return message
    const key = message.replace('contactPage.validation.', '') as
      | 'fullNameMin'
      | 'emailInvalid'
      | 'categoryRequired'
      | 'subjectMin'
      | 'bodyMin'
      | 'bodyMax'
    return tValidation(key)
  }

  async function onSubmit(values: ContactFormValues) {
    setFormError(null)
    const result = await submitContactMessage(locale, values)

    if (result.ok) {
      setSubmitted(true)
      form.reset({
        full_name: defaultFullName,
        email: defaultEmail,
        category: 'general',
        subject: '',
        body: '',
      })
      return
    }

    if (result.code === 'validation' && result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as keyof ContactFormValues, { message })
      }
    }

    if (result.code === 'rate_limited') {
      setFormError(t('errors.rateLimited'))
      return
    }

    setFormError(t('errors.server'))
  }

  if (submitted) {
    return (
      <div
        className="rounded-xl border border-jid-olive/30 bg-primary/5 p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden />
        <h2 className="mt-4 font-arabic text-xl font-semibold text-foreground">{t('success.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('success.body')}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setSubmitted(false)}
        >
          {t('success.sendAnother')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="contact-full_name"
          label={t('form.fullName')}
          error={translateError(form.formState.errors.full_name?.message)}
        >
          <Input
            id="contact-full_name"
            autoComplete="name"
            disabled={form.formState.isSubmitting}
            {...form.register('full_name')}
          />
        </FormField>

        <FormField
          id="contact-email"
          label={t('form.email')}
          error={translateError(form.formState.errors.email?.message)}
        >
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            disabled={form.formState.isSubmitting}
            {...form.register('email')}
          />
        </FormField>
      </div>

      <FormField
        id="contact-category"
        label={t('form.category')}
        error={translateError(form.formState.errors.category?.message)}
      >
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <select
              id="contact-category"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={form.formState.isSubmitting}
              className={cn(
                fieldClassName,
                form.formState.errors.category && 'border-destructive',
              )}
            >
              {CONTACT_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(`form.categories.${value}`)}
                </option>
              ))}
            </select>
          )}
        />
      </FormField>

      <FormField
        id="contact-subject"
        label={t('form.subject')}
        error={translateError(form.formState.errors.subject?.message)}
      >
        <Input
          id="contact-subject"
          disabled={form.formState.isSubmitting}
          {...form.register('subject')}
        />
      </FormField>

      <FormField
        id="contact-body"
        label={t('form.message')}
        hint={t('form.messageHint')}
        error={translateError(form.formState.errors.body?.message)}
      >
        <textarea
          id="contact-body"
          rows={6}
          disabled={form.formState.isSubmitting}
          className={cn(
            fieldClassName,
            'resize-y min-h-[9rem]',
            form.formState.errors.body && 'border-destructive',
          )}
          {...form.register('body')}
        />
      </FormField>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
        {form.formState.isSubmitting ? t('form.submitting') : t('form.submit')}
      </Button>
    </form>
  )
}
