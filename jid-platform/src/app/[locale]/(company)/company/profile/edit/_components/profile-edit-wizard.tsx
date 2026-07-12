'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  businessProfileDraftSchema,
  businessProfileIdentitySchema,
  businessProfileStorySchema,
  type BusinessProfileDraft,
} from '@/lib/validations/business-profile'
import type { OwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import {
  ProfileWizardShell,
  type ProfileWizardStep,
} from '../../../create-profile/_components/profile-wizard-shell'
import { ProfileStepIdentity } from '../../../create-profile/_components/profile-step-identity'
import { ProfileStepStory } from '../../../create-profile/_components/profile-step-story'
import { updateOwnerBusinessProfileAction } from '../../../create-profile/actions'

type ProfileEditWizardProps = {
  profile: OwnerBusinessProfile
}

function profileToDraft(profile: OwnerBusinessProfile): BusinessProfileDraft {
  return {
    display_name_ar: profile.display_name_ar,
    display_name_en: profile.display_name_en ?? '',
    tagline_ar: profile.tagline_ar ?? '',
    about_ar: profile.about_ar ?? '',
    about_en: profile.about_en ?? '',
    founded_year: profile.founded_year,
    employee_count_range: (profile.employee_count_range as BusinessProfileDraft['employee_count_range']) ?? null,
    cover_image_url: profile.cover_image_url ?? '',
  }
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

const EDIT_STEPS = ['identity', 'story'] as const satisfies readonly ProfileWizardStep[]

export function ProfileEditWizard({ profile }: ProfileEditWizardProps) {
  const t = useTranslations('company.profileEdit')
  const [step, setStep] = useState<ProfileWizardStep>('identity')
  const [draft, setDraft] = useState<BusinessProfileDraft>(() => profileToDraft(profile))
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessProfileDraft, string>>>({})
  const [saving, setSaving] = useState(false)

  const stepLabels: Record<ProfileWizardStep, string> = {
    identity: t('steps.identity'),
    story: t('steps.story'),
    preview: t('steps.story'),
  }

  const stepIndex = EDIT_STEPS.indexOf(step === 'preview' ? 'story' : step)

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
    if (step === 'identity') setStep('story')
  }

  function goBack() {
    if (step === 'story') setStep('identity')
  }

  async function handleSave() {
    if (!validateIdentity() || !validateStory()) {
      toast.error(t('validationFailed'))
      return
    }

    const full = businessProfileDraftSchema.safeParse(draft)
    if (!full.success) {
      setErrors(zodFieldErrors(full.error.errors))
      toast.error(t('validationFailed'))
      return
    }

    setSaving(true)
    try {
      await updateOwnerBusinessProfileAction(profile.id, full.data)
      toast.success(t('saved'))
    } catch (error) {
      const message = error instanceof Error ? error.message : t('saveFailed')
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProfileWizardShell
      title={t('title')}
      subtitle={t('subtitle')}
      currentStep={step === 'preview' ? 'story' : step}
      stepLabels={stepLabels}
      steps={EDIT_STEPS}
    >
      {step === 'identity' ? (
        <ProfileStepIdentity
          draft={draft}
          directoryNameAr={profile.directory_name_ar}
          errors={errors}
          onChange={patchDraft}
        />
      ) : null}

      {step === 'story' ? (
        <ProfileStepStory draft={draft} errors={errors} onChange={patchDraft} />
      ) : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        {stepIndex > 0 ? (
          <Button type="button" variant="outline" onClick={goBack} disabled={saving}>
            {t('back')}
          </Button>
        ) : (
          <span />
        )}

        {step === 'identity' ? (
          <Button type="button" onClick={goNext}>
            {t('next')}
          </Button>
        ) : (
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        )}
      </div>
    </ProfileWizardShell>
  )
}
