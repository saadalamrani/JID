import { NextResponse } from 'next/server'
import { fetchCvById } from '@/lib/cv/auto-fill'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/** TanStack Query source for CV builder — RLS-scoped to owner. */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cvId = searchParams.get('cvId')

  if (!cvId) {
    return NextResponse.json({ error: 'cvId required' }, { status: 400 })
  }

  const cv = await fetchCvById(cvId)
  if (!cv || cv.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(cv)
}
