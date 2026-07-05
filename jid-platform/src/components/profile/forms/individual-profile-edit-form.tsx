'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { FocusSection } from '@/components/profile/forms/focus-section'
import { useFocusField } from '@/components/profile/forms/use-focus-field'
import { ProfileCompletionBar } from '@/components/profile/profile-completion-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateProfileCompletionPct } from '@/lib/profile/completion-calculator'
import { uploadProfileAvatar, updateIndividualProfile } from '@/lib/profile/mutations'
import type { ProfilePageContext, SkillCatalogRow } from '@/lib/profile/queries'
import {
  individualProfileEditSchema,
  type IndividualProfileEditValues,
} from '@/lib/validations/profile'
import { cn } from '@/lib/utils'

type IndividualProfileEditFormProps = {
  context: ProfilePageContext
  skillsCatalog: SkillCatalogRow[]
  skillIds: string[]
  focus?: string | null
}

function parseSmartLink(links: Record<string, unknown>, key: string): string {
  const value = links[key]
  return typeof value === 'string' ? value : ''
}

function toFormValues(
  context: ProfilePageContext,
  skillIds: string[],
): IndividualProfileEditValues {
  const { profile } = context
  return {
    avatar_url: profile.avatar_url ?? '',
    headline: profile.headline ?? '',
    about_me: profile.about_me ?? '',
    target_sectors: profile.target_sectors,
    target_program_types: profile.target_program_types,
    target_regions: profile.target_regions,
    linkedin_url: profile.linkedin_url ?? '',
    smart_links: {
      linkedin: parseSmartLink(profile.smart_links, 'linkedin'),
      github: parseSmartLink(profile.smart_links, 'github'),
      portfolio: parseSmartLink(profile.smart_links, 'portfolio'),
      custom: parseSmartLink(profile.smart_links, 'custom'),
    },
    skill_ids: skillIds,
  }
}

