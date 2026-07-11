/**
 * One-shot: seed Model 1 plans on cloud if missing.
 * Run: pnpm tsx scripts/seed-model1-plans.ts
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  const text = readFileSync(path, 'utf-8')
  const env: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
  return env
}

async function main() {
  const env = loadEnvLocal()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { count, error: countError } = await admin
    .from('plans')
    .select('id', { count: 'exact', head: true })

  if (countError) {
    console.error('plans table check failed:', countError.message)
    process.exit(1)
  }

  if ((count ?? 0) > 0) {
    console.log(`✓ plans already seeded (${count} rows)`)
    return
  }

  const plans = [
    {
      key: 'jid_plus',
      audience: 'user' as const,
      name_ar: 'جِد بلس',
      name_en: 'JID Plus',
      price_monthly_sar: 49,
      price_yearly_sar: 399,
      display_order: 1,
    },
    {
      key: 'employer_premium',
      audience: 'company' as const,
      name_ar: 'بريميوم للشركات',
      name_en: 'Employer Premium',
      price_monthly_sar: 999,
      price_yearly_sar: 9990,
      display_order: 2,
    },
    {
      key: 'employer_enterprise',
      audience: 'company' as const,
      name_ar: 'مؤسسات',
      name_en: 'Employer Enterprise',
      price_monthly_sar: 2499,
      price_yearly_sar: 24990,
      display_order: 3,
    },
  ]

  const { data: inserted, error: insertError } = await admin
    .from('plans')
    .upsert(plans, { onConflict: 'key' })
    .select('id, key')

  if (insertError) {
    console.error('plans insert failed:', insertError.message)
    process.exit(1)
  }

  const planByKey = Object.fromEntries((inserted ?? []).map((p) => [p.key, p.id]))

  const entitlements: { plan_id: string; feature_key: string; quota: number | null }[] = []

  for (const fk of ['cv_pro_formats', 'search_for_me', 'lammah_feed']) {
    entitlements.push({ plan_id: planByKey.jid_plus, feature_key: fk, quota: null })
  }
  for (const [fk, quota] of [
    ['smart_communication', null],
    ['ssis', null],
    ['priority_visibility', 3],
  ] as const) {
    entitlements.push({
      plan_id: planByKey.employer_premium,
      feature_key: fk,
      quota: quota,
    })
  }
  for (const [fk, quota] of [
    ['smart_communication', null],
    ['ssis', null],
    ['priority_visibility', 10],
  ] as const) {
    entitlements.push({
      plan_id: planByKey.employer_enterprise,
      feature_key: fk,
      quota: quota,
    })
  }

  const { error: entError } = await admin
    .from('plan_entitlements')
    .upsert(entitlements, { onConflict: 'plan_id,feature_key' })

  if (entError) {
    console.error('plan_entitlements insert failed:', entError.message)
    process.exit(1)
  }

  console.log('✓ Model 1 plans + entitlements seeded')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
