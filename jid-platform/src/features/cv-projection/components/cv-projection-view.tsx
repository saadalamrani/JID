'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { SurfaceStateView } from '@/components/ui/surface-state'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  CV_FORMAT_REGISTRY,
  CV_EXPORT_FORMATS,
  type CvExportFormatKey,
} from '@/lib/cv/formats/registry'
import { focusRingClass, reducedMotionClass, touchTargetClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'
import { Link } from '@/lib/i18n/navigation'
import type { Locale } from '@/lib/i18n/config'
import type { CareerEvidence } from '@/types/contracts'
import { careerEvidenceDisplay } from '@/features/career-record/fact-display'
import { getCareerRecordCopy } from '@/features/career-record/copy'
import type { CvProjectionCopy } from '../copy'
import {
  CATEGORY_TO_SECTION,
  CV_PROJECTION_SECTION_KEYS,
  type CvPresentationPayload,
  type CvProjection,
  type CvProjectionItem,
  type CvProjectionSection,
  type CvProjectionSectionKey,
  type CvSharePresentation,
  defaultCvProjectionSections,
} from '../operations'
import { moveItem, sanitizePresentationPayload } from '../presentation-guard'
import { CvPreviewPanel } from './cv-preview-panel'
import { CvSharePanel } from './cv-share-panel'

export type CvProjectionViewState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'forbidden' }
  | { status: 'error'; message?: string }
  | { status: 'empty' }
  | { status: 'stale'; projection: CvProjection; asOfLabel?: string }
  | { status: 'ready'; projection: CvProjection }

export type CvProjectionViewProps = {
  state: CvProjectionViewState
  copy: CvProjectionCopy
  locale: Locale
  dir?: 'rtl' | 'ltr'
  onUpdatePresentation?: (patch: {
    title?: string | null
    summary?: string | null
    locale?: Locale
    template_key?: CvExportFormatKey
    section_order?: readonly CvProjectionSectionKey[]
    item_presentation?: { evidence_id: string; presentation_payload: CvPresentationPayload }
  }) => void
  onSetSelection?: (
    sectionKey: CvProjectionSectionKey,
    orderedEvidenceIds: readonly string[],
  ) => void
  onRequestFactCorrection?: (evidenceId: string) => void
  onRequestShare?: () => void
  onRetry?: () => void
  shareMessage?: string | null
}

function evidenceFor(projection: CvProjection): readonly CareerEvidence[] {
  return projection.evidence
}

const EMPTY_EVIDENCE: readonly CareerEvidence[] = []

