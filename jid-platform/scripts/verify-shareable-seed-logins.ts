/**
 * One-shot live entitlement / role verification against nonprod Auth.
 * Usage: pnpm tsx scripts/verify-shareable-seed-logins.ts
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from './lib/p110-env'
import { SEED_PASSWORD, SHAREABLE_TEST_ACCOUNTS } from './lib/seed-safety'

async function main() {
  const env = {
    ...loadEnvFile('.env.seed.nonprod'),
    ...(process.env as Record<string, string>),
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const row of SHAREABLE_TEST_ACCOUNTS) {
    const { data, error } = await client.auth.signInWithPassword({
      email: row.email,
      password: SEED_PASSWORD,
    })
    if (error || !data.user) {
      console.log(JSON.stringify({ email: row.email, ok: false, error: error?.message }))
      continue
    }

    const { data: profile } = await client
      .from('profiles')
      .select('role, profile_state, onboarding_completed_at')
      .eq('id', data.user.id)
      .maybeSingle()

    const { data: ents, error: entError } = await client.rpc('get_my_entitlements')

    let companyEntitlements: unknown = null
    if (row.email.startsWith('business-')) {
      const companyId = row.email.includes('verified')
        ? 'b2000001-0000-4000-8000-000000000001'
        : 'b2000002-0000-4000-8000-000000000002'
      const features = ['smart_communication', 'ssis', 'priority_visibility'] as const
      const checks: Record<string, boolean | string> = {}
      for (const feature of features) {
        const { data: has, error: ce } = await client.rpc('company_has_entitlement', {
          p_company_id: companyId,
          p_feature: feature,
        })
        checks[feature] = ce ? ce.message : Boolean(has)
      }
      companyEntitlements = checks
    }

    console.log(
      JSON.stringify({
        email: row.email,
        ok: true,
        role: profile?.role ?? null,
        profile_state: profile?.profile_state ?? null,
        onboarding_completed_at: profile?.onboarding_completed_at ?? null,
        user_entitlements: ents ?? [],
        user_entitlement_error: entError?.message ?? null,
        company_entitlements: companyEntitlements,
      }),
    )
    await client.auth.signOut()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
