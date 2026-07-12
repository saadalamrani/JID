import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export type RlsTestUser = {
  id: string
  email: string
  password: string
}

const TEST_PASSWORD = 'RlsTest1!pass'

export async function createPrivateProfileUser(
  admin: SupabaseClient,
  label: string,
): Promise<RlsTestUser> {
  const id = randomUUID()
  const email = `rls-${label}-${id}@jid.local.test`

  const { data, error } = await admin.auth.admin.createUser({
    id,
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })

  if (error || !data.user) {
    throw new Error(`Failed to create RLS test user (${label}): ${error?.message ?? 'no user'}`)
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    full_name: `RLS ${label}`,
    role: 'individual',
    locale: 'ar',
    visibility: 'private',
    show_profile_to_companies: false,
    profile_state: 'incomplete',
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw new Error(`Failed to seed private profile (${label}): ${profileError.message}`)
  }

  return { id: data.user.id, email, password: TEST_PASSWORD }
}

export async function deleteRlsTestUser(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    throw new Error(`Failed to delete RLS test user (${userId}): ${error.message}`)
  }
}
