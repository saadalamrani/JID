import { NextResponse } from 'next/server'
import { fetchCvById } from '@/lib/cv/auto-fill'
import { mapCvFullRecordToCvData } from '@/lib/cv/mappers'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

/** Section 7.11 — log completed PDF export to `cv_generations`. */
export async function POST(_request: Request, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: cvId } = await context.params
  const cv = await fetchCvById(cvId)

  if (!cv || cv.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const snapshot = mapCvFullRecordToCvData(cv)
  const now = new Date().toISOString()

  const { data: row, error } = await supabase
    .from('cv_generations')
    .insert({
      cv_id: cvId,
      user_id: user.id,
      section: 'export',
      status: 'completed',
      input_snapshot: snapshot,
      output_snapshot: { filename: `${cv.full_name?.trim() || 'Resume'}_Resume.pdf` },
      completed_at: now,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: row.id })
}
