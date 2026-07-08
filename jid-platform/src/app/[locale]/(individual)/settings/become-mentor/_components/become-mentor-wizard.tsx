'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from '@/lib/i18n/navigation'
import {
  becomeMentorSchema,
  EMPTY_BECOME_MENTOR_DRAFT,
  type BecomeMentorInput,
} from '@/lib/validations/become-mentor'
import { Step1ProfessionalInfo } from './step1-professional-info'
import { Step2ExpertiseAreas } from './step2-expertise-areas'
import { Step3MentorBio } from './step3-mentor-bio'
import { Step4VerificationDocs } from './step4-verification-docs'
import { Step5Review } from './step5-review'
import type { BecomeMentorFieldErrors } from './form-fields'

const WIZARD_STEPS = [
  'professional',
  'expertise',
  'bio',
  'verification',
  'review',
] as const

type WizardStep = (typeof WIZARD_STEPS)[number]

type BecomeMentorWizardProps = {
  fullName: string
  avatarUrl?: string | null
}

function zodFieldErrors(error: { path: (string | number)[]; message: string }[]) {
  const map: BecomeMentorFieldErrors = {}
  for (const issue of error) {
    const key = issue.path[0]
    if (typeof key === 'string' && !map[key as keyof BecomeMentorInput]) {
      map[key as keyof BecomeMentorInput] = issue.message
    }
  }
  return map
}

function validateStep(step: WizardStep, draft: BecomeMentorInput): BecomeMentorFieldErrors {
  switch (step) {
    case 'professional':
      return zodFieldErrors(
        becomeMentorSchema
          .pick({
            headline: true,
            current_job_title: true,
            current_company: true,
            years_experience: true,
          })
          .safeParse(draft).error?.errors ?? [],
      )
    case 'expertise':
      return zodFieldErrors(
        becomeMentorSchema.pick({ expertise_areas: true }).safeParse(draft).error?.errors ?? [],
      )
    case 'bio':
      return zodFieldErrors(
        becomeMentorSchema
          .pick({ bio_long: true, languages: true, preferred_mediums: true })
          .safeParse(draft).error?.errors ?? [],
      )
    case 'verification':
      return zodFieldErrors(
        becomeMentorSchema.pick({ linkedin_url: true }).safeParse(draft).error?.errors ?? [],
      )
    case 'review':
      return {}
    default: {
      const _exhaustive: never = step
      return _exhaustive
    }
  }
}

export function BecomeMentorWizard({ fullName, avatarUrl }: BecomeMentorWizardProps) {
  const t = useTranslations('mentorship.becomeMentor')
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('professional')
  const [draft, setDraft] = useState<BecomeMentorInput>(EMPTY_BECOME_MENTOR_DRAFT)
  const [errors, setErrors] = useState<BecomeMentorFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const stepIndex = WIZARD_STEPS.indexOf(step)

  const patchDraft = useCallback((patch: Partial<BecomeMentorInput>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch) as (keyof BecomeMentorInput)[]) {
        delete next[key]
      }
      return next
    })
  }, [])

  function goNext() {
    const nextErrors = validateStep(step, draft)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const nextIndex = stepIndex + 1
    if (nextIndex < WIZARD_STEPS.length) {
      setStep(WIZARD_STEPS[nextIndex]!)
    }
  }

  function goBack() {
    const prevIndex = stepIndex - 1
    if (prevIndex >= 0) {
      setStep(WIZARD_STEPS[prevIndex]!)
    }
  }

  async function submit() {
    const parsed = becomeMentorSchema.safeParse(draft)
    if (!parsed.success) {
      const nextErrors = zodFieldErrors(parsed.error.errors)
      setErrors(nextErrors)
      toast.error(parsed.error.errors[0]?.message ?? t('submitError'))
      return
    }

    if (parsed.data.expertise_areas.length > 5) {
      setErrors({ expertise_areas: t('expertiseMaxError') })
      setStep('expertise')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/me/become-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(parsed.data),
      })

      const body = (await response.json().catch(() => null)) as {
        error?: string
        slug?: string
        status?: string
      } | null

      if (!response.ok) {
        toast.error(body?.error ?? t('submitError'))
        return
      }

      toast.success(t('submitSuccess'))
      router.push('/settings/become-mentor')
      router.refresh()
    } catch {
      toast.error(t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-jid max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="font-arabic text-2xl font-semibold text-foreground">{t('pageTitle')}</h1>
        <p className="mt-1 font-arabic text-sm text-muted-foreground">{t('pageSubtitle')}</p>
      </div>

      <ol className="grid grid-cols-5 gap-2">
        {WIZARD_STEPS.map((wizardStep, index) => {
          const isActive = index === stepIndex
          const isComplete = index < stepIndex

          return (
            <li key={wizardStep} className="text-center">
              <div
                className={cn(
                  'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                  isActive && 'bg-primary text-primary-foreground',
                  isComplete && 'bg-accent text-foreground',
                  !isActive && !isComplete && 'bg-border text-muted-foreground',
                )}
              >
                {index + 1}
              </div>
              <p
                className={cn(
                  'font-arabic text-[10px] leading-tight sm:text-xs',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {t(`steps.${wizardStep}`)}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {step === 'professional' ? (
          <Step1ProfessionalInfo draft={draft} errors={errors} onChange={patchDraft} />
        ) : null}
        {step === 'expertise' ? (
          <Step2ExpertiseAreas draft={draft} errors={errors} onChange={patchDraft} />
        ) : null}
        {step === 'bio' ? (
          <Step3MentorBio draft={draft} errors={errors} onChange={patchDraft} />
        ) : null}
        {step === 'verification' ? (
          <Step4VerificationDocs draft={draft} errors={errors} onChange={patchDraft} />
        ) : null}
        {step === 'review' ? (
          <Step5Review draft={draft} fullName={fullName} avatarUrl={avatarUrl} />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={stepIndex === 0 || submitting}
          className="font-arabic"
        >
          {t('back')}
        </Button>

        {step === 'review' ? (
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="font-arabic"
          >
            {submitting ? t('submitting') : t('submit')}
          </Button>
        ) : (
          <Button type="button" onClick={goNext} className="font-arabic">
            {t('next')}
          </Button>
        )}
      </div>
    </div>
  )
}
