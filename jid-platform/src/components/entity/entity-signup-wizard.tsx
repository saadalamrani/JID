'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { OrganizationRegistrationForm } from '@/components/entity/organization-registration-form'
import { StepAccount } from '@/components/entity/step-account'
import { StepVerifyEmail } from '@/components/entity/step-verify-email'
import { WizardShell } from '@/components/entity/wizard-shell'
import { siteConfig } from '@/config/site'
import { track } from '@/lib/analytics/track'
import type { EntitySignupType, EntityWizardStep } from '@/lib/entity/constants'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import { mapWizardStepToJourneyChapter } from '@/lib/entity/journey-chapters'
import {
  clearWizardState,
  loadWizardState,
  saveWizardState,
  type EntityWizardState,
} from '@/lib/entity/wizard-state'
import { useRouter } from '@/lib/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EntityAccountFormValues } from '@/lib/validations/entity'

type EntitySignupWizardProps = {
  entityType: EntitySignupType
}

const HYDRATION_TIMEOUT_MS = 5_000

function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), HYDRATION_TIMEOUT_MS)

    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    )
  })
}

function pendingReviewPath(entityType: EntitySignupType) {
  return entityType === 'university'
    ? '/university/pending-review'
    : '/company/verification-pending'
}

export function EntitySignupWizard({ entityType }: EntitySignupWizardProps) {
  const t = useTranslations('entity.wizard')
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const [step, setStep] = useState<EntityWizardStep>('account')
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<EntityWizardState>({ step: 'account' })
  const [hydrated, setHydrated] = useState(false)

  const chapterLabels = {
    identify: t('chapters.identify'),
    verify: t('chapters.verify'),
    prepare: t('chapters.prepare'),
  }

  const currentChapter = mapWizardStepToJourneyChapter(step)

  const persist = useCallback(
    (next: EntityWizardState) => {
      setState(next)
      saveWizardState(entityType, next)
    },
    [entityType],
  )

  const goToStep = useCallback(
    (nextStep: EntityWizardStep) => {
      persist({ ...state, step: nextStep })
      setStep(nextStep)
    },
    [persist, state],
  )

  useEffect(() => {
    if (entityType === 'university') {
      track('university_signup_initiated')
    }
  }, [entityType])

  useEffect(() => {
    async function hydrate() {
      try {
        const saved = loadWizardState(entityType)
        const supabase = createClient()
        const {
          data: { session },
        } = await withTimeout(
          supabase.auth.getSession(),
          'Timed out while restoring the signup session',
        )
        const user = session?.user ?? null

        if (user) {
          const request = await withTimeout(
            getLatestVerificationForUser(supabase, user.id),
            'Timed out while restoring the latest verification request',
          )
          if (request && ['pending_review', 'pending', 'under_review'].includes(request.status)) {
            router.replace(pendingReviewPath(entityType))
            return
          }
        }

        if (user && !user.email_confirmed_at) {
          const next: EntityWizardState = {
            step: 'verify_email',
            accountEmail: user.email ?? saved?.accountEmail,
            registrationDraft: saved?.registrationDraft,
          }
          persist(next)
          setStep('verify_email')
          return
        }

        if (user?.email_confirmed_at) {
          const next: EntityWizardState = {
            step: 'org_details',
            accountEmail: user.email ?? saved?.accountEmail,
            registrationDraft: saved?.registrationDraft,
          }
          persist(next)
          setStep('org_details')
          return
        }

        if (saved?.step === 'account' || !saved) {
          if (saved) {
            setState(saved)
            setStep(saved.step === 'org_details' || saved.step === 'verify_email' ? 'account' : saved.step)
          }
        }
      } catch (error) {
        console.error('[entity-signup] Failed to restore signup state', error)
        toast.error(t('account.error'))
      } finally {
        setHydrated(true)
      }
    }

    void hydrate()
  }, [entityType, persist, router, t])

  useEffect(() => {
    if (step === 'pending') {
      router.replace(pendingReviewPath(entityType))
    }
  }, [entityType, router, step])

  async function handleAccountSubmit(values: EntityAccountFormValues) {
    setSubmitting(true)
    const supabase = createClient()

    try {
      const resumePath = entityType === 'university' ? '/signup/university' : '/signup/company'
      const redirectTo = `${siteConfig.appUrl}/auth/callback?next=${encodeURIComponent(resumePath)}`

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: values.full_name, role: 'entity', locale },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user && data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: values.full_name,
          locale,
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          toast.error(profileError.message)
          return
        }
      }

      const emailConfirmed = Boolean(data.user?.email_confirmed_at)
      persist({
        step: emailConfirmed ? 'org_details' : 'verify_email',
        accountEmail: values.email,
      })
      setStep(emailConfirmed ? 'org_details' : 'verify_email')
    } catch {
      toast.error(t('account.error'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleEmailVerified() {
    goToStep('org_details')
  }

  function handleRegistrationSuccess() {
    clearWizardState(entityType)
    goToStep('pending')
  }

  if (!hydrated) {
    return (
      <WizardShell
        title={t(`title.${entityType}`)}
        subtitle={t('loading')}
        currentChapter="identify"
        chapterLabels={chapterLabels}
      >
        <p className="text-foreground/60 text-center text-sm">{t('loading')}</p>
      </WizardShell>
    )
  }

  return (
    <WizardShell
      title={t(`title.${entityType}`)}
      subtitle={t(`subtitle.${entityType}`)}
      currentChapter={currentChapter}
      chapterLabels={chapterLabels}
    >
      {step === 'account' ? (
        <StepAccount submitting={submitting} onSubmit={handleAccountSubmit} />
      ) : null}

      {step === 'verify_email' ? (
        <StepVerifyEmail email={state.accountEmail} onVerified={handleEmailVerified} />
      ) : null}

      {step === 'org_details' ? (
        <OrganizationRegistrationForm
          signupType={entityType}
          defaultValues={state.registrationDraft}
          onSuccess={handleRegistrationSuccess}
        />
      ) : null}
    </WizardShell>
  )
}
