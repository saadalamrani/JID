'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/auth/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAutoSave } from '@/lib/hooks/use-auto-save'
import {
  additionalRecordToFormValues,
  cvAdditionalEntrySchema,
  normalizeAdditionalUpdate,
  type CvAdditionalDbPatch,
  type CvAdditionalEntryInput,
} from '@/lib/cv/schemas/additional'
import type { CvAdditionalRecord } from '@/types/cv'

const textareaClassName =
  'flex w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground'

function fieldError(message: unknown): string | undefined {
  return typeof message === 'string' ? message : undefined
}

type AdditionalEntryCardProps = {
  entry: CvAdditionalRecord
  onSave: (entryId: string, patch: CvAdditionalDbPatch) => Promise<void>
  onRemove: (entryId: string) => void
  isRemoving?: boolean
}

export function AdditionalEntryCard({
  entry,
  onSave,
  onRemove,
  isRemoving = false,
}: AdditionalEntryCardProps) {
  const t = useTranslations('cv.builder.additional')
  const isTemp = entry.id.startsWith('temp-')

  const form = useForm<CvAdditionalEntryInput>({
    resolver: zodResolver(cvAdditionalEntrySchema),
    defaultValues: additionalRecordToFormValues(entry),
    mode: 'onChange',
  })

  const { register, watch, getValues, reset, formState: { errors } } = form

  useEffect(() => {
    reset(additionalRecordToFormValues(entry))
  }, [entry.id, reset, entry])

  const save = useCallback(
    async (values: CvAdditionalEntryInput) => {
      if (isTemp) return
      const parsed = cvAdditionalEntrySchema.safeParse(values)
      if (!parsed.success) return
      await onSave(entry.id, normalizeAdditionalUpdate(parsed.data))
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

  const saveLabel =
    status === 'pending' || status === 'saving'
      ? t('savePending')
      : status === 'saved'
        ? t('saveSaved', { seconds: secondsAgo })
        : status === 'error'
          ? t('saveError')
          : null

  return (
    <article className="rounded-lg border border-border bg-background/10 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {saveLabel}
        </p>
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

      <div className="space-y-3">
        <FormField id={`${entry.id}-title`} label={t('title')} error={fieldError(errors.title?.message)}>
          <Input id={`${entry.id}-title`} {...register('title')} />
        </FormField>

        <FormField id={`${entry.id}-issuer`} label={t('issuer')} error={fieldError(errors.issuer?.message)}>
          <Input id={`${entry.id}-issuer`} {...register('issuer')} />
        </FormField>

        <FormField id={`${entry.id}-start_date`} label={t('date')} error={fieldError(errors.start_date?.message)}>
          <Input id={`${entry.id}-start_date`} type="date" {...register('start_date')} />
        </FormField>

        <FormField
          id={`${entry.id}-description`}
          label={t('description')}
          error={fieldError(errors.description?.message)}
        >
          <textarea
            id={`${entry.id}-description`}
            rows={3}
            className={textareaClassName}
            {...register('description')}
          />
        </FormField>
      </div>
    </article>
  )
}
