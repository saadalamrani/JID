/**
 * Read-only bridge from the frozen Application contract into Career Operations.
 * Does not add Application statuses or change employer-visible meaning.
 */

import type { ApplicationStatus, UserApplication } from '@/types/application'
import type { CareerItem, CareerOperationalState, CareerOutcomeKind } from './types'

export function operationalStateFromApplicationStatus(
  status: ApplicationStatus,
): CareerOperationalState {
  switch (status) {
    case 'draft':
    case 'saved':
      return 'considering'
    case 'pending':
    case 'submitted':
      return 'applied'
    case 'under_review':
      return 'waiting'
    case 'invited':
      return 'interviewing'
    case 'shortlisted':
      return 'waiting'
    case 'rejected':
    case 'withdrawn':
    case 'expired':
      return 'outcome'
    default:
      return 'considering'
  }
}

export function outcomeKindFromApplicationStatus(
  status: ApplicationStatus,
): CareerOutcomeKind | null {
  switch (status) {
    case 'rejected':
      return 'rejected'
    case 'withdrawn':
      return 'withdrawn'
    case 'expired':
      return 'expired'
    case 'shortlisted':
      return 'open'
    default:
      return null
  }
}

export function nativeOpportunityIdFromApplication(application: UserApplication): string {
  return `native:${application.job_id}`
}

export function projectedCareerItemId(applicationId: string): string {
  return `application:${applicationId}`
}

export function parseProjectedCareerItemId(id: string): string | null {
  if (!id.startsWith('application:')) return null
  return id.slice('application:'.length)
}

export function projectApplicationAsCareerItem(
  application: UserApplication,
  nowIso: string,
): CareerItem {
  const titleAr = application.job?.title_ar ?? null
  const titleEn = application.job?.title_en ?? null
  const organizationName =
    application.company?.name_ar || application.company?.name_en || null

  return {
    id: projectedCareerItemId(application.id),
    origin: 'application_projection',
    user_id: application.applicant_id,
    opportunity_id: nativeOpportunityIdFromApplication(application),
    source_class: 'JID_NATIVE',
    opportunity_family: 'JOB',
    application_id: application.id,
    application_status: application.status,
    operational_state: operationalStateFromApplicationStatus(application.status),
    outcome_kind: outcomeKindFromApplicationStatus(application.status),
    title_ar: titleAr,
    title_en: titleEn,
    organization_name: organizationName,
    deadline_at: application.job?.application_deadline ?? application.expires_at,
    apply_authority: 'JID_NATIVE',
    apply_url: null,
    next_action: null,
    open_follow_ups: [],
    interviews: [],
    latest_events: [],
    last_user_action_at: null,
    last_employer_action_at: application.last_company_action_at,
    last_system_event_at: application.status_changed_at,
    last_seen_at: application.last_seen_by_user_at,
    note_count: 0,
    created_at: application.created_at,
    updated_at: application.updated_at || nowIso,
  }
}

/**
 * Native JID applications stay on `applications`. External Lammah tracking
 * must never write that table.
 */
export function mayLinkApplication(sourceClass: 'JID_NATIVE' | 'GOVERNED_EXTERNAL'): boolean {
  return sourceClass === 'JID_NATIVE'
}
