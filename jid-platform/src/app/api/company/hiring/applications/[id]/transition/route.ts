import { NextResponse } from 'next/server'
import { z } from 'zod'
import { HIRING_OUTCOMES } from '@/types/contracts/hiring'
import { transitionHiringApplication } from '@/lib/hiring/workspace-service'

const bodySchema = z.object({
  toStageId: z.string().uuid(),
  outcome: z.enum(HIRING_OUTCOMES).optional(),
  reason: z.string().trim().max(2000).optional(),
})

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const auditEventId = await transitionHiringApplication({
      applicationId: context.params.id,
      ...body,
    })
    return NextResponse.json({ auditEventId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
