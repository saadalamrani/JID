import { handleCreateDeclaredCareerEvidence, handleListCareerEvidence } from '@/lib/career-record/http-handlers'
import { jsonCareerRecordError } from '@/lib/career-record/http'

export const runtime = 'nodejs'

export async function GET() {
  return handleListCareerEvidence()
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    return handleCreateDeclaredCareerEvidence(body)
  } catch {
    return jsonCareerRecordError(new Error('Invalid JSON'))
  }
}
