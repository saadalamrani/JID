import { render, screen } from '@testing-library/react'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { MetricFigure } from '@/components/ui/metric-figure'
import {
  FORBIDDEN_UNIVERSAL_SCORE_LABELS,
  cohortLinkGrantsPrivateCareerAccess,
  isInferredJourneyOutcomeLabel,
  isUiPublicActor,
  journeyOutcomeForDisplay,
  organicRelevanceHasPaidVisibility,
  organicRelevancePaidFieldKeys,
  opportunityTypeIsJobOnly,
} from '@/lib/ui/contract-presentation'
import {
  SHARED_CONTRACT_VERSION,
  type JourneyEvent,
  type MetricDefinition,
} from '@/types/contracts'
import type { OrganicOpportunityRelevance } from '@/types/contracts'

const metricDefinition: MetricDefinition = {
  contract_version: SHARED_CONTRACT_VERSION,
  metric_id: 'coverage.known',
  version: '1',
  name: 'Known coverage',
  description: 'Share of the eligible population that is observed',
  population_definition: 'Declared 2025 graduates',
  window_definition: '2025 calendar year',
  source_refs: [{ id: 'affiliation-events' }],
  missing_unknown_policy: 'Missing remains missing; never coerced to zero',
  coverage: {
    eligible_population_definition: 'Eligible declared graduates',
    observed_population_definition: 'Observed affiliation rows',
    coverage_calculation: 'observed / eligible',
  },
  privacy: {
    disclosure_policy_ref: { id: 'privacy-suppression' },
    minimum_cell_size: 10,
  },
  owner_ref: { id: 'university-outcomes' },
  state: 'ACTIVE',
  effective_at: '2026-01-01T00:00:00.000Z',
  metric_kind: 'COUNT',
}

describe('contract-backed presentation guards', () => {
  it('keeps public actors frozen and excludes Mentor and Government', () => {
    expect(isUiPublicActor('INDIVIDUAL')).toBe(true)
    expect(isUiPublicActor('BUSINESS')).toBe(true)
    expect(isUiPublicActor('UNIVERSITY')).toBe(true)
    expect(isUiPublicActor('MENTOR')).toBe(false)
    expect(isUiPublicActor('GOVERNMENT')).toBe(false)
  })

  it('never treats missing journey information as an outcome', () => {
    expect(journeyOutcomeForDisplay(null)).toBeNull()
    expect(isInferredJourneyOutcomeLabel('rejected')).toBe(true)
    expect(isInferredJourneyOutcomeLabel('employed')).toBe(true)
    expect(isInferredJourneyOutcomeLabel('unemployed')).toBe(true)
    expect(isInferredJourneyOutcomeLabel('successful')).toBe(true)

    const actionEvent = {
      contract_version: SHARED_CONTRACT_VERSION,
      event_id: 'e1',
      event_type: 'application.opened',
      event_version: '1',
      subject_id: 's1',
      origin_class: 'USER_DECLARED',
      actor_or_source_ref: { id: 's1' },
      occurred_at: '2026-08-01T00:00:00.000Z',
      recorded_at: '2026-08-01T00:00:00.000Z',
      payload: {},
      event_kind: 'ACTION',
    } satisfies JourneyEvent

    expect(journeyOutcomeForDisplay(actionEvent)).toBeNull()
  })

  it('keeps cohort linkage from implying private Career Record access', () => {
    expect(cohortLinkGrantsPrivateCareerAccess({ link_state: 'ACTIVE' })).toBe(false)
  })

  it('keeps paid visibility out of organic relevance', () => {
    expect(organicRelevancePaidFieldKeys()).toEqual([])
    expectTypeOf<OrganicOpportunityRelevance>().not.toHaveProperty('tier')
    expectTypeOf<OrganicOpportunityRelevance>().not.toHaveProperty('boost')
    expectTypeOf<OrganicOpportunityRelevance>().not.toHaveProperty('sponsorship')
    expect(
      organicRelevanceHasPaidVisibility({
        opportunity_id: 'o1',
        source_freshness_at: '2026-08-01T00:00:00.000Z',
        eligibility_claim_refs: [],
        relevance_signal_refs: [],
      }),
    ).toBe(false)
  })

  it('supports non-job opportunity types without treating Job as the universe', () => {
    expect(opportunityTypeIsJobOnly('JOB')).toBe(true)
    expect(opportunityTypeIsJobOnly('INTERNSHIP')).toBe(false)
    expect(opportunityTypeIsJobOnly('SCHOLARSHIP')).toBe(false)
  })

  it('does not expose universal score labels', () => {
    expect(FORBIDDEN_UNIVERSAL_SCORE_LABELS).toEqual([
      'Candidate Score',
      'Employability Score',
      'Culture Fit Score',
      'Potential Score',
      'Match %',
    ])
  })

  it('renders metric missingness instead of zero and keeps required meta visible', () => {
    render(
      <MetricFigure
        definition={metricDefinition}
        value={null}
        missingLabel="Not available"
        suppressedLabel="Suppressed"
        sourceLabel="Source"
        windowLabel="Window"
        populationLabel="Population"
        coverageLabel="Coverage"
        missingnessLabel="Missingness"
        privacyLabel="Privacy"
      />,
    )

    expect(screen.getByTestId('metric-value')).toHaveTextContent('Not available')
    expect(screen.getByTestId('metric-value')).not.toHaveTextContent('0')
    expect(screen.getByText('affiliation-events')).toBeInTheDocument()
    expect(screen.getByText('2025 calendar year')).toBeInTheDocument()
    expect(screen.getByText('Declared 2025 graduates')).toBeInTheDocument()
    expect(screen.getByText('observed / eligible')).toBeInTheDocument()
    expect(screen.getByText(/never coerced to zero/)).toBeInTheDocument()
    expect(screen.getByText('privacy-suppression')).toBeInTheDocument()
  })
})
