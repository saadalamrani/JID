import { NextResponse } from 'next/server'
import { fetchJobs } from '@/lib/queries/jobs'
import { parseJobFiltersFromSearchParams } from '@/types/job'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = parseJobFiltersFromSearchParams(searchParams)
    const result = await fetchJobs(filters)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Jobs fetch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
