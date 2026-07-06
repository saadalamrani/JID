import { NextResponse } from 'next/server'
import { TriageAccessError } from '@/lib/applications/triage-access'
import { fetchJobApplicantsForTriage } from '@/lib/applications/triage-queries'
import { isTriageFilterTab } from '@/lib/applications/triage-utils'

type RouteContext = { params: Promise<{ jobId: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params
    const { searchParams } = new URL(request.url)
    const filterParam = searchParams.get('filter') ?? 'all'
    const filter = isTriageFilterTab(filterParam) ? filterParam : 'all'

    const result = await fetchJobApplicantsForTriage(jobId, filter)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof TriageAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'تعذّر تحميل المتقدمين'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
