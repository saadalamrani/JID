import {
  handleAuthorizeDisclosure,
  handleResolveDisclosure,
} from '@/lib/career-record/http-handlers'
import { jsonCareerRecordError } from '@/lib/career-record/http'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const body: unknown = await request.json()
    if (url.searchParams.get('resolve') === '1') {
      return handleResolveDisclosure(body)
    }
    return handleAuthorizeDisclosure(body)
  } catch {
    return jsonCareerRecordError(new Error('Invalid JSON'))
  }
}
