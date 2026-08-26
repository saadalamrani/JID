import type { UserApplication } from '../application'
import type { Company } from '../catalog'
import type { CvRecord } from '../cv'
import type { Job } from '../job'
import type { LammahOpportunityCard } from '../lammah'

/** Explicit wrappers prevent current storage projections from masquerading as canonical contracts. */
export type LegacyCvProjectionSource = {
  legacy_source_kind: 'CV_PROJECTION_STORE'
  record: CvRecord
}

export type LegacyJobSubtypeSource = {
  legacy_source_kind: 'JOB_SUBTYPE_STORE'
  record: Job
}

export type LegacyApplicationProjectionSource = {
  legacy_source_kind: 'APPLICATION_PROJECTION_STORE'
  record: UserApplication
}

export type LegacyDirectoryReferenceSource = {
  legacy_source_kind: 'DIRECTORY_REFERENCE_STORE'
  record: Company
}

export type LegacyLammahOpportunitySource = {
  legacy_source_kind: 'LAMMAH_SOURCE_STORE'
  record: LammahOpportunityCard
}

/** SSIS data may be referenced for reconciliation, never as canonical decision authority. */
export type LegacySsisAssessmentSource = {
  legacy_source_kind: 'SSIS_ASSESSMENT_STORE'
  record_ref: string
}
