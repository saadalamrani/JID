import { NextResponse } from 'next/server'
import { z } from 'zod'
import { submitWorkSample, withdrawWorkSample } from '@/lib/hiring-evidence/evidence-service'

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('submit'),
    artifactRefs: z
      .array(z.object({ label: z.string().trim().min(1).max(300), href: z.string().trim().min(1).max(2000) }))
      .min(1)
      .max(50),
    noteAr: z.string().trim().max(8000).nullish(),
    noteEn: z.string().trim().max(8000).nullish(),
    termsRef: z.string().trim().max(200).nullish(),
  }),
  z.object({ action: z.literal('withdraw') }),
])

export async function POST(request: Request, context: { params: { submissionId: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    if (body.action === 'withdraw') {
      const id = await withdrawWorkSample(context.params.submissionId)
      return NextResponse.json({ submissionId: id, state: 'withdrawn' })
    }
    const id = await submitWorkSample({
      submissionId: context.params.submissionId,
      artifactRefs: body.artifactRefs,
      noteAr: body.noteAr ?? null,
      noteEn: body.noteEn ?? null,
      termsRef: body.termsRef ?? null,
    })
    return NextResponse.json({ submissionId: id, state: 'submitted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
