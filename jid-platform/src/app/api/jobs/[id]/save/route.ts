import { NextResponse } from 'next/server'
import { insertApplicationSave } from '@/lib/jobs/self-declaration-server'
import { createClient } from '@/lib/supabase/server'

type JobSaveRouteProps = {
  params: { id: string }
}

export async function POST(_request: Request, { params }: JobSaveRouteProps) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const result = await insertApplicationSave(supabase, user.id, params.id)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Application save failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
