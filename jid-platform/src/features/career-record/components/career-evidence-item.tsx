'use client'

import { StatusBadge } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { focusRingClass, reducedMotionClass, touchTargetClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'
import type { CareerEvidence } from '@/types/contracts'
import type { Locale } from '@/lib/i18n/config'
import type { CareerRecordCopy } from '../copy'
import { careerEvidenceDisplay } from '../fact-display'
import {
  evidenceImpliesRecipientAccess,
  isPrivateByDefault,
  verificationImpliesPublicVisibility,
} from '../privacy'

type CareerEvidenceItemProps = {
  evidence: CareerEvidence
  copy: CareerRecordCopy
  locale: Locale
  selectedInThisCv?: boolean
  onInspect: (evidenceId: string) => void
  onCorrect: (evidenceId: string) => void
}

export function CareerEvidenceItem({
  evidence,
  copy,
  locale,
  selectedInThisCv = false,
  onInspect,
  onCorrect,
}: CareerEvidenceItemProps) {
  const display = careerEvidenceDisplay(evidence, locale)
  const title = display.title ?? copy.untitled
  const privateByDefault = isPrivateByDefault(evidence)

  return (
    <article
      className={cn(
        'flex flex-col gap-3 border-b border-border py-4 sm:flex-row sm:items-start sm:justify-between',
        reducedMotionClass,
      )}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold tracking-normal text-foreground">{title}</h3>
          <StatusBadge domain="careerEvidence" state={evidence.verification_state}>
            {copy.state[evidence.verification_state]}
          </StatusBadge>
        </div>
        {display.subtitle ? (
          <p className="text-sm text-muted-foreground">{display.subtitle}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {copy.informationState}: {copy.state[evidence.verification_state]} · {copy.source}:{' '}
          {copy.sourceClass[evidence.source_class]}
        </p>
        <ul className="flex flex-col gap-1 text-sm text-foreground">
          <li>{copy.inRecord}</li>
          {privateByDefault ? <li>{copy.privateNotice}</li> : null}
          {selectedInThisCv ? <li>{copy.openCvProjection}</li> : null}
          {verificationImpliesPublicVisibility(evidence) ? null : (
            <li>{copy.verificationNotPublic}</li>
          )}
          {evidenceImpliesRecipientAccess(evidence) ? null : <li>{copy.notShared}</li>}
        </ul>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={cn(touchTargetClass, focusRingClass)}
          onClick={() => onInspect(evidence.evidence_id)}
        >
          {copy.inspect}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className={cn(touchTargetClass, focusRingClass)}
          onClick={() => onCorrect(evidence.evidence_id)}
        >
          {copy.correctFact}
        </Button>
      </div>
    </article>
  )
}
