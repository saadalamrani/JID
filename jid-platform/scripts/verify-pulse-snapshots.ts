/**
 * Section 12 Steps 4–5 — pulse materialized views + threshold sync verification.
 *
 * Run: pnpm tsx scripts/verify-pulse-snapshots.ts
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

let passed = 0
let failed = 0

function pass(label: string, detail?: string) {
  passed += 1
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`)
}

function fail(label: string, detail: string) {
  failed += 1
  console.log(`  FAIL  ${label} — ${detail}`)
}

async function rpcVoid(admin: ReturnType<typeof createClient>, fn: string) {
  const { error } = await admin.rpc(fn)
  if (error) throw new Error(`${fn}: ${error.message}`)
}

async function main() {
  console.log('Section 12 Steps 4–5 — Pulse materialized views\n')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey || !anonKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const anon = createClient(url, anonKey, { auth: { persistSession: false } })

  const { error: probeError } = await admin.from('platform_metrics_snapshot').select('id').limit(1)
  if (probeError) {
    const detail =
      probeError.message === 'TypeError: fetch failed'
        ? 'Supabase unreachable — start Docker Desktop and run: npx supabase start && npx supabase db push'
        : probeError.message.includes('does not exist')
          ? 'Run migrations 016_pulse_materialized_views.sql and 017_pulse_cron_jobs.sql'
          : probeError.message
    fail('platform_metrics_snapshot table', detail)
    console.log(`\n${passed} passed, ${failed} failed`)
    process.exit(1)
  }

  for (const fn of [
    'refresh_pulse_metrics',
    'refresh_sector_demand',
    'refresh_skills_demand',
    'sync_thresholds_after_refresh',
  ] as const) {
    try {
      await rpcVoid(admin, fn)
      pass(`manual ${fn}()`)
    } catch (error) {
      fail(fn, error instanceof Error ? error.message : String(error))
    }
  }

  const { data: metrics, error: metricsError } = await admin
    .from('platform_metrics_snapshot')
    .select(
      'id, total_candidates, total_companies, active_jobs, total_jobs_ever, total_mentors, total_sessions, jid_response_rate_pct, refreshed_at',
    )
    .eq('id', 1)
    .maybeSingle()

  if (metricsError || !metrics) {
    fail('platform_metrics_snapshot row', metricsError?.message ?? 'missing singleton row')
  } else {
    pass(
      'platform_metrics_snapshot populated',
      `candidates=${metrics.total_candidates}, companies=${metrics.total_companies}, jobs=${metrics.total_jobs_ever}, mentors=${metrics.total_mentors}, sessions=${metrics.total_sessions}, jid_response_rate_pct=${metrics.jid_response_rate_pct}`,
    )

    const numericFields = [
      'total_candidates',
      'total_companies',
      'active_jobs',
      'total_jobs_ever',
      'total_mentors',
      'total_sessions',
      'jid_response_rate_pct',
    ] as const
    const allNumeric = numericFields.every((key) => metrics[key] != null && !Number.isNaN(Number(metrics[key])))
    if (allNumeric) pass('snapshot metrics are numeric')
    else fail('snapshot metric types', 'one or more fields are null/NaN')
  }

  const { count: sectorCount, error: sectorError } = await admin
    .from('sector_demand_snapshot')
    .select('sector_id', { count: 'exact', head: true })

  if (sectorError) fail('sector_demand_snapshot', sectorError.message)
  else pass('sector_demand_snapshot readable', `${sectorCount ?? 0} sector rows`)

  const { count: skillsCount, error: skillsError } = await admin
    .from('skills_demand_snapshot')
    .select('skill_name', { count: 'exact', head: true })

  if (skillsError) fail('skills_demand_snapshot', skillsError.message)
  else pass('skills_demand_snapshot readable', `${skillsCount ?? 0} skill rows`)

  const { data: thresholds, error: thresholdError } = await admin
    .from('metric_thresholds')
    .select('metric_key, current_value, label_en')
    .in('metric_key', [
      'total_candidates',
      'total_companies',
      'total_jobs',
      'total_mentors',
      'total_sessions',
      'response_rate',
    ])

  if (thresholdError || !thresholds) {
    fail('metric_thresholds', thresholdError?.message ?? 'no rows')
  } else {
    const responseLabel = thresholds.find((row) => row.metric_key === 'response_rate')?.label_en
    if (responseLabel === 'JID Response Rate') pass('response_rate labeled "JID Response Rate"')
    else fail('response_rate label', `got "${responseLabel ?? 'missing'}"`)

    if (metrics) {
      const expected: Record<string, number> = {
        total_candidates: Number(metrics.total_candidates),
        total_companies: Number(metrics.total_companies),
        total_jobs: Number(metrics.total_jobs_ever),
        total_mentors: Number(metrics.total_mentors),
        total_sessions: Number(metrics.total_sessions),
        response_rate: Number(metrics.jid_response_rate_pct),
      }

      let synced = true
      for (const row of thresholds) {
        const want = expected[row.metric_key]
        if (want == null) continue
        if (Number(row.current_value) !== want) {
          synced = false
          fail(
            `threshold sync ${row.metric_key}`,
            `current_value=${row.current_value}, snapshot=${want}`,
          )
        }
      }
      if (synced) pass('metric_thresholds.current_value matches platform_metrics_snapshot')
    }
  }

  const { error: anonMetricsError } = await anon.from('platform_metrics_snapshot').select('id').limit(1)
  if (anonMetricsError) fail('anon SELECT platform_metrics_snapshot', anonMetricsError.message)
  else pass('anon can SELECT platform_metrics_snapshot')

  const { error: anonSkillsError } = await anon.from('skills_demand_snapshot').select('skill_name').limit(1)
  if (anonSkillsError) fail('anon SELECT skills_demand_snapshot', anonSkillsError.message)
  else pass('anon can SELECT skills_demand_snapshot')

  console.log('\n  NOTE  Cron schedules (verify via SQL editor if needed):')
  console.log('        refresh-pulse-metrics  → 0 * * * *')
  console.log('        sync-thresholds        → 5 * * * *')
  console.log('        refresh-sector-demand  → 15 * * * *')
  console.log('        refresh-skills-demand  → 20 * * * *')

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
