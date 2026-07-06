'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateDomainMatch } from '@/lib/jobs/domain-validator'
import type { ApprovedCompanyPoster } from '@/lib/jobs/poster-types'
import {
  EMPTY_JOB_POSTING_DRAFT,
  jobPostingSchema,
  type JobPostingDraft,
} from '@/lib/validations/job-posting'
import { useRouter } from '@/lib/i18n/navigation'
import { WizardStepBasic } from './wizard-step-basic'
import { WizardStepCore } from './wizard-step-core'
import { WizardStepPreview } from './wizard-step-preview'

const WIZARD_STEPS = ['basic', 'core', 'preview'] as const
type WizardStep = (typeof WIZARD_STEPS)[number]

const STEP_LABELS: Record<WizardStep, string> = {
  basic: 'المعلومات الأساسية',
  core: 'تفاصيل الفرصة',
  preview: 'المعاينة والنشر',
}

type JobPostingWizardProps = {
  poster: ApprovedCompanyPoster
}

function zodFieldErrors(error: { path: (string | number)[]; message: string }[]) {
  const map: Partial<Record<keyof JobPostingDraft, string>> = {}
  for (const issue of error) {
    const key = issue.path[0]
    if (typeof key === 'string' && !map[key as keyof JobPostingDraft]) {
      map[key as keyof JobPostingDraft] = issue.message
    }
  }
  return map
}

function validateBasicStep(draft: JobPostingDraft) {
  const partial = jobPostingSchema
    .pick({
      title_ar: true,
      experience_level: true,
      sector_slug: true,
      region_slug: true,
      city: true,
    })
    .safeParse(draft)

  return partial.success ? {} : zodFieldErrors(partial.error.errors)
}

function validateCoreStep(draft: JobPostingDraft, companyDomains: string[]) {
  const partial = jobPostingSchema
    .pick({
      external_apply_url: true,
      application_deadline: true,
      description_ar: true,
      required_skills: true,
    })
    .safeParse(draft)

  const errors = partial.success ? {} : zodFieldErrors(partial.error.errors)

  if (draft.external_apply_url.trim()) {
    const domainCheck = validateDomainMatch(draft.external_apply_url, companyDomains, 'ar')
    if (!domainCheck.valid) {
      errors.external_apply_url = domainCheck.message
    }
  }

  return errors
}

export function JobPostingWizard({ poster }: JobPostingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('basic')
  const [draft, setDraft] = useState<JobPostingDraft>(EMPTY_JOB_POSTING_DRAFT)
  const [errors, setErrors] = useState<Partial<Record<keyof JobPostingDraft, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const stepIndex = WIZARD_STEPS.indexOf(step)

  const patchDraft = useCallback((patch: Partial<JobPostingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch) as (keyof JobPostingDraft)[]) {
        delete next[key]
      }
      return next
    })
  }, [])

  function goNext() {
    if (step === 'basic') {
      const nextErrors = validateBasicStep(draft)
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors)
        return
      }
      setStep('core')
      return
    }

    if (step === 'core') {
      const nextErrors = validateCoreStep(draft, poster.company.domains)
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors)
        return
      }
      setStep('preview')
    }
  }

  function goBack() {
    if (step === 'core') setStep('basic')
    if (step === 'preview') setStep('core')
  }

  async function submit(publish: boolean) {
    const parsed = jobPostingSchema.safeParse({ ...draft, publish })
    if (!parsed.success) {
      const nextErrors = zodFieldErrors(parsed.error.errors)
      setErrors(nextErrors)
      toast.error(parsed.error.errors[0]?.message ?? 'تحقق من البيانات')
      return
    }

    const domainCheck = validateDomainMatch(
      parsed.data.external_apply_url,
      poster.company.domains,
      'ar',
    )
    if (!domainCheck.valid) {
      setErrors({ external_apply_url: domainCheck.message })
      toast.error(domainCheck.message)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/company/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(parsed.data),
      })

      const body = (await response.json().catch(() => null)) as {
        error?: string
        jobId?: string
        status?: string
      } | null

      if (!response.ok) {
        toast.error(body?.error ?? 'تعذّر حفظ الفرصة')
        if (body?.error?.includes('النطاقات المعتمدة')) {
          setErrors({ external_apply_url: body.error })
          setStep('core')
        }
        return
      }

      if (publish) {
        toast.success('تم نشر الفرصة بنجاح')
      } else {
        toast.success('تم حفظ المسودة')
      }

      router.push('/company/profile')
    } catch {
      toast.error('تعذّر حفظ الفرصة')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-arabic text-2xl font-semibold text-jid-ink">نشر فرصة جديدة</h1>
        <p className="mt-2 font-arabic text-sm text-jid-ink/70">
          {poster.company.name_ar ?? poster.company.name}
        </p>
      </div>

      <ol className="mb-8 grid grid-cols-3 gap-2">
        {WIZARD_STEPS.map((wizardStep, index) => {
          const isActive = index === stepIndex
          const isComplete = index < stepIndex

          return (
            <li key={wizardStep} className="text-center">
              <div
                className={cn(
                  'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  isActive && 'bg-jid-olive text-white',
                  isComplete && 'bg-jid-gold text-jid-ink',
                  !isActive && !isComplete && 'bg-jid-line text-jid-ink/50',
                )}
              >
                {index + 1}
              </div>
              <p
                className={cn(
                  'font-arabic text-xs',
                  isActive ? 'font-medium text-jid-ink' : 'text-jid-ink/60',
                )}
              >
                {STEP_LABELS[wizardStep]}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-jid-line bg-white p-6 shadow-sm">
        {step === 'basic' ? (
          <WizardStepBasic draft={draft} errors={errors} onChange={patchDraft} />
        ) : null}
        {step === 'core' ? (
          <WizardStepCore
            draft={draft}
            errors={errors}
            companyDomains={poster.company.domains}
            onChange={patchDraft}
          />
        ) : null}
        {step === 'preview' ? (
          <WizardStepPreview
            draft={draft}
            poster={poster}
            submitting={submitting}
            onSaveDraft={() => submit(false)}
            onPublish={() => submit(true)}
          />
        ) : null}

        {step !== 'preview' ? (
          <div className="mt-8 flex justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 'basic'}
              onClick={goBack}
              className="font-arabic"
            >
              السابق
            </Button>
            <Button
              type="button"
              onClick={goNext}
              className="bg-jid-olive font-arabic hover:bg-jid-olive/90"
            >
              التالي
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex justify-start">
            <Button type="button" variant="ghost" onClick={goBack} className="font-arabic">
              السابق
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
