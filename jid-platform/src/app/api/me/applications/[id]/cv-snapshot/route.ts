import { handleCreateApplicationCvSnapshot } from '@/lib/career-record/http-handlers'
import { jsonCareerRecordError } from '@/lib/career-record/http'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  try {
    const body = (await request.json()) as { cv_id?: string; authorization_id?: string }
    return handleCreateApplicationCvSnapshot({
      application_id: id,
      cv_id: body.cv_id,
      authorization_id: body.authorization_id,
    })
  } catch {
    return jsonCareerRecordError(new Error('Invalid JSON'))
  }
}
