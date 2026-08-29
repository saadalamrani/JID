import type { UserApplication } from '@/types/application'
import { projectApplicationAsCareerItem } from './application-bridge'
import type { CareerItem } from './types'

export function mergeCareerItemsWithApplications(
  persisted: readonly CareerItem[],
  applications: readonly UserApplication[],
  nowIso: string,
): CareerItem[] {
  const byApplicationId = new Map<string, CareerItem>()
  const byOpportunityId = new Map<string, CareerItem>()
  const merged: CareerItem[] = []

  for (const item of persisted) {
    merged.push(item)
    if (item.application_id) byApplicationId.set(item.application_id, item)
    byOpportunityId.set(item.opportunity_id, item)
  }

  for (const application of applications) {
    const existing =
      byApplicationId.get(application.id) ?? byOpportunityId.get(`native:${application.job_id}`)
    if (existing) {
      existing.application_id = application.id
      existing.application_status = application.status
      if (!existing.last_employer_action_at) {
        existing.last_employer_action_at = application.last_company_action_at
      }
      if (!existing.last_seen_at) {
        existing.last_seen_at = application.last_seen_by_user_at
      }
      continue
    }
    merged.push(projectApplicationAsCareerItem(application, nowIso))
  }

  return merged.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
}
