'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from '@/app/[locale]/(staff)/staff/announcements/actions'
import { ExpiryDatePicker } from '@/app/[locale]/(staff)/staff/announcements/_components/expiry-date-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  ANNOUNCEMENT_CATEGORIES,
  announcementFormBaseSchema,
  announcementFormSchema,
  defaultAnnouncementFormValues,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  type AnnouncementFormInput,
} from '@/lib/validations/announcement'
import { cn } from '@/lib/utils'

const WIZARD_STEPS = ['category', 'content', 'schedule'] as const
type WizardStep = (typeof WIZARD_STEPS)[number]

type AnnouncementFormProps = {
  mode: 'create' | 'edit'
  announcementId?: string
  initialValues?: AnnouncementFormInput
}

type FieldErrors = Partial<Record<keyof AnnouncementFormInput, string>>

export function AnnouncementForm({ mode, announcementId, initialValues }: AnnouncementFormProps) {
  const t = useTranslations('staff.announcements.form')
  const tValidation = useTranslations('staff.announcements.validation')
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('category')
  const [draft, setDraft] = useState<AnnouncementFormInput>(
    initialValues ?? defaultAnnouncementFormValues(),
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const stepIndex = WIZARD_STEPS.indexOf(step)

  const startsLocal = useMemo(() => toDatetimeLocalValue(draft.starts_at), [draft.starts_at])
  const expiresLocal = useMemo(() => toDatetimeLocalValue(draft.expires_at), [draft.expires_at])

  function translateError(message?: string) {
    if (!message) return undefined
    const key = message.replace('staff.announcements.validation.', '') as
      | 'titleMin'
      | 'titleMax'
      | 'bodyMax'
      | 'startsRequired'
      | 'startsInvalid'
      | 'expiresRequired'
      | 'expiresFuture'
      | 'expiresAfterStart'
      | 'ctaUrlInvalid'
      | 'ctaLabelMax'
    if (message.startsWith('staff.announcements.validation.')) {
      return tValidation(key)
    }
    return message
  }

  function patchDraft(patch: Partial<AnnouncementFormInput>) {
    setDraft((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch) as (keyof AnnouncementFormInput)[]) {
        delete next[key]
      }
      return next
    })
  }

  function validateStep(current: WizardStep): boolean {
    if (current === 'category') {
      if (!draft.category) {
        setErrors({ category: t('validation.categoryRequired') })
        return false
      }
      return true
    }

    if (current === 'content') {
      const result = announcementFormBaseSchema
        .pick({ title_ar: true, body_ar: true, cta_url: true, cta_label_ar: true })
        .safeParse(draft)
      if (!result.success) {
        const next: FieldErrors = {}
        for (const issue of result.error.errors) {
          const key = issue.path[0]
          if (typeof key === 'string') next[key as keyof AnnouncementFormInput] = translateError(issue.message)
        }
        setErrors(next)
        return false
      }
      return true
    }

    if (!expiresLocal.trim()) {
      setErrors({ expires_at: t('expiry.required') })
      return false
    }

    const result = announcementFormBaseSchema
      .pick({ starts_at: true, expires_at: true, is_featured: true, is_published: true })
      .safeParse(draft)

    if (!result.success) {
      const next: FieldErrors = {}
      for (const issue of result.error.errors) {
        const key = issue.path[0]
        if (typeof key === 'string') next[key as keyof AnnouncementFormInput] = translateError(issue.message)
      }
      setErrors(next)
      return false
    }

    return true
  }

  function goNext() {
    if (!validateStep(step)) return
    const next = WIZARD_STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  function goBack() {
    const prev = WIZARD_STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  function handleSubmit() {
    if (!validateStep('schedule')) return

    const parsed = announcementFormSchema.safeParse(draft)
    if (!parsed.success) {
      setSubmitError(parsed.error.errors[0]?.message ?? t('saveFailed'))
      return
    }

    setSubmitError(null)
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createAnnouncement(parsed.data)
          : await updateAnnouncement(announcementId!, parsed.data)

      if (!result.ok) {
        setSubmitError(result.error)
        return
      }

      router.push('/staff/announcements')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!announcementId) return
    if (!window.confirm(t('deleteConfirm'))) return

    startTransition(async () => {
      const result = await deleteAnnouncement(announcementId)
      if (!result.ok) {
        setSubmitError(result.error)
        return
      }
      router.push('/staff/announcements')
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ol className="grid grid-cols-3 gap-2">
        {WIZARD_STEPS.map((wizardStep, index) => (
          <li key={wizardStep} className="text-center">
            <div
              className={cn(
                'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                index === stepIndex && 'bg-jid-olive text-white',
                index < stepIndex && 'bg-jid-gold text-jid-ink',
                index > stepIndex && 'bg-jid-line text-jid-ink/50',
              )}
            >
              {index + 1}
            </div>
            <p className={cn('text-xs', index === stepIndex ? 'font-medium text-jid-ink' : 'text-jid-ink/60')}>
              {t(`steps.${wizardStep}`)}
            </p>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-jid-line bg-white p-6 shadow-sm">
        {step === 'category' ? (
          <div className="space-y-4">
            <p className="text-sm text-jid-ink/70">{t('categoryHint')}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ANNOUNCEMENT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => patchDraft({ category })}
                  className={cn(
                    'rounded-lg border px-4 py-3 text-start text-sm transition-colors',
                    draft.category === category
                      ? 'border-jid-olive bg-jid-olive/10 font-medium text-jid-olive'
                      : 'border-jid-line hover:border-jid-olive/40',
                  )}
                >
                  {t(`categories.${category}`)}
                </button>
              ))}
            </div>
            {errors.category ? <p className="text-sm text-red-600">{errors.category}</p> : null}
          </div>
        ) : null}

        {step === 'content' ? (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">{t('title')}</span>
              <Input
                value={draft.title_ar}
                onChange={(e) => patchDraft({ title_ar: e.target.value })}
                dir="rtl"
                maxLength={120}
              />
              {errors.title_ar ? <span className="text-sm text-red-600">{errors.title_ar}</span> : null}
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">{t('body')}</span>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jid-olive"
                value={draft.body_ar ?? ''}
                onChange={(e) => patchDraft({ body_ar: e.target.value })}
                dir="rtl"
                rows={4}
                maxLength={500}
              />
              {errors.body_ar ? <span className="text-sm text-red-600">{errors.body_ar}</span> : null}
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">{t('ctaUrl')}</span>
              <Input
                value={draft.cta_url ?? ''}
                onChange={(e) => patchDraft({ cta_url: e.target.value })}
                placeholder="https://"
              />
              {errors.cta_url ? <span className="text-sm text-red-600">{errors.cta_url}</span> : null}
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">{t('ctaLabel')}</span>
              <Input
                value={draft.cta_label_ar ?? ''}
                onChange={(e) => patchDraft({ cta_label_ar: e.target.value })}
                dir="rtl"
                maxLength={30}
              />
              {errors.cta_label_ar ? <span className="text-sm text-red-600">{errors.cta_label_ar}</span> : null}
            </label>
          </div>
        ) : null}

        {step === 'schedule' ? (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">{t('startsAt')}</span>
              <Input
                type="datetime-local"
                value={startsLocal}
                onChange={(e) => patchDraft({ starts_at: fromDatetimeLocalValue(e.target.value) })}
              />
              {errors.starts_at ? <span className="text-sm text-red-600">{errors.starts_at}</span> : null}
            </label>

            <ExpiryDatePicker
              value={expiresLocal}
              onChange={(value) => patchDraft({ expires_at: fromDatetimeLocalValue(value) })}
              error={errors.expires_at ?? null}
              disabled={pending}
            />

            <div className="flex items-center justify-between rounded-lg border border-jid-line px-4 py-3">
              <div>
                <p className="font-medium text-jid-ink">{t('featured')}</p>
                <p className="text-sm text-jid-ink/60">{t('featuredHint')}</p>
              </div>
              <Switch
                checked={draft.is_featured}
                onCheckedChange={(checked) => patchDraft({ is_featured: checked })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-jid-line px-4 py-3">
              <div>
                <p className="font-medium text-jid-ink">{t('published')}</p>
                <p className="text-sm text-jid-ink/60">{t('publishedHint')}</p>
              </div>
              <Switch
                checked={draft.is_published}
                onCheckedChange={(checked) => patchDraft({ is_published: checked })}
              />
            </div>
          </div>
        ) : null}

        {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {stepIndex > 0 ? (
            <Button type="button" variant="outline" onClick={goBack} disabled={pending}>
              {t('back')}
            </Button>
          ) : null}
          {step !== 'schedule' ? (
            <Button type="button" onClick={goNext} disabled={pending}>
              {t('next')}
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={pending || !expiresLocal.trim()}>
              {pending ? t('saving') : mode === 'create' ? t('create') : t('save')}
            </Button>
          )}
        </div>

        {mode === 'edit' ? (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            {t('delete')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
