'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { TagInput } from '@/app/[locale]/(individual)/settings/become-mentor/_components/form-fields'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import { useUpdateCvSkills } from '@/lib/cv/queries'
import {
  cvRecordToSkillsSectionValues,
  cvSkillsSectionSchema,
  normalizeSkillsPatch,
  type CvSkillsSectionInput,
} from '@/lib/cv/schemas/skills-section'
import type { CvFullRecord } from '@/types/cv'
import { LanguageEditor } from './language-editor'

type SectionSkillsFormProps = {
  cv: CvFullRecord
}

/** Section 7.9 — technical skills tags + languages JSONB with debounced auto-save. */
export function SectionSkillsForm({ cv }: SectionSkillsFormProps) {
  const t = useTranslations('cv.builder.skills')
  const updateSkills = useUpdateCvSkills(cv.id)

  const form = useForm<CvSkillsSectionInput>({
    resolver: zodResolver(cvSkillsSectionSchema),
    defaultValues: cvRecordToSkillsSectionValues(cv),
    mode: 'onChange',
  })

  const { watch, getValues, reset, control, formState: { errors } } = form

  useEffect(() => {
    reset(cvRecordToSkillsSectionValues(cv))
  }, [cv.id, cv.updated_at, reset, cv])

  const save = useCallback(
    async (values: CvSkillsSectionInput) => {
      const candidate = {
        ...values,
        languages: values.languages.filter((entry) => entry.name.trim()),
      }
      const parsed = cvSkillsSectionSchema.safeParse(candidate)
      if (!parsed.success) return
      await updateSkills.mutateAsync(normalizeSkillsPatch(parsed.data))
    },
    [updateSkills],
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
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {saveLabel}
      </p>

      <Controller
        name="technical_skills"
        control={control}
        render={({ field }) => (
          <TagInput
            label={t('technicalSkills')}
            hint={t('technicalSkillsHint')}
            items={field.value}
            maxItems={50}
            onChange={field.onChange}
            error={typeof errors.technical_skills?.message === 'string' ? errors.technical_skills.message : undefined}
            placeholder={t('technicalSkillsPlaceholder')}
            addLabel={t('addSkill')}
          />
        )}
      />

      <Controller
        name="languages"
        control={control}
        render={({ field }) => (
          <LanguageEditor
            languages={field.value}
            onChange={field.onChange}
            error={typeof errors.languages?.message === 'string' ? errors.languages.message : undefined}
          />
        )}
      />
    </form>
  )
}
