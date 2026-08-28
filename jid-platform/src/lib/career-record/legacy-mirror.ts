import 'server-only'

import type { CareerEvidenceCategory } from '@/types/contracts'
import * as careerRecord from './service'
import { CareerRecordError } from './errors'

/**
 * EXPAND dual-write: new factual CV edits also create/revise canonical Career
 * Record evidence. Legacy `/profile/cv` and `/api/me/cv/**` remain operational.
 * Failures here must not break the legacy journey; Career Record stays canonical
 * for Wave 2 surfaces.
 */
export async function mirrorLegacyFactToCareerRecord(input: {
  category: CareerEvidenceCategory
  fact_payload: Record<string, unknown>
  sourceTable: string
  sourceId: string
}): Promise<void> {
  try {
    const locator = `${input.sourceTable}:${input.sourceId}`
    const existing = await findEvidenceIdByLocator(locator)
    if (existing) {
      const current = await careerRecord.getCareerEvidence(existing)
      const revisionNo = current.current_revision?.revision_no
      if (typeof revisionNo === 'number') {
        await careerRecord.reviseCareerEvidence(existing, revisionNo, {
          fact_payload: input.fact_payload,
        })
        return
      }
    }
    await careerRecord.createDeclaredCareerEvidence({
      category: input.category,
      fact_payload: { ...input.fact_payload, legacy_locator: locator },
    })
  } catch (error) {
    if (error instanceof CareerRecordError && error.status === 401) return
    // Legacy journey must remain operational during EXPAND.
  }
}

async function findEvidenceIdByLocator(locator: string): Promise<string | null> {
  try {
    const listed = await careerRecord.listCareerEvidence({ includeArchived: true })
    for (const row of listed) {
      const payload = row.current_revision?.fact_payload
      if (payload && payload.legacy_locator === locator) return row.id
    }
  } catch {
    return null
  }
  return null
}
