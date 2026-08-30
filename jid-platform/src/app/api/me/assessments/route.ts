import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: 'authentication required' }, { status: 401 })
  const { data, error } = await supabase.from('assessment_assignments')
    .select('id,application_id,state,attempt_number,invited_at,expires_at,consented_at,started_at,completed_at,withdrawn_at,failure_code,disclosure_snapshot')
    .order('invited_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ assignments: data ?? [] })
}