export function CvProjectionView({
  state,
  copy,
  locale,
  dir,
  onUpdatePresentation,
  onSetSelection,
  onRequestFactCorrection,
  onRequestShare,
  onRetry,
  shareMessage = null,
}: CvProjectionViewProps) {
  const projection = state.status === 'ready' || state.status === 'stale' ? state.projection : null
  const [draftTitle, setDraftTitle] = useState(projection?.title ?? '')
  const [draftSummary, setDraftSummary] = useState(projection?.summary ?? '')
  const [draftLocale, setDraftLocale] = useState<Locale>(projection?.locale ?? locale)
  const [draftTemplate, setDraftTemplate] = useState<CvExportFormatKey>(
    projection?.template_key ?? 'basic_free',
  )
  const [sections, setSections] = useState<CvProjectionSection[]>(() =>
    projection ? [...projection.sections] : defaultCvProjectionSections(),
  )
  const [items, setItems] = useState<CvProjectionItem[]>(() =>
    projection ? [...projection.items] : [],
  )
  const [wordingId, setWordingId] = useState<string | null>(null)
  const [wordingTitle, setWordingTitle] = useState('')
  const [wordingSummary, setWordingSummary] = useState('')
  const recordCopy = getCareerRecordCopy(locale)

  useEffect(() => {
    if (state.status !== 'ready' && state.status !== 'stale') return
    const next = state.projection
    setDraftTitle(next.title ?? '')
    setDraftSummary(next.summary ?? '')
    setDraftLocale(next.locale)
    setDraftTemplate(next.template_key)
    setSections([...next.sections])
    setItems([...next.items])
  }, [state])

  const evidence = projection ? evidenceFor(projection) : EMPTY_EVIDENCE
  const share: CvSharePresentation = projection?.share ?? { kind: 'private' }

  const wordingItem = items.find((item) => item.evidence_id === wordingId) ?? null

  const groupedEvidence = useMemo(() => {
    return CV_PROJECTION_SECTION_KEYS.map((sectionKey) => ({
      sectionKey,
      evidenceItems: evidence.filter((item) => CATEGORY_TO_SECTION[item.category] === sectionKey),
    })).filter((group) => group.evidenceItems.length > 0)
  }, [evidence])

  function selectedIdsFor(sectionKey: CvProjectionSectionKey): string[] {
    return items
      .filter((item) => item.section_key === sectionKey && item.is_selected)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.evidence_id)
  }

  function emitSelection(
    sectionKey: CvProjectionSectionKey,
    nextItems: readonly CvProjectionItem[],
  ) {
    const ordered = nextItems
      .filter((item) => item.section_key === sectionKey && item.is_selected)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.evidence_id)
    onSetSelection?.(sectionKey, ordered)
  }

  function toggleInclusion(record: CareerEvidence, selected: boolean) {
    const sectionKey = CATEGORY_TO_SECTION[record.category]
    const existing = items.find((item) => item.evidence_id === record.evidence_id)
    let next: CvProjectionItem[]
    if (existing) {
      next = items.map((item) =>
        item.evidence_id === record.evidence_id ? { ...item, is_selected: selected } : item,
      )
    } else {
      next = [
        ...items,
        {
          evidence_id: record.evidence_id,
          section_key: sectionKey,
          sort_order: selectedIdsFor(sectionKey).length,
          is_selected: selected,
          presentation_payload: {},
        },
      ]
    }
    setItems(next)
    emitSelection(sectionKey, next)
  }

  function reorderSection(from: number, to: number) {
    const ordered = [...sections].sort((a, b) => a.sort_order - b.sort_order)
    const moved = moveItem(ordered, from, to).map((section, sort_order) => ({
      ...section,
      sort_order,
    }))
    setSections(moved)
    onUpdatePresentation?.({ section_order: moved.map((section) => section.section_key) })
  }

  function reorderItems(sectionKey: CvProjectionSectionKey, from: number, to: number) {
    const sectionItems = items
      .filter((item) => item.section_key === sectionKey && item.is_selected)
      .sort((a, b) => a.sort_order - b.sort_order)
    const moved = moveItem(sectionItems, from, to)
    const next = items.map((item) => {
      const index = moved.findIndex((candidate) => candidate.evidence_id === item.evidence_id)
      if (index === -1) return item
      return { ...item, sort_order: index }
    })
    setItems(next)
    emitSelection(sectionKey, next)
  }

  function openWording(item: CvProjectionItem, record: CareerEvidence) {
    const display = careerEvidenceDisplay(record, locale)
    setWordingId(item.evidence_id)
    setWordingTitle(item.presentation_payload.display_title ?? display.title ?? '')
    setWordingSummary(item.presentation_payload.summary ?? '')
  }

  function saveWording() {
    if (!wordingId) return
    const presentation_payload = sanitizePresentationPayload({
      display_title: wordingTitle,
      summary: wordingSummary,
    })
    const next = items.map((item) =>
      item.evidence_id === wordingId ? { ...item, presentation_payload } : item,
    )
    setItems(next)
    onUpdatePresentation?.({
      item_presentation: { evidence_id: wordingId, presentation_payload },
    })
    setWordingId(null)
  }

  const interactive = state.status === 'ready' || state.status === 'stale'

  return (
    <div dir={dir} lang={locale} className={cn('space-y-8', reducedMotionClass)}>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/profile/career-record">{copy.openCareerRecord}</Link>
          </Button>
        }
      />

      {state.status === 'loading' ? (
        <SurfaceStateView state="loading" label={copy.loading} />
      ) : null}
      {state.status === 'empty' ? (
        <SurfaceStateView
          state="empty"
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          action={
            <Button asChild size="lg">
              <Link href="/profile/career-record">{copy.openCareerRecord}</Link>
            </Button>
          }
        />
      ) : null}
      {state.status === 'error' ? (
        <SurfaceStateView
          state="error"
          title={copy.errorTitle}
          message={state.message ?? copy.errorMessage}
          onRetry={onRetry}
          retryLabel={copy.retry}
        />
      ) : null}
      {state.status === 'forbidden' ? (
        <SurfaceStateView
          state="forbidden"
          title={copy.forbiddenTitle}
          message={copy.forbiddenMessage}
        />
      ) : null}
      {state.status === 'unavailable' ? (
        <SurfaceStateView
          state="unavailable"
          title={copy.unavailableTitle}
          message={copy.unavailableMessage}
        />
      ) : null}
      {state.status === 'stale' ? (
        <SurfaceStateView
          state="stale"
          title={copy.staleTitle}
          message={copy.staleMessage}
          asOfLabel={state.asOfLabel}
        />
      ) : null}

      {interactive && projection ? (
        <>
          <section className="space-y-4" aria-labelledby="cv-identity-heading">
            <SectionHeader id="cv-identity-heading" title={copy.identityTitle} />
            <FormField id="cv-title" label={copy.cvTitle}>
              <Input
                id="cv-title"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onBlur={() => onUpdatePresentation?.({ title: draftTitle || null })}
              />
            </FormField>
            <FormField id="cv-summary" label={copy.cvSummary} hint={copy.presentationHint}>
              <Textarea
                id="cv-summary"
                value={draftSummary}
                onChange={(event) => setDraftSummary(event.target.value)}
                onBlur={() => onUpdatePresentation?.({ summary: draftSummary || null })}
              />
            </FormField>
            <FormField id="cv-language" label={copy.language}>
              <select
                id="cv-language"
                className={cn(
                  'flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm',
                  focusRingClass,
                )}
                value={draftLocale}
                onChange={(event) => {
                  const next = event.target.value as Locale
                  setDraftLocale(next)
                  onUpdatePresentation?.({ locale: next })
                }}
              >
                <option value="ar">{copy.arabic}</option>
                <option value="en">{copy.english}</option>
              </select>
            </FormField>
            <FormField id="cv-template" label={copy.template}>
              <select
                id="cv-template"
                className={cn(
                  'flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm',
                  focusRingClass,
                )}
                value={draftTemplate}
                onChange={(event) => {
                  const next = event.target.value as CvExportFormatKey
                  setDraftTemplate(next)
                  onUpdatePresentation?.({ template_key: next })
                }}
              >
                {CV_EXPORT_FORMATS.map((key) => (
                  <option key={key} value={key}>
                    {locale === 'ar'
                      ? CV_FORMAT_REGISTRY[key].labelAr
                      : CV_FORMAT_REGISTRY[key].labelEn}
                  </option>
                ))}
              </select>
            </FormField>
          </section>

          <CvSharePanel
            copy={copy}
            share={share}
            shareMessage={shareMessage}
            onRequestShare={onRequestShare}
          />

          <section className="space-y-3" aria-labelledby="cv-section-order-heading">
            <SectionHeader id="cv-section-order-heading" title={copy.sectionOrder} />
            <ol className="divide-y divide-border">
              {[...sections]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((section, index, list) => (
                  <li
                    key={section.section_key}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-foreground">
                      {copy.section[section.section_key]}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className={cn(touchTargetClass, focusRingClass)}
                        disabled={index === 0}
                        onClick={() => reorderSection(index, index - 1)}
                      >
                        {copy.moveUp}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className={cn(touchTargetClass, focusRingClass)}
                        disabled={index === list.length - 1}
                        onClick={() => reorderSection(index, index + 1)}
                      >
                        {copy.moveDown}
                      </Button>
                    </div>
                  </li>
                ))}
            </ol>
          </section>

          <section className="space-y-6" aria-labelledby="cv-selection-heading">
            <SectionHeader
              id="cv-selection-heading"
              title={copy.inThisCv}
              description={copy.scopesHint}
            />
            {evidence.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.noEvidenceTitle}</p>
            ) : null}
            {groupedEvidence.map((group) => {
              const selectedItems = items
                .filter((item) => item.section_key === group.sectionKey && item.is_selected)
                .sort((a, b) => a.sort_order - b.sort_order)
              return (
                <div key={group.sectionKey} className="space-y-3">
                  <h3 className="text-base font-semibold tracking-normal text-foreground">
                    {copy.section[group.sectionKey]}
                  </h3>
                  <ul className="divide-y divide-border">
                    {group.evidenceItems.map((record) => {
                      const item =
                        items.find((candidate) => candidate.evidence_id === record.evidence_id) ??
                        null
                      const selected = item?.is_selected === true
                      const display = careerEvidenceDisplay(record, locale)
                      const selectedIndex = selectedItems.findIndex(
                        (candidate) => candidate.evidence_id === record.evidence_id,
                      )
                      return (
                        <li
                          key={record.evidence_id}
                          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">
                                {item?.presentation_payload.display_title ??
                                  display.title ??
                                  copy.untitled}
                              </p>
                              <StatusBadge
                                domain="careerEvidence"
                                state={record.verification_state}
                              >
                                {recordCopy.state[record.verification_state]}
                              </StatusBadge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {selected ? copy.included : copy.excluded}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {copy.inRecord} · {selected ? copy.inThisCv : copy.excluded}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant={selected ? 'secondary' : 'default'}
                              size="lg"
                              className={cn(touchTargetClass, focusRingClass)}
                              onClick={() => toggleInclusion(record, !selected)}
                            >
                              {selected ? copy.exclude : copy.include}
                            </Button>
                            {selected && item ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  className={cn(touchTargetClass, focusRingClass)}
                                  onClick={() => openWording(item, record)}
                                >
                                  {copy.presentationWording}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  className={cn(touchTargetClass, focusRingClass)}
                                  onClick={() => onRequestFactCorrection?.(record.evidence_id)}
                                >
                                  {copy.correctFact}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  className={cn(touchTargetClass, focusRingClass)}
                                  disabled={selectedIndex <= 0}
                                  onClick={() =>
                                    reorderItems(group.sectionKey, selectedIndex, selectedIndex - 1)
                                  }
                                >
                                  {copy.moveUp}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="lg"
                                  className={cn(touchTargetClass, focusRingClass)}
                                  disabled={selectedIndex === selectedItems.length - 1}
                                  onClick={() =>
                                    reorderItems(group.sectionKey, selectedIndex, selectedIndex + 1)
                                  }
                                >
                                  {copy.moveDown}
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </section>

          <CvPreviewPanel
            copy={copy}
            locale={draftLocale}
            title={draftTitle}
            summary={draftSummary}
            sections={sections}
            items={items}
            evidence={evidence}
          />
        </>
      ) : null}

      <Dialog
        open={wordingId !== null}
        onOpenChange={(open) => {
          if (!open) setWordingId(null)
        }}
      >
        <DialogContent closeLabel={copy.close}>
          <DialogHeader>
            <DialogTitle>{copy.presentationWording}</DialogTitle>
            <DialogDescription>{copy.presentationHint}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField id="cv-display-title" label={copy.displayTitle}>
              <Input
                id="cv-display-title"
                value={wordingTitle}
                onChange={(event) => setWordingTitle(event.target.value)}
              />
            </FormField>
            <FormField id="cv-presentation-summary" label={copy.presentationSummary}>
              <Textarea
                id="cv-presentation-summary"
                value={wordingSummary}
                onChange={(event) => setWordingSummary(event.target.value)}
              />
            </FormField>
            {wordingItem ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setWordingId(null)
                  onRequestFactCorrection?.(wordingItem.evidence_id)
                }}
              >
                {copy.correctFact}
              </Button>
            ) : null}
            <p className="text-sm text-muted-foreground">{copy.correctFactSeam}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setWordingId(null)}>
              {copy.cancel}
            </Button>
            <Button
              type="button"
              size="lg"
              className={cn(touchTargetClass, focusRingClass)}
              onClick={saveWording}
            >
              {copy.savePresentation}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
