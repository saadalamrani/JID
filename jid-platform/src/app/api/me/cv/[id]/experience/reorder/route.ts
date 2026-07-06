import { NextResponse } from 'next/server'
import { fetchCvById } from '@/lib/cv/auto-fill'
import { cvExperienceReorderSchema } from '@/lib/cv/schemas/experience'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

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

  const { id: cvId } = await context.params
  const cv = await assertCvOwner(cvId, user.id)
  if (!cv) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = cvExperienceReorderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    )
  }

  const existingIds = new Set(cv.experience.map((entry) => entry.id))
  if (
    parsed.data.orderedIds.length !== cv.experience.length ||
    parsed.data.orderedIds.some((id) => !existingIds.has(id))
  ) {
    return NextResponse.json({ error: 'Invalid reorder payload' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const updates = parsed.data.orderedIds.map((entryId, index) =>
    supabase
      .from('cv_experience')
      .update({ sort_order: index, updated_at: now })
      .eq('id', entryId)
      .eq('cv_id', cvId),
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error)
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  const updated = await fetchCvById(cvId)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
