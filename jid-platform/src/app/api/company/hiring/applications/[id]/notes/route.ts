import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addHiringNote } from '@/lib/hiring/workspace-service'

const bodySchema = z.object({ body: z.string().trim().min(1).max(5000) })

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const body = bodySchema.parse(await request.json())
    const noteId = await addHiringNote(context.params.id, body.body)
    return NextResponse.json({ noteId }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
