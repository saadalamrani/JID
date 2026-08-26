import type { ContractId, ContractReference, IsoTimestamp, VersionedContract } from './common'

export type MetricCoverageSemantics = {
  eligible_population_definition: string
  observed_population_definition: string
  coverage_calculation: string
}

export type MetricPrivacySemantics = {
  suppression_policy_ref?: ContractReference
  minimum_cell_size?: number
  disclosure_policy_ref: ContractReference
}

type MetricDefinitionBase = VersionedContract & {
  metric_id: ContractId
  version: string
  name: string
  description: string
  population_definition: string
  window_definition: string
  source_refs: readonly ContractReference[]
  missing_unknown_policy: string
  coverage: MetricCoverageSemantics
  privacy: MetricPrivacySemantics
  owner_ref: ContractReference
  state: 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'RETIRED'
  effective_at: IsoTimestamp
  retired_at?: IsoTimestamp
  supersedes_version?: string
}

export type MetricDefinition =
  | (MetricDefinitionBase & {
      metric_kind: 'RATIO' | 'RATE' | 'PERCENTAGE'
      numerator_definition: string
      denominator_definition: string
    })
  | (MetricDefinitionBase & {
      metric_kind: 'COUNT' | 'DURATION' | 'DISTRIBUTION'
      numerator_definition?: never
      denominator_definition?: never
    })
