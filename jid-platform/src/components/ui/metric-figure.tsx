import { metricRequiredMeta, metricValueForDisplay } from '@/lib/ui/contract-presentation'
import type { MetricDefinition } from '@/types/contracts'
import { cn } from '@/lib/utils'

export type MetricFigureProps = {
  definition: MetricDefinition
  value: number | null
  suppressed?: boolean
  missingLabel: string
  suppressedLabel: string
  sourceLabel: string
  windowLabel: string
  populationLabel: string
  coverageLabel: string
  missingnessLabel: string
  privacyLabel: string
  className?: string
}

/**
 * Honest metric presentation. Missing is not zero. Coverage, source, window,
 * population, missingness, and privacy remain visible whenever the definition requires them.
 */
export function MetricFigure({
  definition,
  value,
  suppressed = false,
  missingLabel,
  suppressedLabel,
  sourceLabel,
  windowLabel,
  populationLabel,
  coverageLabel,
  missingnessLabel,
  privacyLabel,
  className,
}: MetricFigureProps) {
  const displayValue = metricValueForDisplay({ definition, value, suppressed })
  const meta = metricRequiredMeta(definition)
  const sourceIds = meta.source.map((ref) => ref.id).join(', ')

  return (
    <figure className={cn('max-w-xl space-y-3 text-start', className)}>
      <figcaption className="text-sm font-medium tracking-normal text-foreground">
        {definition.name}
      </figcaption>
      <p
        className="text-2xl font-semibold tracking-normal text-foreground"
        data-testid="metric-value"
      >
        {suppressed ? suppressedLabel : displayValue === null ? missingLabel : String(displayValue)}
      </p>
      <dl className="grid gap-2 text-sm text-muted-foreground">
        <div>
          <dt className="font-medium text-foreground">{sourceLabel}</dt>
          <dd>{sourceIds}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{windowLabel}</dt>
          <dd>{meta.window}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{populationLabel}</dt>
          <dd>{meta.population}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{coverageLabel}</dt>
          <dd>{meta.coverage.coverage_calculation}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{missingnessLabel}</dt>
          <dd>{meta.missingness}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">{privacyLabel}</dt>
          <dd>{meta.privacy.disclosure_policy_ref.id}</dd>
        </div>
      </dl>
    </figure>
  )
}
