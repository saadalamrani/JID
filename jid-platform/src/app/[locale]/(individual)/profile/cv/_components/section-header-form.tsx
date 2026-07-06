'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Input } from '@/components/ui/input'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import { useUpdateCvHeader } from '@/lib/cv/queries'
import {
  cvHeaderSectionSchema,
  cvRecordToHeaderSectionValues,
  normalizeCvHeaderPatch,
  type CvHeaderSectionValues,
} from '@/lib/cv/schemas/header'
import type { CvFullRecord } from '@/types/cv'

type SectionHeaderFormProps = {
  cv: CvFullRecord
}

/** Section 7.6 — header + professional links with debounced auto-save. */
export function SectionHeaderForm({ cv }: SectionHeaderFormProps) {
  const t = useTranslations('cv.builder.header')
  const updateHeader = useUpdateCvHeader(cv.id)

  const form = useForm<CvHeaderSectionValues>({
    resolver: zodResolver(cvHeaderSectionSchema),
    defaultValues: cvRecordToHeaderSectionValues(cv),
    mode: 'onChange',
  })

  const {
    register,
    watch,
    getValues,
    reset,
    formState: { errors },
  } = form

  useEffect(() => {
    reset(cvRecordToHeaderSectionValues(cv))
  }, [cv.id, cv.updated_at, reset, cv])

  const save = useCallback(
    async (values: CvHeaderSectionValues) => {
      const parsed = cvHeaderSectionSchema.safeParse(values)
      if (!parsed.success) return
      await updateHeader.mutateAsync(normalizeCvHeaderPatch(parsed.data))
    },
    [updateHeader],
  )

  const { status, secondsAgo } = useAutoSave({
    watch,
    getValues,
    onSave: save,
    onError: () => toast.error(t('saveError')),
  })

  const saveLabel =
    status === 'pending' || status === 'saving'
      ? t('savePending')
      : status === 'saved'
        ? t('saveSaved', { seconds: secondsAgo })
        : status === 'error'
          ? t('saveError')
          : null

  return (
    <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-jid-ink/50" aria-live="polite">
          {saveLabel}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="full_name"
          label={t('fullName')}
          error={errors.full_name?.message}
          className="sm:col-span-2"
        >
          <Input id="full_name" {...register('full_name')} autoComplete="name" />
        </FormField>

        <FormField id="city" label={t('city')} error={errors.city?.message}>
          <Input id="city" {...register('city')} autoComplete="address-level2" />
        </FormField>

        <FormField id="country" label={t('country')} error={errors.country?.message}>
          <Input id="country" {...register('country')} autoComplete="country-name" />
        </FormField>

        <FormField id="email" label={t('email')} error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} autoComplete="email" />
        </FormField>

        <FormField id="phone" label={t('phone')} error={errors.phone?.message}>
          <Input id="phone" type="tel" {...register('phone')} autoComplete="tel" />
        </FormField>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-jid-line p-4">
        <legend className="px-1 text-sm font-medium text-jid-ink/80">{t('linksTitle')}</legend>

        <FormField
          id="linkedin_url"
          label={t('linkedin')}
          hint={t('linkAnchorHint')}
          error={errors.linkedin_url?.message}
        >
          <Input id="linkedin_url" type="url" {...register('linkedin_url')} placeholder="https://" />
        </FormField>

        <FormField
          id="github_url"
          label={t('github')}
          hint={t('linkAnchorHint')}
          error={errors.github_url?.message}
        >
          <Input id="github_url" type="url" {...register('github_url')} placeholder="https://" />
        </FormField>

        <FormField
          id="portfolio_url"
          label={t('portfolio')}
          hint={t('linkAnchorHint')}
          error={errors.portfolio_url?.message}
        >
          <Input id="portfolio_url" type="url" {...register('portfolio_url')} placeholder="https://" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="custom_link_1_label"
            label={t('customLink1Label')}
            error={errors.custom_link_1_label?.message}
          >
            <Input id="custom_link_1_label" {...register('custom_link_1_label')} />
          </FormField>
          <FormField
            id="custom_link_1_url"
            label={t('customLink1Url')}
            hint={t('customLinkHint')}
            error={errors.custom_link_1_url?.message}
          >
            <Input id="custom_link_1_url" type="url" {...register('custom_link_1_url')} placeholder="https://" />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="custom_link_2_label"
            label={t('customLink2Label')}
            error={errors.custom_link_2_label?.message}
          >
            <Input id="custom_link_2_label" {...register('custom_link_2_label')} />
          </FormField>
          <FormField
            id="custom_link_2_url"
            label={t('customLink2Url')}
            hint={t('customLinkHint')}
            error={errors.custom_link_2_url?.message}
          >
            <Input id="custom_link_2_url" type="url" {...register('custom_link_2_url')} placeholder="https://" />
          </FormField>
        </div>
      </fieldset>
    </form>
  )
}
