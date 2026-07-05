import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ProfileViewBody = {
  profileId?: string
  companyId?: string
  source?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProfileViewBody
    const profileId = body.profileId
    const companyId = body.companyId

    if (!profileId || !companyId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = supabase as unknown as {
      from: (table: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
      }
    }

    const { error } = await client.from('profile_views').insert({
      profile_id: profileId,
      viewer_company_id: companyId,
      source: body.source ?? 'profile_page',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
