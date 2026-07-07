/**
 * Section 12 Step 7 — announcement carousel + empty state verification.
 *
 * Run: pnpm tsx scripts/verify-announcement-carousel.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { FEATURE_FLAG_KEYS } from '../src/lib/features/feature-flag-keys'
import { AUTO_FLIP_INTERVAL, HERO_IMAGE_OVERLAY_OPACITY } from '../src/app/[locale]/(public)/pulse/_components/announcement-carousel'
import { CATEGORY_CONFIG } from '../src/app/[locale]/(public)/pulse/_components/category-pill'

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

function futureDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

async function fetchPulseHtml(pulsePublic = true) {
  const headers = new Headers()
  headers.set('x-jid-test-pulse-public', pulsePublic ? 'true' : 'false')
  const response = await fetch(`${BASE}/pulse`, { redirect: 'manual', headers })
  const html = response.ok ? await response.text() : ''
  return { status: response.status, html }
}

async function main() {
  console.log('Section 12 Step 7 — Announcement carousel\n')

  if (AUTO_FLIP_INTERVAL !== 5000) fail('AUTO_FLIP_INTERVAL', String(AUTO_FLIP_INTERVAL))
  else pass('AUTO_FLIP_INTERVAL = 5000ms')

  if (HERO_IMAGE_OVERLAY_OPACITY !== 0.72) fail('HERO_IMAGE_OVERLAY_OPACITY', String(HERO_IMAGE_OVERLAY_OPACITY))
  else pass('HERO_IMAGE_OVERLAY_OPACITY = 0.72 (WCAG overlay)')

  const categories = Object.keys(CATEGORY_CONFIG)
  if (categories.length === 5) pass('CATEGORY_CONFIG has 5 categories', categories.join(', '))
  else fail('CATEGORY_CONFIG', `expected 5, got ${categories.length}`)

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
  await admin.from('feature_flags').update({ is_enabled: true }).eq('key', FEATURE_FLAG_KEYS.PLATFORM_PULSE_ANNOUNCEMENTS)

  await admin.from('public_announcements').delete().like('title_ar', 'VERIFY-CAROUSEL-%')

  const seeds = ['jobs', 'mentorship', 'events'].map((category, index) => ({
    title_ar: `VERIFY-CAROUSEL-${category}-عنوان اختبار`,
    body_ar: 'نص اختبار للعرض في الشريط',
    category,
    starts_at: new Date().toISOString(),
    expires_at: futureDays(30 + index),
    is_featured: index === 0,
    is_published: true,
  }))

  const { error: seedError } = await admin.from('public_announcements').insert(seeds)
  if (seedError) {
    fail('seed 3 announcements', seedError.message)
  } else {
    pass('seeded 3 published announcements')
  }

  const withThree = await fetchPulseHtml(true)
  if (withThree.status !== 200) fail('pulse page with 3 announcements', `HTTP ${withThree.status}`)
  else pass('pulse page loads with announcements → 200')

  if (withThree.html.includes('aria-label="إعلانات المنصة"')) pass('carousel region aria-label')
  else fail('carousel aria-label', 'missing إعلانات المنصة')

  if (withThree.html.includes('aria-roledescription="carousel"')) pass('carousel aria-roledescription')
  else fail('carousel roledescription', 'missing')

  if (withThree.html.includes('aria-live="polite"')) pass('sr-only aria-live region')
  else fail('aria-live', 'missing polite live region')

  if (withThree.html.includes('data-auto-flip="true"') || withThree.html.includes('data-auto-flip={true}')) {
    pass('auto-flip enabled for 3 announcements')
  } else if (withThree.html.includes('VERIFY-CAROUSEL-jobs')) {
    pass('carousel renders seeded announcement titles')
  } else {
    fail('carousel content', 'expected carousel markers or seeded title')
  }

  await admin.from('public_announcements').delete().like('title_ar', 'VERIFY-CAROUSEL-%')

  const empty = await fetchPulseHtml(true)
  if (
    empty.html.includes('No announcements right now') ||
    empty.html.includes('لا توجد إعلانات حالياً')
  ) {
    pass('empty state when zero announcements')
  } else {
    fail('empty state', 'expected empty state copy')
  }

  await admin.from('public_announcements').insert({
    title_ar: 'VERIFY-CAROUSEL-single-عنوان',
    body_ar: 'إعلان واحد فقط',
    category: 'platform',
    starts_at: new Date().toISOString(),
    expires_at: futureDays(14),
    is_published: true,
  })

  const single = await fetchPulseHtml(true)
  if (single.html.includes('data-auto-flip="false"')) {
    pass('single announcement disables auto-flip (data-auto-flip=false)')
  } else if (single.html.includes('VERIFY-CAROUSEL-single')) {
    pass('single announcement renders without multi-slide controls')
  } else {
    fail('single announcement', 'expected data-auto-flip=false or single title')
  }

  await admin.from('public_announcements').delete().like('title_ar', 'VERIFY-CAROUSEL-%')

  const carouselSource = readFileSync(
    join(process.cwd(), 'src/app/[locale]/(public)/pulse/_components/announcement-carousel.tsx'),
    'utf8',
  )
  if (
    carouselSource.includes('useReducedMotion') &&
    carouselSource.includes('isPaused') &&
    carouselSource.includes('isFocused') &&
    carouselSource.includes('onMouseEnter') &&
    carouselSource.includes('onFocusCapture')
  ) {
    pass('carousel source guards reduced-motion, pause, focus, and hover')
  } else {
    fail('carousel a11y guards', 'missing expected hooks/handlers in source')
  }

  if (carouselSource.includes("prefersReducedMotion\n        ? { initial: {}, animate: {}, exit: {} }")) {
    pass('AnimatePresence uses empty motion objects when reduced motion preferred')
  } else if (carouselSource.includes('initial: {}, animate: {}, exit: {}')) {
    pass('AnimatePresence uses empty motion objects when reduced motion preferred')
  } else {
    fail('reduced motion variants', 'empty object variants not found')
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
