import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { verifyOtpHash } from '@/lib/verification/otp-hash'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Client = SupabaseClient<Database>
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(client: Client): UntypedClient {
  return client as unknown as UntypedClient
}

export type VerifiedEmailRow = {
  id: string
  email: string
  is_primary: boolean
  verified_at: string
  created_at: string
}

export async function requireMeUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user.id
}

export async function listUserVerifiedEmails(userId: string): Promise<VerifiedEmailRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_verified_emails')
    .select('id, email, is_primary, verified_at, created_at')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as VerifiedEmailRow[]
}

export async function verifyEmailOtpAndInsert(
  userId: string,
  attemptId: string,
  otp: string,
): Promise<VerifiedEmailRow> {
  const supabase = await createClient()
  const client = asUntyped(supabase)

  const { data: attempt, error: fetchError } = await client
    .from('email_verification_attempts')
    .select('id, user_id, email, otp_hash, is_verified, expires_at')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError || !attempt) throw new Error('محاولة تحقق غير صالحة')

  if (attempt.is_verified || new Date(attempt.expires_at).getTime() < Date.now()) {
    throw new Error('انتهت صلاحية رمز التحقق')
  }

  const valid = await verifyOtpHash(otp, attempt.otp_hash)
  if (!valid) throw new Error('رمز التحقق غير صحيح')

  await client
    .from('email_verification_attempts')
    .update({ is_verified: true, verified_at: new Date().toISOString() })
    .eq('id', attemptId)

  const { data: existing } = await supabase
    .from('user_verified_emails')
    .select('id')
    .eq('user_id', userId)
    .eq('is_primary', true)
    .maybeSingle()

  const { data: inserted, error: insertError } = await supabase
    .from('user_verified_emails')
    .insert({
      user_id: userId,
      email: attempt.email,
      is_primary: !existing,
    })
    .select('id, email, is_primary, verified_at, created_at')
    .single()

  if (insertError) {
    if (insertError.code === '23505') throw new Error('هذا البريد مُسجَّل مسبقاً')
    throw new Error(insertError.message)
  }

  return inserted as VerifiedEmailRow
}

export type JobPrivacySettings = {
  show_profile_to_recruiters: boolean
  allow_company_direct_contact: boolean
  show_application_history: boolean
}

export async function getJobPrivacySettings(userId: string): Promise<JobPrivacySettings> {
  const supabase = await createClient()
  const { data, error } = await asUntyped(supabase)
    .from('profiles')
    .select('show_profile_to_companies, allow_company_direct_contact, show_application_history')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) throw new Error('تعذّر تحميل إعدادات الخصوصية')

  const row = data as {
    show_profile_to_companies: boolean
    allow_company_direct_contact: boolean
    show_application_history: boolean
  }

  return {
    show_profile_to_recruiters: row.show_profile_to_companies,
    allow_company_direct_contact: row.allow_company_direct_contact,
    show_application_history: row.show_application_history,
  }
}

export async function updateJobPrivacySettings(
  userId: string,
  values: JobPrivacySettings,
): Promise<void> {
  const supabase = await createClient()
  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      show_profile_to_companies: values.show_profile_to_recruiters,
      allow_company_direct_contact: values.allow_company_direct_contact,
      show_application_history: values.show_application_history,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
