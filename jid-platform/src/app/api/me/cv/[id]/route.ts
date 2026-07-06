import { NextResponse } from 'next/server'
import { fetchCvById } from '@/lib/cv/auto-fill'
import { cvHeaderSectionDbPatchSchema } from '@/lib/cv/schemas/header'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: cvId } = await context.params
  const existing = await fetchCvById(cvId)

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = cvHeaderSectionDbPatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    )
  }

  const patch = parsed.data

  const { error: updateError } = await supabase
    .from('cvs')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cvId)
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const updated = await fetchCvById(cvId)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
