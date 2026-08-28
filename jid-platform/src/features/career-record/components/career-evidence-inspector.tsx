'use client'

import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { StatusBadge } from '@/components/ui/status-badge'
import { SectionHeader } from '@/components/ui/page-header'
import { focusRingClass, reducedMotionClass, touchTargetClass } from '@/lib/ui/a11y'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils/format'
import type { CareerEvidence } from '@/types/contracts'
import type { Locale } from '@/lib/i18n/config'
import { careerRecordFieldLabel, type CareerRecordCopy } from '../copy'
import { careerEvidenceDisplay } from '../fact-display'
import {
  CAREER_EVIDENCE_LIFECYCLE_ACTIONS,
  type CareerEvidenceLifecycleAction,
  type CareerEvidenceLifecycleCapabilities,
  OWNER_DECLARED_LIFECYCLE_CAPABILITIES,
} from '../operations'
import { evidenceImpliesRecipientAccess, isPrivateByDefault } from '../privacy'
import { sourceExplanation } from '../source-explanation'

type CareerEvidenceInspectorProps = {
  evidence: CareerEvidence | null
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: CareerRecordCopy
  locale: Locale
  onCorrect: (evidenceId: string) => void
  onLifecycle?: (evidenceId: string, action: CareerEvidenceLifecycleAction) => void
  lifecycleCapabilities?: CareerEvidenceLifecycleCapabilities
}

function capabilityFor(
  action: CareerEvidenceLifecycleAction,
  capabilities: CareerEvidenceLifecycleCapabilities,
): boolean {
  switch (action) {
    case 'archive':
      return capabilities.canArchive
    case 'dispute':
      return capabilities.canDispute
    case 'revoke':
      return capabilities.canRevoke
    case 'expire':
      return capabilities.canExpire
  }
}

export function CareerEvidenceInspector({
  evidence,
  open,
  onOpenChange,
  copy,
  locale,
  onCorrect,
  onLifecycle,
  lifecycleCapabilities = OWNER_DECLARED_LIFECYCLE_CAPABILITIES,
}: CareerEvidenceInspectorProps) {
  if (!evidence) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title={copy.inspect} closeLabel={copy.close}>
        <p className="text-sm text-muted-foreground">{copy.untitled}</p>
      </Sheet>
    )
  }

  const display = careerEvidenceDisplay(evidence, locale)
  const title = display.title ?? copy.untitled
  const observed = evidence.observed_at ? formatDateTime(evidence.observed_at, locale) : null

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={copy.category[evidence.category]}
      closeLabel={copy.close}
      side="end"
    >
      <div className={cn('space-y-6 overflow-y-auto p-4', reducedMotionClass)}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge domain="careerEvidence" state={evidence.verification_state}>
            {copy.state[evidence.verification_state]}
          </StatusBadge>
          <span className="text-sm text-muted-foreground">{copy.informationState}</span>
        </div>

        <section className="space-y-2">
          <SectionHeader title={copy.informationState} />
          <dl className="grid gap-3">
            {display.fields.map((field) => (
              <div key={field.key}>
                <dt className="text-xs font-medium text-muted-foreground">
                  {careerRecordFieldLabel(copy, field.key)}
                </dt>
                <dd className="mt-1 break-words text-sm text-foreground">{field.value}</dd>
              </div>
            ))}
            {display.fields.length === 0 && !display.title ? (
              <p className="text-sm text-muted-foreground">{copy.untitled}</p>
            ) : null}
          </dl>
        </section>

        <section className="space-y-2">
          <SectionHeader title={copy.source} />
          <p className="text-sm text-foreground">{copy.sourceClass[evidence.source_class]}</p>
          <p className="text-sm text-muted-foreground">
            {sourceExplanation(evidence.source_class, copy)}
          </p>
          {evidence.source_ref ? (
            <p className="text-sm text-muted-foreground">
              {copy.source}: {evidence.source_ref.id}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.sourceMissing}</p>
          )}
          {observed ? <p className="text-sm text-muted-foreground">{observed}</p> : null}
        </section>

        <section className="space-y-2">
          <SectionHeader title={copy.disclosureTitle} />
          <p className="text-sm text-foreground">{copy.disclosureBody}</p>
          {isPrivateByDefault(evidence) ? (
            <p className="text-sm text-muted-foreground">{copy.policyPrivate}</p>
          ) : null}
          {evidenceImpliesRecipientAccess(evidence) ? null : (
            <p className="text-sm text-muted-foreground">{copy.noRecipientGrant}</p>
          )}
        </section>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            className={cn(touchTargetClass, focusRingClass)}
            onClick={() => onCorrect(evidence.evidence_id)}
          >
            {copy.correctFact}
          </Button>
          <p className="text-sm text-muted-foreground">{copy.correctFactHint}</p>
        </div>

        {onLifecycle ? (
          <section className="space-y-2">
            {CAREER_EVIDENCE_LIFECYCLE_ACTIONS.filter((action) =>
              capabilityFor(action, lifecycleCapabilities),
            ).map((action) => (
              <div key={action} className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className={cn(touchTargetClass, focusRingClass, 'w-full')}
                  onClick={() => onLifecycle(evidence.evidence_id, action)}
                >
                  {copy.lifecycle[action]}
                </Button>
                <p className="text-xs text-muted-foreground">{copy.lifecycleHint[action]}</p>
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </Sheet>
  )
}
