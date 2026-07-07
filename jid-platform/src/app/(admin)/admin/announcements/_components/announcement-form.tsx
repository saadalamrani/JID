'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminAnnouncement, deleteAdminAnnouncement, updateAdminAnnouncement } from '../actions'
import { ExpiryDatePicker } from './expiry-date-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  ANNOUNCEMENT_CATEGORIES,
  announcementSchema,
  defaultAnnouncementValues,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  type AnnouncementInput,
} from '@/types/announcement'

const WIZARD_STEPS = ['category', 'content', 'schedule'] as const
type WizardStep = (typeof WIZARD_STEPS)[number]

type AnnouncementFormProps = {
  mode: 'create' | 'edit'
  announcementId?: string
  initialValues?: AnnouncementInput
}

type FieldErrors = Partial<Record<keyof AnnouncementInput, string>>

export function AnnouncementForm({ mode, announcementId, initialValues }: AnnouncementFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('category')
  const [draft, setDraft] = useState<AnnouncementInput>(initialValues ?? defaultAnnouncementValues())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const stepIndex = WIZARD_STEPS.indexOf(step)
  const startsLocal = useMemo(() => toDatetimeLocalValue(draft.starts_at), [draft.starts_at])
  const expiresLocal = useMemo(() => toDatetimeLocalValue(draft.expires_at), [draft.expires_at])

  function patchDraft(patch: Partial<AnnouncementInput>) {
    setDraft((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch) as (keyof AnnouncementInput)[]) delete next[key]
      return next
    })
  }

  function validateStep(current: WizardStep): boolean {
    if (current === 'category') {
      if (!draft.category) {
        setErrors({ category: 'Category is required' })
        return false
      }
      return true
    }
    if (current === 'content') {
      if (draft.title_ar.trim().length < 10) {
        setErrors({ title_ar: 'Title must be at least 10 characters' })
        return false
      }
      return true
    }
    if (!expiresLocal.trim()) {
      setErrors({ expires_at: 'Expiry date is required' })
      return false
    }
    const parsed = announcementSchema.safeParse(draft)
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string') next[key as keyof AnnouncementInput] = issue.message
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
    const parsed = announcementSchema.safeParse(draft)
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? 'Unable to save')
      return
    }
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createAdminAnnouncement(parsed.data)
          : await updateAdminAnnouncement(announcementId!, parsed.data)
      if (!result.ok) {
        setSubmitError(result.error)
        return
      }
      router.push('/admin/announcements')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!announcementId) return
    if (!window.confirm('Delete this announcement?')) return
    startTransition(async () => {
      const result = await deleteAdminAnnouncement(announcementId)
      if (!result.ok) {
        setSubmitError(result.error)
        return
      }
      router.push('/admin/announcements')
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <ol className="grid grid-cols-3 gap-2">
        {WIZARD_STEPS.map((wizardStep, index) => (
          <li key={wizardStep} className="text-center">
            <div className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${index === stepIndex ? 'bg-jid-olive text-white' : index < stepIndex ? 'bg-jid-gold text-jid-ink' : 'bg-jid-line text-jid-ink/50'}`}>
              {index + 1}
            </div>
            <p className="text-xs text-jid-ink/70">{wizardStep}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-jid-line bg-white p-6 shadow-sm">
        {step === 'category' ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {ANNOUNCEMENT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => patchDraft({ category })}
                  className={`rounded-lg border px-4 py-3 text-start text-sm ${draft.category === category ? 'border-jid-olive bg-jid-olive/10 font-medium text-jid-olive' : 'border-jid-line'}`}
                >
                  {category}
                </button>
              ))}
            </div>
            {errors.category ? <p className="text-sm text-red-600">{errors.category}</p> : null}
          </div>
        ) : null}

        {step === 'content' ? (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">Title (Arabic)</span>
              <Input value={draft.title_ar} onChange={(e) => patchDraft({ title_ar: e.target.value })} dir="rtl" maxLength={120} />
              {errors.title_ar ? <span className="text-sm text-red-600">{errors.title_ar}</span> : null}
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">Body (Arabic)</span>
              <textarea className="flex min-h-[100px] w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink shadow-sm" value={draft.body_ar ?? ''} onChange={(e) => patchDraft({ body_ar: e.target.value })} dir="rtl" rows={4} maxLength={500} />
            </label>
          </div>
        ) : null}

        {step === 'schedule' ? (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-jid-ink">Starts at</span>
              <Input type="datetime-local" value={startsLocal} onChange={(e) => patchDraft({ starts_at: fromDatetimeLocalValue(e.target.value) })} />
            </label>

            <ExpiryDatePicker value={expiresLocal} onChange={(value) => patchDraft({ expires_at: fromDatetimeLocalValue(value) })} error={errors.expires_at ?? null} disabled={pending} />

            <div className="flex items-center justify-between rounded-lg border border-jid-line px-4 py-3">
              <p className="font-medium text-jid-ink">Featured</p>
              <Switch checked={draft.is_featured} onCheckedChange={(checked) => patchDraft({ is_featured: checked })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-jid-line px-4 py-3">
              <p className="font-medium text-jid-ink">Published</p>
              <Switch checked={draft.is_published} onCheckedChange={(checked) => patchDraft({ is_published: checked })} />
            </div>
          </div>
        ) : null}

        {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {stepIndex > 0 ? <Button type="button" variant="outline" onClick={goBack} disabled={pending}>Back</Button> : null}
          {step !== 'schedule' ? (
            <Button type="button" onClick={goNext} disabled={pending}>Next</Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={pending || !expiresLocal.trim()}>
              {pending ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
        </div>
        {mode === 'edit' ? <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>Delete</Button> : null}
      </div>
    </div>
  )
}
