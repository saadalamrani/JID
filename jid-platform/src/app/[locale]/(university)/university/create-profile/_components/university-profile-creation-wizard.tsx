'use client'

import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/auth/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/lib/i18n/navigation'
import {
  universityProfileDraftSchema,
  universityProfileIdentitySchema,
  EMPTY_UNIVERSITY_PROFILE_DRAFT,
  type UniversityProfileDraft,
} from '@/lib/validations/university-profile'
import { createUniversityProfileAction } from '../actions'
import { ProfileWizardShell } from '@/app/[locale]/(company)/company/create-profile/_components/profile-wizard-shell'

const UNIVERSITY_WIZARD_STEPS = ['identity', 'preview'] as const
type UniversityWizardStep = (typeof UNIVERSITY_WIZARD_STEPS)[number]

type UniversityProfileCreationWizardProps = {
  verificationId: string
  directoryNameAr: string | null
  suggestedDisplayNameAr: string
}

function zodFieldErrors(error: { path: (string | number)[]; message: string }[]) {
  const map: Partial<Record<keyof UniversityProfileDraft, string>> = {}
  for (const issue of error) {
    const key = issue.path[0]
    if (typeof key === 'string' && !map[key as keyof UniversityProfileDraft]) {
      map[key as keyof UniversityProfileDraft] = issue.message
    }
  }
  return map
}

export function UniversityProfileCreationWizard({
  verificationId,
  directoryNameAr,
  suggestedDisplayNameAr,
}: UniversityProfileCreationWizardProps) {
  const t = useTranslations('university.profileCreation')
  const router = useRouter()
  const [step, setStep] = useState<UniversityWizardStep>('identity')
  const [draft, setDraft] = useState<UniversityProfileDraft>({
    ...EMPTY_UNIVERSITY_PROFILE_DRAFT,
    display_name_ar: suggestedDisplayNameAr,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof UniversityProfileDraft, string>>>({})
  const [creating, setCreating] = useState(false)

  const stepLabels: Record<UniversityWizardStep, string> = {
    identity: t('steps.identity'),
    preview: t('steps.preview'),
  }

  const stepIndex = UNIVERSITY_WIZARD_STEPS.indexOf(step)

  const patchDraft = useCallback((patch: Partial<UniversityProfileDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setErrors({})
  }, [])

  function validateIdentity() {
    const result = universityProfileIdentitySchema.safeParse(draft)
    if (result.success) return true
    setErrors(zodFieldErrors(result.error.errors))
    return false
  }

  async function handleCreate() {
    const full = universityProfileDraftSchema.safeParse(draft)
    if (!full.success) {
      setErrors(zodFieldErrors(full.error.errors))
      toast.error(t('validationFailed'))
      return
    }

    setCreating(true)
    try {
      await createUniversityProfileAction(verificationId, full.data)
      toast.success(t('created'))
      router.push('/university/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : t('createFailed')
      toast.error(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <ProfileWizardShell
      title={t('title')}
      subtitle={t('subtitle')}
      currentStep={step}
      stepLabels={stepLabels}
      steps={UNIVERSITY_WIZARD_STEPS}
    >
      {step === 'identity' ? (
        <div className="space-y-4">
          {directoryNameAr ? (
            <p className="rounded-md bg-background p-3 text-sm text-foreground/70">
              {t('identity.directoryHint', { name: directoryNameAr })}
            </p>
          ) : null}

          <FormField
            id="display_name_ar"
            label={t('identity.displayNameAr')}
            error={errors.display_name_ar}
          >
            <Input
              id="display_name_ar"
              value={draft.display_name_ar}
              onChange={(e) => patchDraft({ display_name_ar: e.target.value })}
            />
          </FormField>

          <FormField
            id="display_name_en"
            label={t('identity.displayNameEn')}
            error={errors.display_name_en}
          >
            <Input
              id="display_name_en"
              dir="ltr"
              className="text-start"
              value={draft.display_name_en ?? ''}
              onChange={(e) => patchDraft({ display_name_en: e.target.value })}
            />
          </FormField>

          <FormField id="about_ar" label={t('identity.aboutAr')} error={errors.about_ar}>
            <Textarea
              id="about_ar"
              rows={4}
              value={draft.about_ar ?? ''}
              onChange={(e) => patchDraft({ about_ar: e.target.value })}
            />
          </FormField>

          <FormField id="about_en" label={t('identity.aboutEn')} error={errors.about_en}>
            <Textarea
              id="about_en"
              rows={4}
              dir="ltr"
              className="text-start"
              value={draft.about_en ?? ''}
              onChange={(e) => patchDraft({ about_en: e.target.value })}
            />
          </FormField>
        </div>
      ) : null}

      {step === 'preview' ? (
        <div className="space-y-4">
          <p className="text-sm text-foreground/70">{t('preview.intro')}</p>
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-lg font-semibold text-foreground">
              {draft.display_name_ar || t('preview.unnamed')}
            </p>
            {draft.display_name_en ? (
              <p className="text-sm text-foreground/70" dir="ltr">
                {draft.display_name_en}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-foreground/80">
              {draft.about_ar?.trim() || draft.about_en?.trim() || t('preview.noAbout')}
            </p>
            <p className="mt-4 text-xs text-foreground/50">{t('preview.strangerNote')}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        {stepIndex > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep('identity')} disabled={creating}>
            {t('back')}
          </Button>
        ) : (
          <span />
        )}

        {step !== 'preview' ? (
          <Button
            type="button"
            onClick={() => {
              if (validateIdentity()) setStep('preview')
            }}
          >
            {t('next')}
          </Button>
        ) : (
          <Button type="button" onClick={() => void handleCreate()} disabled={creating}>
            {creating ? t('creating') : t('create')}
          </Button>
        )}
      </div>
    </ProfileWizardShell>
  )
}
