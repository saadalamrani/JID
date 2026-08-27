'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  CAREER_EVIDENCE_CATEGORIES,
  type CareerEvidence,
  type CareerEvidenceCategory,
} from '@/types/contracts'
import { focusRingClass, touchTargetClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'
import { careerRecordFieldLabel, type CareerRecordCopy } from '../copy'
import { ADD_EVIDENCE_FIELD_KEYS, buildDeclaredFactPayload } from '../fact-display'

type FieldValues = Record<string, string>

const LONG_FIELDS = new Set(['description'])

function emptyValues(
  category: CareerEvidenceCategory,
  evidence?: CareerEvidence | null,
): FieldValues {
  const keys = ADD_EVIDENCE_FIELD_KEYS[category]
  const values: FieldValues = {}
  for (const key of keys) {
    const existing = evidence?.fact_payload[key]
    values[key] = typeof existing === 'string' ? existing : ''
  }
  return values
}

type CareerEvidenceFormDialogProps = {
  mode: 'add' | 'correct'
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: CareerRecordCopy
  evidence?: CareerEvidence | null
  onSubmit: (payload: {
    category: CareerEvidenceCategory
    fact_payload: Readonly<Record<string, unknown>>
  }) => void
}

export function CareerEvidenceFormDialog({
  mode,
  open,
  onOpenChange,
  copy,
  evidence = null,
  onSubmit,
}: CareerEvidenceFormDialogProps) {
  const initialCategory = evidence?.category ?? 'EXPERIENCE'
  const [category, setCategory] = useState<CareerEvidenceCategory>(initialCategory)
  const [values, setValues] = useState<FieldValues>(() => emptyValues(initialCategory, evidence))
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    const nextCategory = evidence?.category ?? 'EXPERIENCE'
    setCategory(nextCategory)
    setValues(emptyValues(nextCategory, evidence))
    setError(undefined)
  }, [open, evidence])

  const fields = useMemo(() => ADD_EVIDENCE_FIELD_KEYS[category], [category])

  function handleCategoryChange(next: CareerEvidenceCategory) {
    setCategory(next)
    setValues(emptyValues(next, next === evidence?.category ? evidence : null))
    setError(undefined)
  }

  function handleSubmit() {
    const factPayload = buildDeclaredFactPayload(values)
    if (Object.keys(factPayload).length === 0) {
      setError(copy.emptyDescription)
      return
    }
    onSubmit({ category, fact_payload: factPayload })
    onOpenChange(false)
  }

  const title = mode === 'add' ? copy.addDialogTitle : copy.correctDialogTitle

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={copy.close} className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === 'correct' ? copy.correctFactHint : copy.privateNotice}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField id="career-evidence-category" label={copy.categoryLabel}>
            <select
              id="career-evidence-category"
              className={cn(
                'flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground',
                focusRingClass,
              )}
              value={category}
              disabled={mode === 'correct'}
              onChange={(event) =>
                handleCategoryChange(event.target.value as CareerEvidenceCategory)
              }
            >
              {CAREER_EVIDENCE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {copy.category[item]}
                </option>
              ))}
            </select>
          </FormField>

          {fields.map((field) => {
            const id = `career-evidence-${field}`
            const label = careerRecordFieldLabel(copy, field)
            const Control = LONG_FIELDS.has(field) ? Textarea : Input
            return (
              <FormField
                key={field}
                id={id}
                label={label}
                error={field === fields[0] ? error : undefined}
              >
                <Control
                  id={id}
                  value={values[field] ?? ''}
                  onChange={(event) => {
                    setValues((current) => ({ ...current, [field]: event.target.value }))
                    setError(undefined)
                  }}
                />
              </FormField>
            )
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <Button
            type="button"
            size="lg"
            className={cn(touchTargetClass, focusRingClass)}
            onClick={handleSubmit}
          >
            {mode === 'add' ? copy.saveDeclared : copy.saveCorrection}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
