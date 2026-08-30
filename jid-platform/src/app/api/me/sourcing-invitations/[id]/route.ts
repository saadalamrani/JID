import { NextResponse } from 'next/server'
import { z } from 'zod'
import { respondToTalentInvitation } from '@/lib/talent-sourcing/service'

const bodySchema = z.object({
  decision: z.enum(['interested', 'declined']),
})

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const invitationId = await respondToTalentInvitation(context.params.id, body.decision)
    return NextResponse.json({ invitationId, decision: body.decision })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
