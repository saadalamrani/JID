'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateMentorProfile } from '@/lib/profile/mutations'
import type { MentorProfileRecord } from '@/lib/profile/types'
import {
  mentorProfileEditSchema,
  type MentorProfileEditValues,
} from '@/lib/validations/profile'
import { cn } from '@/lib/utils'

type MentorProfileEditFormProps = {
  mentor: MentorProfileRecord
}

export function MentorProfileEditForm({ mentor }: MentorProfileEditFormProps) {
  const t = useTranslations('profile.edit')
  const router = useRouter()
  const [sectorDraft, setSectorDraft] = useState('')

  const form = useForm<MentorProfileEditValues>({
    resolver: zodResolver(mentorProfileEditSchema),
    defaultValues: {
      bio_long: mentor.bio_long ?? '',
      career_history: mentor.career_history.length > 0 ? mentor.career_history : [],
      expertise_sectors: mentor.expertise_sectors,
    },
  })

  const career = useFieldArray({ control: form.control, name: 'career_history' })
  const sectors = form.watch('expertise_sectors')

  async function onSubmit(values: MentorProfileEditValues) {
    try {
      const payload = {
        ...values,
        career_history: values.career_history.filter((entry) => entry.title?.trim()),
      }
      await updateMentorProfile(payload)
      toast.success(t('saved'))
      router.push('/mentor/profile')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'))
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="container-jid space-y-6 py-8">
      <h1 className="text-xl font-semibold text-foreground">{t('mentorTitle')}</h1>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <FormField id="bio_long" label={t('bioLong')}>
          <textarea
            id="bio_long"
            rows={6}
            className="flex w-full rounded-md border border-border px-3 py-2 text-sm"
            {...form.register('bio_long')}
          />
        </FormField>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">{t('sectionCareer')}</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => career.append({ title: '', company: '', description: '' })}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('addCareerEntry')}
          </Button>
        </div>
        <div className="space-y-4">
          {career.fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-lg border border-border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder={t('careerTitle')} {...form.register(`career_history.${index}.title`)} />
                <Input placeholder={t('careerCompany')} {...form.register(`career_history.${index}.company`)} />
                <Input
                  type="number"
                  placeholder={t('careerStartYear')}
                  {...form.register(`career_history.${index}.start_year`)}
                />
                <Input
                  type="number"
                  placeholder={t('careerEndYear')}
                  {...form.register(`career_history.${index}.end_year`)}
                />
              </div>
              <textarea
                rows={2}
                placeholder={t('careerDescription')}
                className="flex w-full rounded-md border border-border px-3 py-2 text-sm"
                {...form.register(`career_history.${index}.description`)}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => career.remove(index)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('removeCareerEntry')}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('sectionExpertise')}</h2>
        <div className="flex flex-wrap gap-2">
          {sectors.map((sector, index) => (
            <span key={`${sector}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              {sector}
              <button
                type="button"
                onClick={() =>
                  form.setValue(
                    'expertise_sectors',
                    sectors.filter((_, i) => i !== index),
                    { shouldDirty: true },
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={sectorDraft} onChange={(e) => setSectorDraft(e.target.value)} placeholder={t('tagPlaceholder')} />
          <Button
            type="button"
            variant="outline"
            disabled={!sectorDraft.trim()}
            onClick={() => {
              form.setValue('expertise_sectors', [...sectors, sectorDraft.trim()], { shouldDirty: true })
              setSectorDraft('')
            }}
          >
            {t('addTag')}
          </Button>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" className={cn('bg-primary hover:bg-primary/90')} disabled={form.formState.isSubmitting}>
          {t('save')}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/mentor/profile')}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
