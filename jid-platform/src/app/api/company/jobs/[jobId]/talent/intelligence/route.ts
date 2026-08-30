import { NextResponse } from 'next/server'
import { loadHiringIntelligence } from '@/lib/talent-sourcing/service'

export async function GET(_request: Request, context: { params: { jobId: string } }) {
  try {
    const report = await loadHiringIntelligence(context.params.jobId)
    return NextResponse.json(report)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
