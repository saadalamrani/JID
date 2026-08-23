export { classifyLifecycle, dateOnlyDeadlineInRiyadh, deadlineHasPassed } from './lifecycle'
export { normalizeOpportunityUrl, hostAllowed, sourceAndApplyAreSeparated } from './urls'
export { mapOrganization, DIRECTORY_ANCHORS } from './org-mapping'
export { findDuplicates, duplicateKey, evidenceChecksum } from './dedup'
export { validateResearchOpportunity, isPublishReviewCandidate } from './contract'
export { runRealOpportunityDryRun, assertZeroSideEffects, RESEARCH_RUN_ID } from './dry-run'
export { RESEARCH_INVENTORY, RESEARCH_NOW, RESEARCH_CHECKED_AT } from './research-inventory'
export { toRegistrySourceType, INGEST_RECORD_KEYS } from './types'
export type {
  ResearchOpportunityInput,
  ValidatedOpportunity,
  DryRunReport,
  LammahIngestRecord,
} from './types'
