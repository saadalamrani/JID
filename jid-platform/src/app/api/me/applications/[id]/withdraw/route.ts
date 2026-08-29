import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withdrawHiringApplication } from '@/lib/hiring/workspace-service'

const bodySchema = z.object({ reason: z.string().trim().max(2000).optional() })

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const auditEventId = await withdrawHiringApplication(context.params.id, body.reason)
    return NextResponse.json({ auditEventId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
