'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import {
  cvExperienceEntrySchema,
  experienceRecordToFormValues,
  normalizeExperienceUpdate,
  type CvExperienceDbPatch,
  type CvExperienceEntryInput,
} from '@/lib/cv/schemas/experience'
import type { CvExperienceRecord } from '@/types/cv'
import { cn } from '@/lib/utils'
import { BulletEditor } from './bullet-editor'

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)
const YEARS = Array.from({ length: 56 }, (_, index) => 2100 - index)

const selectClassName =
  'flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground'

function fieldError(message: unknown): string | undefined {
  return typeof message === 'string' ? message : undefined
}

type ExperienceEntryCardProps = {
  entry: CvExperienceRecord
  index: number
  onSave: (entryId: string, patch: CvExperienceDbPatch) => Promise<void>
  onRemove: (entryId: string) => void
  isRemoving?: boolean
}

/** Section 7.8 — single experience entry with drag handle, dates, and bullet achievements. */
export function ExperienceEntryCard({
  entry,
  index,
  onSave,
  onRemove,
  isRemoving = false,
}: ExperienceEntryCardProps) {
  const t = useTranslations('cv.builder.experience')
  const isTemp = entry.id.startsWith('temp-')

  const form = useForm<CvExperienceEntryInput>({
    resolver: zodResolver(cvExperienceEntrySchema),
    defaultValues: experienceRecordToFormValues(entry),
    mode: 'onChange',
  })

  const {
    register,
    watch,
    getValues,
    reset,
    setValue,
    control,
    formState: { errors },
  } = form

  useEffect(() => {
    reset(experienceRecordToFormValues(entry))
  }, [entry.id, reset, entry])

  const save = useCallback(
    async (values: CvExperienceEntryInput) => {
      if (isTemp) return
      const parsed = cvExperienceEntrySchema.safeParse(values)
      if (!parsed.success) return
      await onSave(entry.id, normalizeExperienceUpdate(parsed.data))
    },
    [entry.id, isTemp, onSave],
  )

  const { status, secondsAgo } = useAutoSave({
    watch,
    getValues,
    onSave: save,
    enabled: !isTemp,
    onError: () => toast.error(t('saveError')),
  })

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    disabled: isTemp,
  })

  const saveLabel =
    status === 'pending' || status === 'saving'
      ? t('savePending')
      : status === 'saved'
        ? t('saveSaved', { seconds: secondsAgo })
        : status === 'error'
          ? t('saveError')
          : null

  const isCurrent = watch('is_current')

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-sm',
        isDragging && 'z-10 opacity-60',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className={cn(
              'touch-manipulation rounded p-1 text-foreground/40 hover:bg-muted hover:text-muted-foreground',
              isTemp ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing',
            )}
            aria-label={t('dragHandle', { index: index + 1 })}
            disabled={isTemp}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.company_name || t('untitledEntry')}
            </p>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {saveLabel}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(entry.id)}
          disabled={isRemoving || isTemp}
          aria-label={t('removeEntry')}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="space-y-4">
        <FormField
          id={`${entry.id}-company_name`}
          label={t('organizationName')}
          error={fieldError(errors.company_name?.message)}
        >
          <Input id={`${entry.id}-company_name`} {...register('company_name')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id={`${entry.id}-company_city`}
            label={t('organizationCity')}
            error={fieldError(errors.company_city?.message)}
          >
            <Input id={`${entry.id}-company_city`} {...register('company_city')} />
          </FormField>
          <FormField
            id={`${entry.id}-company_country`}
            label={t('organizationCountry')}
            error={fieldError(errors.company_country?.message)}
          >
            <Input id={`${entry.id}-company_country`} {...register('company_country')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id={`${entry.id}-job_title`}
            label={t('roleTitle')}
            error={fieldError(errors.job_title?.message)}
          >
            <Input id={`${entry.id}-job_title`} {...register('job_title')} />
          </FormField>
          <FormField
            id={`${entry.id}-employment_type`}
            label={t('roleSubtitle')}
            error={fieldError(errors.employment_type?.message)}
          >
            <Input id={`${entry.id}-employment_type`} {...register('employment_type')} />
          </FormField>
        </div>

        <fieldset className="space-y-3 rounded-md border border-border p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">{t('datesTitle')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id={`${entry.id}-start_month`}
              label={t('startMonth')}
              error={fieldError(errors.start_month?.message)}
            >
              <select
                id={`${entry.id}-start_month`}
                className={selectClassName}
                {...register('start_month')}
              >
                <option value="">{t('monthPlaceholder')}</option>
                {MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              id={`${entry.id}-start_year`}
              label={t('startYear')}
              error={fieldError(errors.start_year?.message)}
            >
              <select
                id={`${entry.id}-start_year`}
                className={selectClassName}
                {...register('start_year')}
              >
                <option value="">{t('yearPlaceholder')}</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              {...register('is_current')}
              onChange={(event) => {
                const checked = event.target.checked
                setValue('is_current', checked, { shouldDirty: true, shouldValidate: true })
                if (checked) {
                  setValue('end_month', null, { shouldDirty: true })
                  setValue('end_year', null, { shouldDirty: true })
                }
              }}
            />
            {t('currentlyWorking')}
          </label>

          {!isCurrent ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id={`${entry.id}-end_month`}
                label={t('endMonth')}
                error={fieldError(errors.end_month?.message)}
              >
                <select
                  id={`${entry.id}-end_month`}
                  className={selectClassName}
                  {...register('end_month')}
                >
                  <option value="">{t('monthPlaceholder')}</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField
                id={`${entry.id}-end_year`}
                label={t('endYear')}
                error={fieldError(errors.end_year?.message)}
              >
                <select
                  id={`${entry.id}-end_year`}
                  className={selectClassName}
                  {...register('end_year')}
                >
                  <option value="">{t('yearPlaceholder')}</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          ) : null}
        </fieldset>

        <Controller
          name="bullets"
          control={control}
          render={({ field }) => (
            <BulletEditor
              bullets={field.value}
              onChange={field.onChange}
              error={fieldError(errors.bullets?.message)}
            />
          )}
        />
      </div>
    </article>
  )
}