export function IndividualProfileEditForm({
  context,
  skillsCatalog,
  skillIds,
  focus = null,
}: IndividualProfileEditFormProps) {
  const t = useTranslations('profile.edit')
  const router = useRouter()
  useFocusField(focus)
  const [uploading, setUploading] = useState(false)

  const form = useForm<IndividualProfileEditValues>({
    resolver: zodResolver(individualProfileEditSchema),
    defaultValues: toFormValues(context, skillIds),
  })

  const watched = form.watch()
  const optimisticPct = useMemo(
    () =>
      calculateProfileCompletionPct({
        avatar_url: watched.avatar_url,
        headline: watched.headline,
        about_me: watched.about_me,
        university_id: context.profile.university_id,
        college_id: context.profile.college_id,
        skill_count: watched.skill_ids.length,
        target_sectors: watched.target_sectors,
        linkedin_url: watched.linkedin_url,
        smart_links: watched.smart_links,
      }),
    [watched, context.profile.university_id, context.profile.college_id],
  )

  async function handleAvatarFile(file: File) {
    setUploading(true)
    try {
      const url = await uploadProfileAvatar(file)
      form.setValue('avatar_url', url, { shouldDirty: true })
      toast.success(t('avatarUploaded'))
    } catch {
      toast.error(t('avatarUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: IndividualProfileEditValues) {
    try {
      await updateIndividualProfile(values)
      toast.success(t('saved'))
      router.push('/profile')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'))
    }
  }

  const aboutLength = watched.about_me?.length ?? 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="container-jid space-y-6 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-jid-ink">{t('individualTitle')}</h1>
        <div className="w-full sm:max-w-xs">
          <p className="mb-1 text-xs text-jid-ink/50">{t('optimisticCompletion')}</p>
          <ProfileCompletionBar percent={optimisticPct} showLabel={false} />
        </div>
      </div>

      <FocusSection id="field-avatar" title={t('sectionAvatar')}>
        <div className="space-y-3">
          <FormField id="avatar_url" label={t('avatarUrl')} error={form.formState.errors.avatar_url?.message}>
            <Input id="avatar_url" {...form.register('avatar_url')} placeholder="https://" dir="ltr" />
          </FormField>
          <div>
            <label className="text-sm text-jid-ink/70" htmlFor="avatar_file">
              {t('avatarUpload')}
            </label>
            <Input
              id="avatar_file"
              type="file"
              accept="image/*"
              className="mt-1"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleAvatarFile(file)
              }}
            />
          </div>
        </div>
      </FocusSection>

      <FocusSection id="field-headline" title={t('sectionHeadline')}>
        <FormField id="headline" label={t('headline')} error={form.formState.errors.headline?.message}>
          <Input id="headline" {...form.register('headline')} />
        </FormField>
      </FocusSection>

      <FocusSection id="field-about" title={t('sectionAbout')}>
        <FormField id="about_me" label={t('aboutMe')} error={form.formState.errors.about_me?.message}>
          <textarea
            id="about_me"
            rows={5}
            maxLength={500}
            className="flex w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm"
            {...form.register('about_me')}
          />
          <p className="mt-1 text-xs text-jid-ink/50">{t('aboutMeCount', { count: aboutLength })}</p>
        </FormField>
      </FocusSection>

      <FocusSection id="field-university" title={t('sectionUniversity')}>
        <p className="text-sm text-jid-ink/60">{t('universityHint')}</p>
      </FocusSection>

      <FocusSection id="field-targets" title={t('sectionTargets')}>
        <TagListEditor
          label={t('targetSectors')}
          hint={t('targetSectorsHint')}
          items={watched.target_sectors}
          maxItems={3}
          onAdd={(value) => {
            if (watched.target_sectors.length >= 3) return
            form.setValue('target_sectors', [...watched.target_sectors, value], { shouldDirty: true })
          }}
          onRemove={(index) => {
            form.setValue(
              'target_sectors',
              watched.target_sectors.filter((_, i) => i !== index),
              { shouldDirty: true },
            )
          }}
        />
        <TagListEditor
          className="mt-4"
          label={t('targetProgramTypes')}
          items={watched.target_program_types}
          onAdd={(value) =>
            form.setValue('target_program_types', [...watched.target_program_types, value], {
              shouldDirty: true,
            })
          }
          onRemove={(index) =>
            form.setValue(
              'target_program_types',
              watched.target_program_types.filter((_, i) => i !== index),
              { shouldDirty: true },
            )
          }
        />
        <TagListEditor
          className="mt-4"
          label={t('targetRegions')}
          items={watched.target_regions}
          onAdd={(value) =>
            form.setValue('target_regions', [...watched.target_regions, value], { shouldDirty: true })
          }
          onRemove={(index) =>
            form.setValue(
              'target_regions',
              watched.target_regions.filter((_, i) => i !== index),
              { shouldDirty: true },
            )
          }
        />
      </FocusSection>

      <FocusSection id="field-links" title={t('sectionLinks')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="linkedin_url" label={t('linkedin')} error={form.formState.errors.linkedin_url?.message}>
            <Input id="linkedin_url" {...form.register('linkedin_url')} dir="ltr" />
          </FormField>
          <FormField id="github" label={t('github')}>
            <Input id="github" {...form.register('smart_links.github')} dir="ltr" />
          </FormField>
          <FormField id="portfolio" label={t('portfolio')}>
            <Input id="portfolio" {...form.register('smart_links.portfolio')} dir="ltr" />
          </FormField>
          <FormField id="custom" label={t('customLink')}>
            <Input id="custom" {...form.register('smart_links.custom')} dir="ltr" />
          </FormField>
        </div>
      </FocusSection>

      <FocusSection id="field-skills" title={t('sectionSkills')}>
        <div className="flex flex-wrap gap-2">
          {skillsCatalog.map((skill) => {
            const selected = watched.skill_ids.includes(skill.id)
            return (
              <button
                key={skill.id}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  selected
                    ? 'border-jid-olive bg-jid-olive/10 text-jid-olive'
                    : 'border-jid-line text-jid-ink/70 hover:border-jid-gold/50',
                )}
                onClick={() => {
                  const next = selected
                    ? watched.skill_ids.filter((id) => id !== skill.id)
                    : [...watched.skill_ids, skill.id]
                  form.setValue('skill_ids', next, { shouldDirty: true })
                }}
              >
                {skill.name_ar ?? skill.name}
              </button>
            )
          })}
        </div>
      </FocusSection>

      <div className="flex gap-3">
        <Button type="submit" className="bg-jid-olive hover:bg-jid-olive/90" disabled={form.formState.isSubmitting}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/profile')}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}

function TagListEditor({
  label,
  hint,
  items,
  maxItems,
  onAdd,
  onRemove,
  className,
}: {
  label: string
  hint?: string
  items: string[]
  maxItems?: number
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  className?: string
}) {
  const t = useTranslations('profile.edit')
  const [draft, setDraft] = useState('')

  return (
    <div className={className}>
      <p className="text-sm font-medium text-jid-ink">{label}</p>
      {hint ? <p className="text-xs text-jid-ink/50">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-jid-beige px-3 py-1 text-xs"
          >
            {item}
            <button type="button" className="text-jid-ink/50 hover:text-jid-ink" onClick={() => onRemove(index)}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('tagPlaceholder')}
          disabled={maxItems != null && items.length >= maxItems}
        />
        <Button
          type="button"
          variant="outline"
          disabled={!draft.trim() || (maxItems != null && items.length >= maxItems)}
          onClick={() => {
            onAdd(draft.trim())
            setDraft('')
          }}
        >
          {t('addTag')}
        </Button>
      </div>
    </div>
  )
}
