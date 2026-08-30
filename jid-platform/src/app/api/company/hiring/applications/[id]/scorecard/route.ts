import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { openScorecard, submitScorecard } from '@/lib/hiring-evidence/evidence-service'

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('open'), stageId: z.string().uuid().nullable() }),
  z.object({ action: z.literal('submit'), scorecardId: z.string().uuid() }),
])

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())

    if (body.action === 'submit') {
      const auditEventId = await submitScorecard(body.scorecardId)
      return NextResponse.json({ scorecardId: body.scorecardId, auditEventId })
    }

    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const scorecardId = await openScorecard({
      applicationId: context.params.id,
      stageId: body.stageId,
      evaluatorId: auth.user.id,
    })
    return NextResponse.json({ scorecardId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
