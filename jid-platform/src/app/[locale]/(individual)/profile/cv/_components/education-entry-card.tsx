'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import {
  cvEducationEntrySchema,
  educationRecordToFormValues,
  normalizeEducationUpdate,
  type CvEducationDbPatch,
  type CvEducationEntryInput,
} from '@/lib/cv/schemas/education'
import type { CvEducationRecord } from '@/types/cv'
import { cn } from '@/lib/utils'

function fieldError(message: unknown): string | undefined {
  return typeof message === 'string' ? message : undefined
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)
const YEARS = Array.from({ length: 56 }, (_, index) => 2100 - index)

const selectClassName =
  'flex h-10 w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink'

const textareaClassName =
  'flex w-full rounded-md border border-jid-line bg-white px-3 py-2 text-sm text-jid-ink'

type EducationEntryCardProps = {
  entry: CvEducationRecord
  index: number
  onSave: (entryId: string, patch: CvEducationDbPatch) => Promise<void>
  onRemove: (entryId: string) => void
  isRemoving?: boolean
}

/** Section 7.7 — single education entry with drag handle + debounced auto-save. */
export function EducationEntryCard({
  entry,
  index,
  onSave,
  onRemove,
  isRemoving = false,
}: EducationEntryCardProps) {
  const t = useTranslations('cv.builder.education')
  const isTemp = entry.id.startsWith('temp-')

  const form = useForm<CvEducationEntryInput>({
    resolver: zodResolver(cvEducationEntrySchema),
    defaultValues: educationRecordToFormValues(entry),
    mode: 'onChange',
  })

  const {
    register,
    watch,
    getValues,
    reset,
    setValue,
    formState: { errors },
  } = form

  useEffect(() => {
    reset(educationRecordToFormValues(entry))
  }, [entry.id, reset, entry])

  const save = useCallback(
    async (values: CvEducationEntryInput) => {
      if (isTemp) return
      const parsed = cvEducationEntrySchema.safeParse(values)
      if (!parsed.success) return
      await onSave(entry.id, normalizeEducationUpdate(parsed.data))
    },
    [entry.id, isTemp, onSave],
  )

  const { status, secondsAgo } = useAutoSave({
    watch,
    getValues,
    onSave: save,
    enabled: !isTemp,
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
        'rounded-lg border border-jid-line bg-white p-4 shadow-sm',
        isDragging && 'z-10 opacity-60',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className={cn(
              'touch-manipulation rounded p-1 text-jid-ink/40 hover:bg-jid-beige/60 hover:text-jid-ink/70',
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
            <p className="truncate text-sm font-medium text-jid-ink">
              {entry.institution_name || t('untitledEntry')}
            </p>
            <p className="text-xs text-jid-ink/50" aria-live="polite">
              {saveLabel}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-jid-ink/50 hover:text-destructive"
          onClick={() => onRemove(entry.id)}
          disabled={isRemoving || isTemp}
          aria-label={t('removeEntry')}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="space-y-4">
        <FormField
          id={`${entry.id}-institution_name`}
          label={t('institutionName')}
          error={fieldError(errors.institution_name?.message)}
        >
          <Input id={`${entry.id}-institution_name`} {...register('institution_name')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id={`${entry.id}-institution_city`}
            label={t('institutionCity')}
            error={fieldError(errors.institution_city?.message)}
          >
            <Input id={`${entry.id}-institution_city`} {...register('institution_city')} />
          </FormField>
          <FormField
            id={`${entry.id}-institution_country`}
            label={t('institutionCountry')}
            error={fieldError(errors.institution_country?.message)}
          >
            <Input id={`${entry.id}-institution_country`} {...register('institution_country')} />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${entry.id}-degree`} label={t('degree')} error={fieldError(errors.degree?.message)}>
            <Input id={`${entry.id}-degree`} {...register('degree')} />
          </FormField>
          <FormField
            id={`${entry.id}-field_of_study`}
            label={t('fieldOfStudy')}
            error={fieldError(errors.field_of_study?.message)}
          >
            <Input id={`${entry.id}-field_of_study`} {...register('field_of_study')} />
          </FormField>
        </div>

        <fieldset className="space-y-3 rounded-md border border-jid-line/70 p-3">
          <legend className="px-1 text-xs font-medium text-jid-ink/70">{t('datesTitle')}</legend>
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

          <label className="flex items-center gap-2 text-sm text-jid-ink/80">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-jid-line"
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
            {t('currentlyStudying')}
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

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            id={`${entry.id}-gpa_value`}
            label={t('gpaValue')}
            error={fieldError(errors.gpa_value?.message)}
          >
            <Input
              id={`${entry.id}-gpa_value`}
              type="number"
              step="0.01"
              min={0}
              {...register('gpa_value')}
            />
          </FormField>
          <FormField
            id={`${entry.id}-gpa_scale`}
            label={t('gpaScale')}
            error={fieldError(errors.gpa_scale?.message)}
          >
            <Input
              id={`${entry.id}-gpa_scale`}
              type="number"
              step="0.01"
              min={0}
              {...register('gpa_scale')}
            />
          </FormField>
          <FormField
            id={`${entry.id}-graduation_year`}
            label={t('graduationYear')}
            error={fieldError(errors.graduation_year?.message)}
          >
            <select
              id={`${entry.id}-graduation_year`}
              className={selectClassName}
              {...register('graduation_year')}
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

        <FormField id={`${entry.id}-honors`} label={t('honors')} error={fieldError(errors.honors?.message)}>
          <Input id={`${entry.id}-honors`} {...register('honors')} placeholder={t('honorsPlaceholder')} />
        </FormField>

        <FormField
          id={`${entry.id}-relevant_coursework`}
          label={t('coursework')}
          hint={t('courseworkHint')}
          error={fieldError(errors.relevant_coursework?.message)}
        >
          <textarea
            id={`${entry.id}-relevant_coursework`}
            rows={4}
            className={textareaClassName}
            {...register('relevant_coursework')}
          />
        </FormField>
      </div>
    </article>
  )
}
