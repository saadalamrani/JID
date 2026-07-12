import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type RlsTestEnv = {
  url: string
  anonKey: string
  serviceRoleKey: string
}

export function isLocalSupabaseUrl(url: string): boolean {
  return url.includes('127.0.0.1') || url.includes('localhost')
}

export function getRlsTestEnv(): RlsTestEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceRoleKey) {
    return null
  }

  if (!isLocalSupabaseUrl(url)) {
    return null
  }

  const placeholderKeys = new Set(['test-anon-key', 'test-service-role-key', 'placeholder-anon-key', 'placeholder-service-role-key'])
  if (placeholderKeys.has(anonKey) || placeholderKeys.has(serviceRoleKey)) {
    return null
  }

  return { url, anonKey, serviceRoleKey }
}

export function createServiceRoleClient(env: RlsTestEnv): SupabaseClient {
  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createAnonClient(env: RlsTestEnv): SupabaseClient {
  return createClient(env.url, env.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function createAuthenticatedClient(
  env: RlsTestEnv,
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createAnonClient(env)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Failed to sign in RLS test user (${email}): ${error.message}`)
  }
  return client
}
