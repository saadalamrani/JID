import { handleGetCvProjection } from '@/lib/career-record/http-handlers'
import * as careerRecord from '@/lib/career-record/service'
import { jsonCareerRecordError } from '@/lib/career-record/http'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const cvId = url.searchParams.get('cvId') ?? undefined
  return handleGetCvProjection(cvId)
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      cv_id?: string
      title?: string | null
      summary?: string | null
      locale?: 'ar' | 'en'
      template_key?: string
    }
    if (!body.cv_id) {
      return jsonCareerRecordError(new Error('cv_id required'))
    }
    await careerRecord.updateCvPresentation(body.cv_id, {
      title: body.title ?? undefined,
      summary: body.summary ?? undefined,
      locale: body.locale,
      template_key: body.template_key,
    })
    return handleGetCvProjection(body.cv_id)
  } catch (error) {
    return jsonCareerRecordError(error)
  }
}
