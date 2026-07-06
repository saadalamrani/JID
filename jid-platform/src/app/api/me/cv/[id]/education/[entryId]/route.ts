import { NextResponse } from 'next/server'
import { fetchCvById } from '@/lib/cv/auto-fill'
import { cvEducationDbUpdateSchema } from '@/lib/cv/schemas/education'
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
  if (!cv || !cv.education.some((entry) => entry.id === entryId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = cvEducationDbUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    )
  }

  const patch = parsed.data

  const { error: updateError } = await supabase
    .from('cv_education')
    .update({
      ...patch,
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
  if (!cv || !cv.education.some((entry) => entry.id === entryId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('cv_education')
    .delete()
    .eq('id', entryId)
    .eq('cv_id', cvId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const remaining = cv.education.filter((entry) => entry.id !== entryId)
  const now = new Date().toISOString()
  const reorderUpdates = remaining.map((entry, index) =>
    supabase
      .from('cv_education')
      .update({ sort_order: index, updated_at: now })
      .eq('id', entry.id)
      .eq('cv_id', cvId),
  )

  if (reorderUpdates.length > 0) {
    const results = await Promise.all(reorderUpdates)
    const failed = results.find((result) => result.error)
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 })
    }
  }

  const updated = await fetchCvById(cvId)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
