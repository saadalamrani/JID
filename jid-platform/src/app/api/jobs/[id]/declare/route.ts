import { NextResponse } from 'next/server'
import {
  getPrimaryVerifiedEmail,
  insertApplicationDeclaration,
} from '@/lib/jobs/self-declaration-server'
import { createClient } from '@/lib/supabase/server'

type JobDeclareRouteProps = {
  params: { id: string }
}

export async function POST(_request: Request, { params }: JobDeclareRouteProps) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const contactEmail = await getPrimaryVerifiedEmail(supabase, user.id, user.email)
    if (!contactEmail) {
      return NextResponse.json({ error: 'Verified email required' }, { status: 400 })
    }

    const result = await insertApplicationDeclaration(
      supabase,
      user.id,
      params.id,
      contactEmail,
    )

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Application declare failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
