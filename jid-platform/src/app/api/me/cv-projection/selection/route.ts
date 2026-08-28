import * as careerRecord from '@/lib/career-record/service'
import { handleGetCvProjection } from '@/lib/career-record/http-handlers'
import { jsonCareerRecordError } from '@/lib/career-record/http'
import type { CvProjectionSectionKey } from '@/types/career-record'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      cv_id?: string
      section_key?: CvProjectionSectionKey
      ordered_evidence_ids?: string[]
    }
    if (!body.cv_id || !body.section_key || !Array.isArray(body.ordered_evidence_ids)) {
      return jsonCareerRecordError(new Error('البيانات غير صالحة'))
    }
    await careerRecord.setCvEvidenceSelection(
      body.cv_id,
      body.section_key,
      body.ordered_evidence_ids,
    )
    return handleGetCvProjection(body.cv_id)
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}
