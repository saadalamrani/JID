'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClaimSubmissionForm } from '@/components/entity/claim-submission-form'
import { StepAccount } from '@/components/entity/step-account'
import {
  StepEntitySelection,
  type EntitySelectionResult,
} from '@/components/entity/step-entity-selection'
import { StepVerifyEmail } from '@/components/entity/step-verify-email'
import { WizardShell } from '@/components/entity/wizard-shell'
import { siteConfig } from '@/config/site'
import { track } from '@/lib/analytics/track'
import type { EntitySignupType, EntityWizardStep } from '@/lib/entity/constants'
import { getLatestClaimForUser } from '@/lib/entity/claims'
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

type EntityPhase = 'selection' | 'claim'

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
  const router = useRouter()
  const [step, setStep] = useState<EntityWizardStep>('account')
  const [entityPhase, setEntityPhase] = useState<EntityPhase>('selection')
  const [submitting, setSubmitting] = useState(false)
  const [state, setState] = useState<EntityWizardState>({ step: 'account' })
  const [hydrated, setHydrated] = useState(false)

  const stepLabels: Record<EntityWizardStep, string> = {
    account: t('steps.account'),
    entity: t('steps.entity'),
    verify_email: t('steps.verifyEmail'),
    pending: t('steps.pending'),
  }

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
          const claim = await withTimeout(
            getLatestClaimForUser(supabase, user.id),
            'Timed out while restoring the latest entity claim',
          )
          if (claim && ['pending_review', 'pending', 'under_review'].includes(claim.status)) {
            router.replace(pendingReviewPath(entityType))
            return
          }
        }

        if (saved) {
          setState(saved)
          setStep(saved.step)
          if (saved.companyId) setEntityPhase('claim')
        } else if (user) {
          const next: EntityWizardState = {
            step: user.email_confirmed_at ? 'entity' : 'verify_email',
            accountEmail: user.email ?? undefined,
          }
          setState(next)
          setStep(next.step)
        }
      } catch (error) {
        console.error('[entity-signup] Failed to restore signup state', error)
        toast.error(t('account.error'))
      } finally {
        setHydrated(true)
      }
    }

    void hydrate()
  }, [entityType, router, t])

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
          data: { full_name: values.full_name, role: 'entity', locale: 'ar' },
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
          locale: 'ar',
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          toast.error(profileError.message)
          return
        }
      }

      persist({
        step: 'entity',
        accountEmail: values.email,
      })
      setStep('entity')
      setEntityPhase('selection')
    } catch {
      toast.error(t('account.error'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleEntitySelected(result: EntitySelectionResult) {
    persist({
      ...state,
      step: 'entity',
      companyId: result.companyId,
      companyName: result.companyName,
      companyDomains: result.companyDomains,
    })
    setEntityPhase('claim')
  }

  function handleClaimSuccess() {
    goToStep('verify_email')
  }

  function handleEmailVerified() {
    goToStep('pending')
  }

  if (!hydrated) {
    return (
      <WizardShell
        title={t(`title.${entityType}`)}
        subtitle={t('loading')}
        currentStep="account"
        stepLabels={stepLabels}
      >
        <p className="text-foreground/60 text-center text-sm">{t('loading')}</p>
      </WizardShell>
    )
  }

  return (
    <WizardShell
      title={t(`title.${entityType}`)}
      subtitle={t(`subtitle.${entityType}`)}
      currentStep={step}
      stepLabels={stepLabels}
    >
      {step === 'account' ? (
        <StepAccount submitting={submitting} onSubmit={handleAccountSubmit} />
      ) : null}

      {step === 'entity' && entityPhase === 'selection' ? (
        <StepEntitySelection
          entityType={entityType}
          initialCompanyId={state.companyId}
          onBack={() => goToStep('account')}
          onContinue={handleEntitySelected}
        />
      ) : null}

      {step === 'entity' && entityPhase === 'claim' && state.companyId && state.companyName ? (
        <div className="space-y-4">
          <ClaimSubmissionForm
            companyId={state.companyId}
            companyName={state.companyName}
            claimType={entityType}
            defaultValues={state.claimDraft}
            onSuccess={() => {
              clearWizardState(entityType)
              handleClaimSuccess()
            }}
          />
          <button
            type="button"
            className="w-full text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => setEntityPhase('selection')}
          >
            {t('entity.changeCompany')}
          </button>
        </div>
      ) : null}

      {step === 'verify_email' ? (
        <StepVerifyEmail
          email={state.accountEmail}
          pendingReviewPath={pendingReviewPath(entityType)}
          onVerified={handleEmailVerified}
        />
      ) : null}
    </WizardShell>
  )
}
