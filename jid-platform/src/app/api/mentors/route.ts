import { NextResponse } from 'next/server'
import { fetchMentors } from '@/lib/queries/mentors'
import { parseMentorFiltersFromSearchParams } from '@/types/mentor'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = parseMentorFiltersFromSearchParams(searchParams)
    const result = await fetchMentors(filters)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذّر تحميل المرشدين'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
