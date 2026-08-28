import { handleSetLifecycle } from '@/lib/career-record/http-handlers'
import { jsonCareerRecordError } from '@/lib/career-record/http'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  try {
    const body: unknown = await request.json()
    return handleSetLifecycle(id, body)
  } catch {
    return jsonCareerRecordError(new Error('Invalid JSON'))
  }
}
