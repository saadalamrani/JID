import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

export type MfaAssuranceLevel = {
  currentLevel: 'aal1' | 'aal2' | null
  nextLevel: 'aal1' | 'aal2' | null
}

export type TotpEnrollment = {
  id: string
  type: 'totp'
  totp: {
    qr_code: string
    secret: string
    uri: string
  }
  friendly_name?: string
}

export async function getMfaAssuranceLevel(
  supabase: SupabaseClient<Database>,
): Promise<MfaAssuranceLevel> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return {
    currentLevel: data.currentLevel,
    nextLevel: data.nextLevel,
  }
}

export async function listTotpFactors(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp ?? []
}

export async function getVerifiedTotpFactor(supabase: SupabaseClient<Database>) {
  const factors = await listTotpFactors(supabase)
  return factors.find((factor) => factor.status === 'verified') ?? null
}

export async function needsMfaEnrollment(supabase: SupabaseClient<Database>): Promise<boolean> {
  const factors = await listTotpFactors(supabase)
  return !factors.some((factor) => factor.status === 'verified')
}

export async function enrollTotp(
  supabase: SupabaseClient<Database>,
  friendlyName = 'JID Authenticator',
): Promise<TotpEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  })

  if (error) throw error
  return data as TotpEnrollment
}

export async function challengeTotp(supabase: SupabaseClient<Database>, factorId: string) {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId })
  if (error) throw error
  return data
}

export async function verifyTotp(
  supabase: SupabaseClient<Database>,
  params: { factorId: string; challengeId: string; code: string },
) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId: params.factorId,
    challengeId: params.challengeId,
    code: params.code,
  })

  if (error) throw error
  return data
}

export async function isAal2(supabase: SupabaseClient<Database>): Promise<boolean> {
  const level = await getMfaAssuranceLevel(supabase)
  return level.currentLevel === 'aal2'
}
