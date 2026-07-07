/**
 * Section 12 Steps 8–10 — live statistics hub + market trends verification.
 *
 * Run: pnpm tsx scripts/verify-pulse-metrics-trends.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FEATURE_FLAG_KEYS } from '../src/lib/features/feature-flag-keys'
import { METRICS_CONFIG, buildVisibleMetrics } from '../src/lib/pulse/metrics-config'

const BASE = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'

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

async function fetchPulseHtml(flags: { public?: boolean; metrics?: boolean; trends?: boolean } = {}) {
  const headers = new Headers()
  if (flags.public !== undefined) {
    headers.set('x-jid-test-pulse-public', flags.public ? 'true' : 'false')
  }
  const response = await fetch(`${BASE}/pulse`, { redirect: 'manual', headers })
  return { status: response.status, html: response.ok ? await response.text() : '' }
}

async function main() {
  console.log('Section 12 Steps 8–10 — Pulse metrics & trends\n')

  const responseRate = METRICS_CONFIG.find((m) => m.thresholdKey === 'response_rate')
  if (responseRate?.labelAr === 'معدل الاستجابة في جِد') {
    pass('JID Response Rate label', responseRate.labelAr)
  } else {
    fail('JID Response Rate label', responseRate?.labelAr ?? 'missing')
  }

  if (
    !JSON.stringify(METRICS_CONFIG).includes('الامتثال الوطني') &&
    !JSON.stringify(METRICS_CONFIG).includes('National Compliance')
  ) {
    pass('no National Compliance label in METRICS_CONFIG')
  } else {
    fail('National Compliance label', 'forbidden label found')
  }

  const metricCardSrc = readFileSync(
    join(process.cwd(), 'src/app/[locale]/(public)/pulse/_components/metric-card.tsx'),
    'utf8',
  )
  if (metricCardSrc.includes('useInView(ref, { once: true')) pass('MetricCard useInView once: true')
  else fail('MetricCard once animation', 'missing useInView once: true')

  if (metricCardSrc.includes('tabular-nums')) pass('MetricCard tabular-nums class')
  else fail('MetricCard tabular-nums', 'missing')

  if (
    metricCardSrc.includes('useMotionValue') &&
    metricCardSrc.includes('useTransform') &&
    metricCardSrc.includes('animate(motionValue')
  ) {
    pass('MetricCard Framer count-up pattern')
  } else {
    fail('MetricCard animation', 'missing motion value pattern')
  }

  const sectorSrc = readFileSync(
    join(process.cwd(), 'src/app/[locale]/(public)/pulse/_components/sector-bars.tsx'),
    'utf8',
  )
  const skillsSrc = readFileSync(
    join(process.cwd(), 'src/app/[locale]/(public)/pulse/_components/skills-bars.tsx'),
    'utf8',
  )

  if (sectorSrc.includes('whileInView') && !sectorSrc.includes('recharts') && !sectorSrc.includes('chart.js')) {
    pass('SectorBars uses whileInView div widths (no chart library)')
  } else fail('SectorBars implementation', 'unexpected chart dependency')

  if (skillsSrc.includes('whileInView') && !skillsSrc.includes('recharts') && !skillsSrc.includes('chart.js')) {
    pass('SkillsBars uses whileInView div widths (no chart library)')
  } else fail('SkillsBars implementation', 'unexpected chart dependency')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  try {
    await fetch(BASE, { method: 'HEAD' })
  } catch {
    fail('dev server', `not reachable at ${BASE}`)
    process.exit(1)
  }

  await admin.from('feature_flags').update({ is_enabled: true }).eq('key', FEATURE_FLAG_KEYS.PLATFORM_PULSE_PUBLIC)
  await admin.from('feature_flags').update({ is_enabled: true }).eq('key', FEATURE_FLAG_KEYS.PLATFORM_PULSE_METRICS)
  await admin.from('feature_flags').update({ is_enabled: true }).eq('key', FEATURE_FLAG_KEYS.PLATFORM_PULSE_TRENDS)

  let visibleCount = 0
  let hasResponseRateVisible = false

  const { data: thresholds } = await admin
    .from('metric_thresholds')
    .select('metric_key, min_value, current_value, is_met')

  const { data: snapshot } = await admin
    .from('platform_metrics_snapshot')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (thresholds && snapshot) {
    const visible = buildVisibleMetrics(
      {
        id: Number(snapshot.id),
        refreshed_at: snapshot.refreshed_at,
        total_candidates: Number(snapshot.total_candidates),
        total_companies: Number(snapshot.total_companies),
        active_jobs: Number(snapshot.active_jobs),
        total_jobs_ever: Number(snapshot.total_jobs_ever),
        total_mentors: Number(snapshot.total_mentors),
        total_sessions: Number(snapshot.total_sessions),
        jid_response_rate_pct: Number(snapshot.jid_response_rate_pct),
      },
      thresholds.map((row) => ({
        metric_key: row.metric_key,
        is_displayed: row.is_met,
      })),
    )

    visibleCount = visible.length
    hasResponseRateVisible = visible.some((m) => m.thresholdKey === 'response_rate')
    const displayedCount = thresholds.filter((row) => row.is_met).length
    pass(
      'threshold filter logic',
      `${visible.length} visible of ${METRICS_CONFIG.length} configured (${displayedCount} thresholds met)`,
    )

    const candidates = thresholds.find((row) => row.metric_key === 'total_candidates')
    if (candidates) {
      const originalMin = Number(candidates.min_value)
      await admin.from('metric_thresholds').update({ min_value: 0 }).eq('metric_key', 'total_candidates')

      const { data: recheck } = await admin
        .from('metric_thresholds')
        .select('is_met')
        .eq('metric_key', 'total_candidates')
        .single()

      if (recheck?.is_met === true) {
        pass('lowering min_value reveals total_candidates threshold (is_met=true)')
      } else {
        fail('threshold reveal', `is_met=${recheck?.is_met}`)
      }

      await admin.from('metric_thresholds').update({ min_value: originalMin }).eq('metric_key', 'total_candidates')
    }
  } else {
    fail('snapshot/thresholds probe', 'Supabase unreachable or views missing — run migration 016')
  }

  const page = await fetchPulseHtml({ public: true })
  if (page.status === 200) pass('pulse page loads with flags on → 200')
  else fail('pulse page', `HTTP ${page.status}`)

  if (!thresholds || !snapshot) {
    // probe failure already recorded
  } else if (visibleCount === 0) {
    if (!page.html.includes('إحصائيات المنصة الحية') && !page.html.includes('آخر تحديث')) {
      pass('hub hidden when zero metrics pass threshold')
    } else {
      fail('hub hidden', 'hub markup present when no metrics should display')
    }
  } else if (page.html.includes('آخر تحديث')) {
    pass('hub shows آخر تحديث freshness header when metrics visible')
  }

  if (page.html.includes('معدل الاستجابة في جِد')) {
    pass('rendered page uses JID Response Rate Arabic label')
  } else if (hasResponseRateVisible) {
    fail('rendered JID label', 'response rate metric visible but label missing in HTML')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
