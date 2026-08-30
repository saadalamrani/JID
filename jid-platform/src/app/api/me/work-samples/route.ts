import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** The candidate's own assigned work samples across all their applications. */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const { data, error } = await supabase
      .from('hiring_work_sample_submissions')
      .select(
        'id, application_id, task_id, state, assigned_at, due_at, submitted_at, artifact_refs, ' +
          'hiring_work_sample_tasks(title_ar, title_en, instructions_ar, instructions_en, time_box_minutes)',
      )
      .order('assigned_at', { ascending: false })
    if (error) throw new Error(error.message)
    return NextResponse.json({ submissions: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
