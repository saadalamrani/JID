'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/lib/i18n/navigation'
import {
  businessProfileDraftSchema,
  businessProfileIdentitySchema,
  businessProfileStorySchema,
  EMPTY_BUSINESS_PROFILE_DRAFT,
  type BusinessProfileDraft,
} from '@/lib/validations/business-profile'
import { publishBusinessProfileAction } from '../actions'
import {
  PROFILE_WIZARD_STEPS,
  ProfileWizardShell,
  type ProfileWizardStep,
} from './profile-wizard-shell'
import { ProfileStepIdentity } from './profile-step-identity'
import { ProfileStepStory } from './profile-step-story'
import { ProfileStepPreview } from './profile-step-preview'

import type { DirectoryReferenceData } from '@/types/business-profile-public'

type ProfileCreationWizardProps = {
  verificationId: string
  directory: DirectoryReferenceData
  suggestedDisplayNameAr: string
}

function zodFieldErrors(error: { path: (string | number)[]; message: string }[]) {
  const map: Partial<Record<keyof BusinessProfileDraft, string>> = {}
  for (const issue of error) {
    const key = issue.path[0]
    if (typeof key === 'string' && !map[key as keyof BusinessProfileDraft]) {
      map[key as keyof BusinessProfileDraft] = issue.message
    }
  }
  return map
}

export function ProfileCreationWizard({
  verificationId,
  directory,
  suggestedDisplayNameAr,
}: ProfileCreationWizardProps) {
  const t = useTranslations('company.profileCreation')
  const router = useRouter()
  const [step, setStep] = useState<ProfileWizardStep>('identity')
  const [draft, setDraft] = useState<BusinessProfileDraft>({
    ...EMPTY_BUSINESS_PROFILE_DRAFT,
    display_name_ar: suggestedDisplayNameAr,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessProfileDraft, string>>>({})
  const [publishing, setPublishing] = useState(false)

  const stepLabels: Record<ProfileWizardStep, string> = {
    identity: t('steps.identity'),
    story: t('steps.story'),
    preview: t('steps.preview'),
  }

  const stepIndex = PROFILE_WIZARD_STEPS.indexOf(step)

  const patchDraft = useCallback((patch: Partial<BusinessProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setErrors({})
  }, [])

  function validateIdentity() {
    const result = businessProfileIdentitySchema.safeParse(draft)
    if (result.success) return true
    setErrors(zodFieldErrors(result.error.errors))
    return false
  }

  function validateStory() {
    const result = businessProfileStorySchema.safeParse(draft)
    if (result.success) return true
    setErrors(zodFieldErrors(result.error.errors))
    return false
  }

  function goNext() {
    if (step === 'identity' && !validateIdentity()) return
    if (step === 'story' && !validateStory()) return
    const next = PROFILE_WIZARD_STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  function goBack() {
    const prev = PROFILE_WIZARD_STEPS[stepIndex - 1]
    if (prev) setStep(prev)
  }

  async function handlePublish() {
    const full = businessProfileDraftSchema.safeParse(draft)
    if (!full.success) {
      setErrors(zodFieldErrors(full.error.errors))
      toast.error(t('validationFailed'))
      return
    }

    setPublishing(true)
    try {
      await publishBusinessProfileAction(verificationId, full.data)
      toast.success(t('published'))
      router.push('/company/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : t('publishFailed')
      toast.error(message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <ProfileWizardShell
      title={t('title')}
      subtitle={t('subtitle')}
      currentStep={step}
      stepLabels={stepLabels}
    >
      {step === 'identity' ? (
        <ProfileStepIdentity
          draft={draft}
          directoryNameAr={directory.name_ar}
          errors={errors}
          onChange={patchDraft}
        />
      ) : null}

      {step === 'story' ? (
        <ProfileStepStory draft={draft} errors={errors} onChange={patchDraft} />
      ) : null}

      {step === 'preview' ? (
        <ProfileStepPreview draft={draft} directory={directory} />
      ) : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        {stepIndex > 0 ? (
          <Button type="button" variant="outline" onClick={goBack} disabled={publishing}>
            {t('back')}
          </Button>
        ) : (
          <span />
        )}

        {step !== 'preview' ? (
          <Button type="button" onClick={goNext}>
            {t('next')}
          </Button>
        ) : (
          <Button type="button" onClick={() => void handlePublish()} disabled={publishing}>
            {publishing ? t('publishing') : t('publish')}
          </Button>
        )}
      </div>
    </ProfileWizardShell>
  )
}
