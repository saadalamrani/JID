/**
 * Applies Section 12 Step 1 seeds when migrations cannot be pushed via CLI.
 * Run: pnpm tsx scripts/apply-feature-flag-foundation.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function loadEnv() {
  try {
    const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq)
      const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // optional
  }
}

loadEnv()

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const pulseFlags = [
    {
      key: 'platform_pulse_public',
      label_ar: 'نبض المنصة العام',
      label_en: 'Platform Pulse (public)',
      description_ar: 'عرض صفحة نبض المنصة للزوار',
      description_en: 'Show the public Platform Pulse page',
      is_enabled: false,
      min_role: 'individual' as const,
      category: 'pulse',
    },
    {
      key: 'platform_pulse_metrics',
      label_ar: 'مقاييس النبض',
      label_en: 'Platform Pulse metrics',
      description_ar: 'عرض بطاقات المقاييس على نبض المنصة',
      description_en: 'Show metric cards on Platform Pulse',
      is_enabled: false,
      min_role: 'individual' as const,
      category: 'pulse',
    },
    {
      key: 'platform_pulse_trends',
      label_ar: 'اتجاهات النبض',
      label_en: 'Platform Pulse trends',
      description_ar: 'عرض مخططات الاتجاهات على نبض المنصة',
      description_en: 'Show trend charts on Platform Pulse',
      is_enabled: false,
      min_role: 'individual' as const,
      category: 'pulse',
    },
    {
      key: 'platform_pulse_announcements',
      label_ar: 'إعلانات النبض',
      label_en: 'Platform Pulse announcements',
      description_ar: 'عرض شريط الإعلانات على نبض المنصة',
      description_en: 'Show the announcements strip on Platform Pulse',
      is_enabled: true,
      min_role: 'individual' as const,
      category: 'pulse',
    },
  ]

  for (const flag of pulseFlags) {
    const { error } = await admin.from('feature_flags').upsert(
      {
        ...flag,
        enabled_for_roles: [],
        user_overrides: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
    if (error) {
      console.error(`feature_flags upsert ${flag.key}:`, error.message)
      process.exit(1)
    }
    console.log(`  upserted feature_flags.${flag.key}`)
  }

  const thresholds = [
    { metric_key: 'total_candidates', label_en: 'Total candidates', label_ar: 'إجمالي المرشحين', min_value: 500 },
    { metric_key: 'total_companies', label_en: 'Total companies', label_ar: 'إجمالي الشركات', min_value: 50 },
    { metric_key: 'total_jobs', label_en: 'Total jobs', label_ar: 'إجمالي الوظائف', min_value: 100 },
    { metric_key: 'total_mentors', label_en: 'Total mentors', label_ar: 'إجمالي المرشدين', min_value: 20 },
    { metric_key: 'total_sessions', label_en: 'Total sessions', label_ar: 'إجمالي الجلسات', min_value: 50 },
    { metric_key: 'response_rate', label_en: 'JID Response Rate', label_ar: 'معدل استجابة جيد', min_value: 0 },
  ]

  const { error: mtProbe } = await admin.from('metric_thresholds').select('metric_key').limit(1)
  if (mtProbe?.message?.includes('does not exist') || mtProbe?.code === '42P01') {
    console.log('\n  metric_thresholds table missing — run migration 014_metric_thresholds.sql via Supabase SQL editor')
    process.exit(0)
  }

  for (const row of thresholds) {
    const { error } = await admin.from('metric_thresholds').upsert(
      { ...row, current_value: 0, updated_at: new Date().toISOString() },
      { onConflict: 'metric_key' },
    )
    if (error) {
      console.error(`metric_thresholds upsert ${row.metric_key}:`, error.message)
      process.exit(1)
    }
    console.log(`  upserted metric_thresholds.${row.metric_key}`)
  }

  console.log('\nDone.')
}

void main()
