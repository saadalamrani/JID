import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getPublicEnv, parseServerEnv } from '@/lib/env'
import type { Database } from './types'

export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = parseServerEnv()
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv()

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin client. Set it in .env.local (server-only).',
    )
  }

  return createSupabaseClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
