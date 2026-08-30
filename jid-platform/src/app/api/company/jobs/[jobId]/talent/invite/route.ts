import { NextResponse } from 'next/server'
import { z } from 'zod'
import { inviteTalent, withdrawTalentInvitation } from '@/lib/talent-sourcing/service'

const inviteSchema = z.object({
  candidateProfileId: z.string().uuid(),
  messageAr: z.string().trim().min(1).max(2000),
  messageEn: z.string().trim().min(1).max(2000),
})

const withdrawSchema = z.object({
  invitationId: z.string().uuid(),
})

export async function POST(request: Request, context: { params: { jobId: string } }) {
  try {
    const body = inviteSchema.parse(await request.json())
    const invitationId = await inviteTalent({
      jobId: context.params.jobId,
      candidateProfileId: body.candidateProfileId,
      messageAr: body.messageAr,
      messageEn: body.messageEn,
    })
    return NextResponse.json({ invitationId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = withdrawSchema.parse(await request.json())
    const invitationId = await withdrawTalentInvitation(body.invitationId)
    return NextResponse.json({ invitationId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
