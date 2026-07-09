'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { createSearchMandate } from '@/app/[locale]/(public)/opportunities/abhathli-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { abhathliMandatesQueryKey } from '@/lib/abhathli/client'
import { ABHATHLI_MAX_ACTIVE_MANDATES } from '@/lib/abhathli/constants'
import {
  DEFAULT_JOB_FILTER_STATE,
  resolveExperienceLevelsFromChips,
  type JobFilterState,
} from '@/types/job'
import { EntityTypeChips } from './entity-type-chips'
import { ExperienceLevelChips } from './experience-level-chips'
import { MandateFilterProvider } from './job-filter-context'
import { RegionMultiSelect } from './region-multi-select'
import { SectorMultiSelect } from './sector-multi-select'

type MandateSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeMandateCount: number
}

const STEPS = ['name', 'filters', 'keywords', 'review'] as const
type MandateStep = (typeof STEPS)[number]

function MandateSheetBody({
  step,
  name,
  setName,
  keywordsText,
  setKeywordsText,
  includeLammah,
  setIncludeLammah,
  filters,
}: {
  step: MandateStep
  name: string
  setName: (v: string) => void
  keywordsText: string
  setKeywordsText: (v: string) => void
  includeLammah: boolean
  setIncludeLammah: (v: boolean) => void
  filters: JobFilterState
}) {
  const t = useTranslations('opportunities.abhathli.sheet')

  if (step === 'name') {
    return (
      <div className="space-y-2">
        <Label htmlFor="mandate-name">{t('nameLabel')}</Label>
        <Input
          id="mandate-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className="font-arabic"
        />
      </div>
    )
  }

  if (step === 'filters') {
    return (
      <div className="space-y-4">
        <p className="font-arabic text-sm text-muted-foreground">{t('filtersHint')}</p>
        <ExperienceLevelChips />
        <div className="grid gap-4 sm:grid-cols-2">
          <EntityTypeChips />
          <SectorMultiSelect />
          <RegionMultiSelect />
        </div>
      </div>
    )
  }

  if (step === 'keywords') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mandate-keywords">{t('keywordsLabel')}</Label>
          <Input
            id="mandate-keywords"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder={t('keywordsPlaceholder')}
            className="font-arabic"
          />
        </div>
        <label className="flex items-center gap-2 font-arabic text-sm">
          <input
            type="checkbox"
            checked={includeLammah}
            onChange={(e) => setIncludeLammah(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          {t('includeLammah')}
        </label>
      </div>
    )
  }

  return (
    <div className="space-y-2 font-arabic text-sm">
      <p>
        <span className="text-muted-foreground">{t('reviewName')}:</span> {name}
      </p>
      <p>
        <span className="text-muted-foreground">{t('reviewSectors')}:</span>{' '}
        {filters.sectors.length ? filters.sectors.join('، ') : t('any')}
      </p>
      <p>
        <span className="text-muted-foreground">{t('reviewRegions')}:</span>{' '}
        {filters.regions.length ? filters.regions.join('، ') : t('any')}
      </p>
      <p>
        <span className="text-muted-foreground">{t('reviewKeywords')}:</span>{' '}
        {keywordsText.trim() || t('none')}
      </p>
      <p>
        <span className="text-muted-foreground">{t('reviewLammah')}:</span>{' '}
        {includeLammah ? t('yes') : t('no')}
      </p>
    </div>
  )
}

export function MandateSheet({ open, onOpenChange, activeMandateCount }: MandateSheetProps) {
  const t = useTranslations('opportunities.abhathli.sheet')
  const queryClient = useQueryClient()
  const [stepIndex, setStepIndex] = useState(0)
  const [name, setName] = useState('')
  const [keywordsText, setKeywordsText] = useState('')
  const [includeLammah, setIncludeLammah] = useState(true)
  const [filters, setFilters] = useState<JobFilterState>(DEFAULT_JOB_FILTER_STATE)
  const [pending, startTransition] = useTransition()

  const step = STEPS[stepIndex] ?? 'name'
  const atQuota = activeMandateCount >= ABHATHLI_MAX_ACTIVE_MANDATES

  const reset = () => {
    setStepIndex(0)
    setName('')
    setKeywordsText('')
    setIncludeLammah(true)
    setFilters(DEFAULT_JOB_FILTER_STATE)
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const submit = () => {
    startTransition(async () => {
      const keywords = keywordsText
        .split(/[,،]/)
        .map((k) => k.trim())
        .filter(Boolean)

      const result = await createSearchMandate({
        name: name.trim(),
        sectors: filters.sectors,
        regions: filters.regions,
        ownershipTypes: filters.ownership,
        experienceLevels: resolveExperienceLevelsFromChips(filters.experienceChips) ?? [],
        keywords,
        includeLammah,
        digestFrequency: 'instant',
      })

      if (!result.ok) {
        window.alert(t(`errors.${result.error}` as 'errors.plus_required'))
        return
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug('[analytics]', 'abhathli_mandate_created', { mandate_id: result.id })
      }

      await queryClient.invalidateQueries({ queryKey: abhathliMandatesQueryKey() })
      handleClose(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-arabic">{t('title')}</DialogTitle>
          <DialogDescription className="font-arabic">{t(`steps.${step}`)}</DialogDescription>
        </DialogHeader>

        {atQuota ? (
          <p className="font-arabic text-sm text-destructive">{t('quotaReached')}</p>
        ) : (
          <MandateFilterProvider initialFilters={filters} onFiltersChange={setFilters}>
            <MandateSheetBody
              step={step}
              name={name}
              setName={setName}
              keywordsText={keywordsText}
              setKeywordsText={setKeywordsText}
              includeLammah={includeLammah}
              setIncludeLammah={setIncludeLammah}
              filters={filters}
            />
          </MandateFilterProvider>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {stepIndex > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStepIndex((i) => i - 1)}>
              {t('back')}
            </Button>
          ) : null}
          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={step === 'name' && !name.trim()}
              onClick={() => setStepIndex((i) => i + 1)}
            >
              {t('next')}
            </Button>
          ) : (
            <Button type="button" disabled={pending || atQuota || !name.trim()} onClick={submit}>
              {t('create')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
