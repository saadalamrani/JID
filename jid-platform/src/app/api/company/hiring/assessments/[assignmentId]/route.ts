import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ingestAssessmentResult, retryAssessment, transitionAssessment } from '@/lib/assessment-orchestration/service'

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.enum(['complete','cancel','provider_failure']), providerSessionRef: z.string().max(500).nullish(), recordingRef: z.string().max(1000).nullish(), failureCode: z.string().max(100).nullish(), reason: z.string().max(2000).nullish() }),
  z.object({ action: z.literal('retry') }),
  z.object({ action: z.literal('result'), criterionId: z.string().uuid(), payload: z.record(z.unknown()), summaryAr: z.string().max(8000).nullish(), summaryEn: z.string().max(8000).nullish(), limitations: z.array(z.unknown()).max(50).optional(), provenanceRef: z.string().min(1).max(1000) }),
])

export async function POST(request: Request, context: { params: { assignmentId: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    if (body.action === 'retry') return NextResponse.json({ assignmentId: await retryAssessment(context.params.assignmentId), state: 'invited' }, { status: 201 })
    if (body.action === 'result') return NextResponse.json({ resultId: await ingestAssessmentResult({ assignmentId: context.params.assignmentId, ...body }) }, { status: 201 })
    const assignmentId = await transitionAssessment({ assignmentId: context.params.assignmentId, ...body })
    return NextResponse.json({ assignmentId })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 })
  }
}

