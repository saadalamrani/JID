'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { track } from '@/lib/analytics/track'
import { saveEntityProfile } from '@/lib/onboarding/entity-actions'
import type { ClaimedEntityRecord } from '@/lib/onboarding/entity-queries'
import { entitySetupSchema, type EntitySetupValues } from '@/lib/validations/entity-onboarding'

type EntitySetupFormProps = {
  company: ClaimedEntityRecord
}

/** Task 1-ALT — finish setting up an existing approved catalog entity. */
export function EntitySetupForm({ company }: EntitySetupFormProps) {
  const t = useTranslations('onboarding.entity.setup')
  const [isPending, startTransition] = useTransition()

  const form = useForm<EntitySetupValues>({
    resolver: zodResolver(entitySetupSchema),
    defaultValues: {
      logo_url: company.logo_url ?? '',
      cover_url: company.cover_url ?? '',
      description_ar: company.description_ar ?? company.tagline_ar ?? '',
      description_en: company.description_en ?? company.tagline_en ?? '',
    },
    mode: 'onBlur',
  })

  function onSubmit(values: EntitySetupValues) {
    startTransition(async () => {
      track('entity_profile_saved', { company_id: company.id, entity_type: company.entity_type })
      const result = await saveEntityProfile(values)
      if (!result.ok) {
        toast.error(t('saveFailed'))
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <section className="rounded-xl border border-jid-line bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-jid-ink/50">{t('prefilledLabel')}</p>
        <h2 className="mt-1 font-arabic text-xl font-semibold text-jid-olive">{company.name_ar ?? company.name}</h2>
        {company.name_ar ? (
          <p className="text-sm text-jid-ink/60" dir="ltr">
            {company.name}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-jid-ink/50">
          {t('entityState')}: <span className="font-mono">{company.entity_state}</span>
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="logo_url" label={t('logoLabel')} hint={t('urlHint')}>
          <Input id="logo_url" dir="ltr" disabled={isPending} {...form.register('logo_url')} />
        </FormField>
        <FormField id="cover_url" label={t('coverLabel')} hint={t('urlHint')}>
          <Input id="cover_url" dir="ltr" disabled={isPending} {...form.register('cover_url')} />
        </FormField>
      </div>

      <FormField id="description_ar" label={t('descriptionAr')}>
        <textarea
          id="description_ar"
          rows={5}
          className="flex w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm"
          disabled={isPending}
          {...form.register('description_ar')}
        />
      </FormField>

      <FormField id="description_en" label={t('descriptionEn')}>
        <textarea
          id="description_en"
          rows={5}
          dir="ltr"
          className="flex w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm"
          disabled={isPending}
          {...form.register('description_en')}
        />
      </FormField>

      <Button type="submit" className="w-full bg-jid-olive hover:bg-jid-olive/90" disabled={isPending}>
        {isPending ? t('saving') : t('continue')}
      </Button>
    </form>
  )
}
