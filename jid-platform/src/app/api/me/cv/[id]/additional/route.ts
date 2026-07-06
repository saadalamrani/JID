import { NextResponse } from 'next/server'
import { fetchCvById } from '@/lib/cv/auto-fill'
import { cvAdditionalCreateSchema } from '@/lib/cv/schemas/additional'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

async function assertCvOwner(cvId: string, userId: string) {
  const cv = await fetchCvById(cvId)
  if (!cv || cv.user_id !== userId) return null
  return cv
}

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = cvAdditionalCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    )
  }

  const { error: insertError } = await supabase.from('cv_additional').insert({
    cv_id: cvId,
    category: parsed.data.category,
    title: parsed.data.title,
    sort_order: parsed.data.sort_order,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const updated = await fetchCvById(cvId)
  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(updated)
}
