import { NextResponse } from 'next/server'
import { fetchJobById } from '@/lib/queries/jobs'

type JobDetailRouteProps = {
  params: { id: string }
}

export async function GET(_request: Request, { params }: JobDetailRouteProps) {
  try {
    const job = await fetchJobById(params.id)
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    return NextResponse.json({ job })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Job detail fetch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
