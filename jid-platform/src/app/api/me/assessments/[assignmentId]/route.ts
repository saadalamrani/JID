import { NextResponse } from 'next/server'
import { z } from 'zod'
import { transitionAssessment } from '@/lib/assessment-orchestration/service'

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('consent'), termsRef: z.string().min(1).max(500) }),
  z.object({ action: z.literal('start'), providerSessionRef: z.string().max(500).nullish() }),
  z.object({ action: z.literal('withdraw'), reason: z.string().max(2000).nullish() }),
  z.object({ action: z.literal('technical_failure'), failureCode: z.string().min(1).max(100), reason: z.string().max(2000).nullish() }),
])

export async function POST(request: Request, context: { params: { assignmentId: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const assignmentId = await transitionAssessment({ assignmentId: context.params.assignmentId, ...body })
    return NextResponse.json({ assignmentId })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 })
  }
}

