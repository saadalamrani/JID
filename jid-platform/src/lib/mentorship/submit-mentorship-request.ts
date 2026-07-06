import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { buildMenteeSnapshot } from '@/lib/mentorship/mentee-snapshot'
import {
  createMentorshipRequestSchema,
  INTENT_STATEMENT_MIN_LENGTH,
  type CreateMentorshipRequestInput,
} from '@/lib/validations/mentorship-request'
import type { MenteeSnapshot } from '@/types/mentorship-request'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

const PROFILE_SNAPSHOT_SELECT = `
  id,
  full_name,
  headline,
  avatar_url,
  university_id,
  college_id,
  target_sectors,
  target_program_types,
  target_regions,
  locale
` as const

export type SubmitMentorshipRequestResult = {
  id: string
  mentee_snapshot: MenteeSnapshot
}

export async function submitMentorshipRequest(
  menteeId: string,
  input: CreateMentorshipRequestInput,
): Promise<SubmitMentorshipRequestResult> {
  const parsed = createMentorshipRequestSchema.parse(input)

  if (parsed.intent_statement.trim().length < INTENT_STATEMENT_MIN_LENGTH) {
    throw new Error(`يجب أن يكون هدف الطلب ${INTENT_STATEMENT_MIN_LENGTH} حرفاً على الأقل`)
  }

  if (parsed.mentor_id === menteeId) {
    throw new Error('لا يمكنك إرسال طلب إرشاد لنفسك')
  }

  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data: mentor, error: mentorError } = await supabase
    .from('mentor_profiles')
    .select('user_id, status, is_accepting_requests')
    .eq('user_id', parsed.mentor_id)
    .maybeSingle()

  if (mentorError) throw new Error(mentorError.message)
  if (!mentor || mentor.status !== 'approved') {
    throw new Error('هذا المرشد غير متاح حالياً')
  }
  if (!mentor.is_accepting_requests) {
    throw new Error('هذا المرشد لا يقبل طلبات جديدة حالياً')
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select(PROFILE_SNAPSHOT_SELECT)
    .eq('id', menteeId)
    .maybeSingle()

  if (profileError || !profile) {
    throw new Error('تعذّر تحميل ملفك الشخصي')
  }

  const profileRow = profile as {
    id: string
    full_name: string | null
    headline: string | null
    avatar_url: string | null
    university_id: string | null
    college_id: string | null
    target_sectors: string[]
    target_program_types: string[]
    target_regions: string[]
    locale: string
  }

  const menteeSnapshot = await buildMenteeSnapshot(profileRow, {
    locale: profileRow.locale ?? 'ar',
    client: supabase,
  })

  const { data: existing } = await supabase
    .from('mentorship_requests')
    .select('id')
    .eq('mentee_id', menteeId)
    .eq('mentor_id', parsed.mentor_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    throw new Error('لديك طلب قيد الانتظار مع هذا المرشد بالفعل')
  }

  const { data: inserted, error: insertError } = await supabase
    .from('mentorship_requests')
    .insert({
      mentee_id: menteeId,
      mentor_id: parsed.mentor_id,
      status: 'pending',
      intent_statement: parsed.intent_statement.trim(),
      focus_area: parsed.focus_area?.trim() || null,
      preferred_medium: parsed.preferred_medium ?? null,
      mentee_snapshot: menteeSnapshot,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23514') {
      throw new Error(`يجب أن يكون هدف الطلب ${INTENT_STATEMENT_MIN_LENGTH} حرفاً على الأقل`)
    }
    throw new Error(insertError.message)
  }

  return {
    id: inserted.id,
    mentee_snapshot: menteeSnapshot,
  }
}
