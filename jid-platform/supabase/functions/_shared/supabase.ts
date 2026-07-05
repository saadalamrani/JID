import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

export function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service configuration')
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) return null

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
  } = await client.auth.getUser()

  return user
}
