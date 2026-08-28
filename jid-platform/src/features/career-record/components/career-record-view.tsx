'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { PageHeader, SectionHeader } from '@/components/ui/page-header'
import { SurfaceStateView } from '@/components/ui/surface-state'
import { CAREER_EVIDENCE_CATEGORIES, type CareerEvidence } from '@/types/contracts'
import { focusRingClass, reducedMotionClass, touchTargetClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'
import { Link } from '@/lib/i18n/navigation'
import type { Locale } from '@/lib/i18n/config'
import type { CareerRecordCopy } from '../copy'
import { groupCareerEvidenceByCategory } from '../fact-display'
import type {
  CareerEvidenceLifecycleAction,
  CareerEvidenceLifecycleCapabilities,
} from '../operations'
import type { CareerRecordViewState } from '../view-state'
import { CareerEvidenceFormDialog } from './career-evidence-form-dialog'
import { CareerEvidenceInspector } from './career-evidence-inspector'
import { CareerEvidenceItem } from './career-evidence-item'

const EMPTY_EVIDENCE: readonly CareerEvidence[] = []

export type CareerRecordViewProps = {
  state: CareerRecordViewState
  copy: CareerRecordCopy
  locale: Locale
  dir?: 'rtl' | 'ltr'
  onCreateDeclared?: (payload: {
    category: CareerEvidence['category']
    fact_payload: Readonly<Record<string, unknown>>
  }) => void
  onRevise?: (payload: {
    evidence_id: string
    expected_revision_no: number
    fact_payload: Readonly<Record<string, unknown>>
  }) => void
  onLifecycle?: (payload: { evidence_id: string; action: CareerEvidenceLifecycleAction }) => void
  onRetry?: () => void
  lifecycleCapabilities?: CareerEvidenceLifecycleCapabilities
}

export function CareerRecordView({
  state,
  copy,
  locale,
  dir,
  onCreateDeclared,
  onRevise,
  onLifecycle,
  onRetry,
  lifecycleCapabilities,
}: CareerRecordViewProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [inspectId, setInspectId] = useState<string | null>(null)
  const [correctId, setCorrectId] = useState<string | null>(null)

  const items = state.status === 'ready' || state.status === 'stale' ? state.items : EMPTY_EVIDENCE
  const grouped = useMemo(() => groupCareerEvidenceByCategory(items), [items])
  const inspectTarget = items.find((item) => item.evidence_id === inspectId) ?? null
  const correctTarget = items.find((item) => item.evidence_id === correctId) ?? null

  const addAction = (
    <Button
      type="button"
      size="lg"
      className={cn(touchTargetClass, focusRingClass)}
      onClick={() => setAddOpen(true)}
    >
      {copy.addEvidence}
    </Button>
  )

  return (
    <div dir={dir} lang={locale} className={cn('space-y-8', reducedMotionClass)}>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <div className="flex flex-wrap gap-2">
            {state.status === 'ready' || state.status === 'empty' || state.status === 'stale'
              ? addAction
              : null}
            <Button asChild variant="outline" size="lg">
              <Link href="/profile/cv-projection">{copy.openCvProjection}</Link>
            </Button>
          </div>
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
          action={addAction}
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

      {state.status === 'ready' || state.status === 'stale' ? (
        <div className="space-y-10">
          {CAREER_EVIDENCE_CATEGORIES.map((category) => {
            const categoryItems = grouped[category]
            if (categoryItems.length === 0) return null
            return (
              <section key={category} aria-labelledby={`career-record-${category}`}>
                <SectionHeader id={`career-record-${category}`} title={copy.category[category]} />
                {categoryItems.map((item) => (
                  <CareerEvidenceItem
                    key={item.evidence_id}
                    evidence={item}
                    copy={copy}
                    locale={locale}
                    onInspect={setInspectId}
                    onCorrect={(id) => {
                      setInspectId(null)
                      setCorrectId(id)
                    }}
                  />
                ))}
              </section>
            )
          })}
        </div>
      ) : null}

      <CareerEvidenceInspector
        evidence={inspectTarget}
        open={inspectId !== null}
        onOpenChange={(open) => {
          if (!open) setInspectId(null)
        }}
        copy={copy}
        locale={locale}
        onCorrect={(id) => {
          setInspectId(null)
          setCorrectId(id)
        }}
        onLifecycle={
          onLifecycle
            ? (evidenceId, action) => onLifecycle({ evidence_id: evidenceId, action })
            : undefined
        }
        lifecycleCapabilities={lifecycleCapabilities}
      />

      <CareerEvidenceFormDialog
        mode="add"
        open={addOpen}
        onOpenChange={setAddOpen}
        copy={copy}
        onSubmit={(payload) => onCreateDeclared?.(payload)}
      />

      <CareerEvidenceFormDialog
        mode="correct"
        open={correctId !== null}
        onOpenChange={(open) => {
          if (!open) setCorrectId(null)
        }}
        copy={copy}
        evidence={correctTarget}
        onSubmit={(payload) => {
          if (!correctTarget) return
          onRevise?.({
            evidence_id: correctTarget.evidence_id,
            expected_revision_no: correctTarget.revision_no,
            fact_payload: payload.fact_payload,
          })
        }}
      />
    </div>
  )
}
