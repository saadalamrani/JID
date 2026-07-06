import { NextResponse } from 'next/server'
import { getJobDeclarationStatus } from '@/lib/jobs/self-declaration-server'
import { createClient } from '@/lib/supabase/server'

type DeclarationStatusRouteProps = {
  params: { id: string }
}

export async function GET(_request: Request, { params }: DeclarationStatusRouteProps) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const status = await getJobDeclarationStatus(supabase, user.id, params.id, user.email)
    return NextResponse.json(status)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Declaration status failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
