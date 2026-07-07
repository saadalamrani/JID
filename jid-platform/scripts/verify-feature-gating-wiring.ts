/**
 * Feature-flag module wiring verification (static + FLAG_KEYS discipline).
 * Run: pnpm tsx scripts/verify-feature-gating-wiring.ts
 */

import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { FLAG_KEYS } from '../src/lib/feature-flags/keys'

const ROOT = resolve(process.cwd())

let passed = 0
let failed = 0

function pass(label: string) {
  passed += 1
  console.log(`  PASS  ${label}`)
}

function fail(label: string, detail?: string) {
  failed += 1
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf-8')
}

function assertUsesFlagKeysOnly(rel: string, label: string) {
  const src = read(rel)
    .split('\n')
    .filter((line) => !line.includes('getTranslations('))
    .join('\n')
  const rawFlagLiterals = [
    'platform_pulse_public',
    'platform_pulse_announcements',
    'platform_pulse_metrics',
    'platform_pulse_trends',
    'universities.discover',
    'cv_builder.smart_hints',
    'jobs.smart_matching',
    'jobs.application_analytics',
    'radar.realtime_updates',
    'mentorship.discovery',
  ]

  const offenders = rawFlagLiterals.filter((literal) => src.includes(`'${literal}'`) || src.includes(`"${literal}"`))
  if (offenders.length === 0) {
    pass(`${label} uses FLAG_KEYS (no raw flag literals)`)
  } else {
    fail(`${label} raw flag literals`, offenders.join(', '))
  }

  if (src.includes('FLAG_KEYS.')) pass(`${label} references FLAG_KEYS`)
  else fail(`${label} missing FLAG_KEYS import usage`)
}

function main() {
  console.log('Feature-flag gating wiring verification\n')

  const modules = [
    ['src/app/[locale]/(public)/pulse/page.tsx', 'Pulse page'],
    ['src/app/[locale]/(public)/universities/page.tsx', 'Universities discover'],
    ['src/app/[locale]/cv-builder/_components/hints-panel.tsx', 'CV Builder hints'],
    ['src/app/[locale]/(public)/opportunities/[id]/page.tsx', 'Job detail (opportunities)'],
    ['src/app/[locale]/radar/_components/realtime-listener.tsx', 'Radar realtime listener'],
    ['src/middleware.ts', 'Edge middleware'],
  ] as const

  for (const [path, label] of modules) {
    if (existsSync(join(ROOT, path))) pass(`File ${label}`)
    else fail(`Missing ${label}`, path)
  }

  const pulse = read('src/app/[locale]/(public)/pulse/page.tsx')
  if (
    pulse.includes('FeatureGate') &&
    pulse.includes('FLAG_KEYS.PULSE_BILLBOARD') &&
    pulse.includes('FLAG_KEYS.PULSE_LIVE_METRICS') &&
    pulse.includes('FLAG_KEYS.PULSE_MARKET_TRENDS')
  ) {
    pass('Pulse: FeatureGate on billboard, live metrics, market trends')
  } else {
    fail('Pulse FeatureGate sections')
  }

  const universities = read('src/app/[locale]/(public)/universities/page.tsx')
  if (
    universities.includes('isFeatureEnabled') &&
    universities.includes('FLAG_KEYS.UNIVERSITIES_DISCOVER') &&
    universities.includes("redirect('/')")
  ) {
    pass('Universities: route redirect when discover disabled')
  } else {
    fail('Universities route gate')
  }

  const hints = read('src/app/[locale]/cv-builder/_components/hints-panel.tsx')
  if (hints.includes('FeatureGateClient') && hints.includes('fallback={null}')) {
    pass('CV Builder: silent FeatureGateClient hide')
  } else {
    fail('CV Builder hints gate')
  }

  const jobDetail = read('src/app/[locale]/(public)/opportunities/[id]/page.tsx')
  if (
    jobDetail.includes('areFeaturesEnabled') &&
    jobDetail.includes('FLAG_KEYS.JOBS_SMART_MATCHING') &&
    jobDetail.includes('FLAG_KEYS.JOBS_APPLICATION_ANALYTICS')
  ) {
    pass('Job detail: batch areFeaturesEnabled')
  } else {
    fail('Job detail batch flags')
  }

  const radar = read('src/app/[locale]/radar/_components/realtime-listener.tsx')
  if (
    radar.includes('useFeatureFlag') &&
    radar.includes('FLAG_KEYS.RADAR_REALTIME_UPDATES') &&
    radar.includes('realtimeActive')
  ) {
    pass('Radar: conditional realtime subscription')
  } else {
    fail('Radar realtime gate')
  }

  const middleware = read('src/middleware.ts')
  if (
    middleware.includes('isMentorshipDiscoveryPath') &&
    middleware.includes('FLAG_KEYS.MENTORSHIP_DISCOVERY') &&
    middleware.includes('getMiddlewareFeatureEnabled')
  ) {
    pass('Middleware: mentorship.discovery RPC gate')
  } else {
    fail('Middleware mentorship gate')
  }

  for (const [path, label] of modules.slice(0, -1)) {
    assertUsesFlagKeysOnly(path, label)
  }

  const expectedKeys = [
    'PULSE_BILLBOARD',
    'PULSE_LIVE_METRICS',
    'PULSE_MARKET_TRENDS',
    'UNIVERSITIES_DISCOVER',
    'CV_BUILDER_SMART_HINTS',
    'JOBS_SMART_MATCHING',
    'JOBS_APPLICATION_ANALYTICS',
    'RADAR_REALTIME_UPDATES',
    'MENTORSHIP_DISCOVERY',
  ] as const

  for (const key of expectedKeys) {
    if (FLAG_KEYS[key]) pass(`FLAG_KEYS.${key} defined`)
    else fail(`FLAG_KEYS.${key} missing`)
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
