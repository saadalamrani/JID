import { NextResponse } from 'next/server'
import { fetchCvById } from '@/lib/cv/auto-fill'
import { cvAdditionalDbUpdateSchema } from '@/lib/cv/schemas/additional'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string; entryId: string }> }

async function assertCvOwner(cvId: string, userId: string) {
  const cv = await fetchCvById(cvId)
  if (!cv || cv.user_id !== userId) return null
  return cv
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: cvId, entryId } = await context.params
  const cv = await assertCvOwner(cvId, user.id)
  if (!cv || !cv.additional.some((entry) => entry.id === entryId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = cvAdditionalDbUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    )
  }

  const { error: updateError } = await supabase
    .from('cv_additional')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('cv_id', cvId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const updated = await fetchCvById(cvId)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: cvId, entryId } = await context.params
  const cv = await assertCvOwner(cvId, user.id)
  if (!cv || !cv.additional.some((entry) => entry.id === entryId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('cv_additional')
    .delete()
    .eq('id', entryId)
    .eq('cv_id', cvId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const updated = await fetchCvById(cvId)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
