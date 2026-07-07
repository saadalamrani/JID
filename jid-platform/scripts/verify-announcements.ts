/**
 * Section 12 Step 3 — announcements CRUD + RLS verification.
 *
 * Run: pnpm tsx scripts/verify-announcements.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ANNOUNCEMENT_CATEGORIES } from '../src/lib/validations/announcement'

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

function pastDays(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

async function main() {
  console.log('Section 12 Step 3 — Announcements\n')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey || !anonKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const anon = createClient(url, anonKey, { auth: { persistSession: false } })

  try {
    await fetch(BASE, { method: 'HEAD' })

    const individual = await fetch(`${BASE}/staff/announcements`, {
      redirect: 'manual',
      headers: { 'x-jid-test-role': 'individual', 'x-jid-test-aal2': 'true' },
    })
    if (individual.status === 404) pass('individual blocked from /staff/announcements → 404')
    else fail('individual route guard', `HTTP ${individual.status}`)

    const companyAdmin = await fetch(`${BASE}/staff/announcements`, {
      redirect: 'manual',
      headers: { 'x-jid-test-role': 'company_admin', 'x-jid-test-aal2': 'true' },
    })
    if (companyAdmin.status === 404) pass('company_admin blocked from /staff/announcements → 404')
    else fail('company_admin route guard', `HTTP ${companyAdmin.status}`)

    const staff = await fetch(`${BASE}/staff/announcements`, {
      redirect: 'manual',
      headers: { 'x-jid-test-role': 'staff', 'x-jid-test-aal2': 'true' },
    })
    if (staff.status === 200) pass('staff can access /staff/announcements → 200')
    else fail('staff route access', `HTTP ${staff.status}`)
  } catch {
    fail('dev server', `not reachable at ${BASE}`)
  }

  const { error: tableError } = await admin.from('public_announcements').select('id').limit(1)
  if (tableError) {
    const detail =
      tableError.message === 'TypeError: fetch failed'
        ? 'Supabase unreachable — start Docker Desktop and run: npx supabase start && npx supabase db push'
        : tableError.message
    fail('public_announcements table', detail)
    console.log(`\n${passed} passed, ${failed} failed (DB tests skipped)`)
    process.exit(1)
  }

  await admin.from('public_announcements').delete().like('title_ar', 'VERIFY-%')

  const TEST_PASSWORD = 'VerifyAnnouncements1!'
  const staffEmail = `verify-staff-announcements-${Date.now()}@jid.test`
  const companyAdminEmail = `verify-company-announcements-${Date.now()}@jid.test`

  const { data: staffAuth, error: staffCreateError } = await admin.auth.admin.createUser({
    email: staffEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (staffCreateError || !staffAuth.user) {
    fail('create staff test user', staffCreateError?.message ?? 'missing user')
  } else {
    await admin.from('profiles').upsert({ id: staffAuth.user.id, full_name: 'Verify Staff', role: 'staff' })

    const staffClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: staffSignInError } = await staffClient.auth.signInWithPassword({
      email: staffEmail,
      password: TEST_PASSWORD,
    })
    if (staffSignInError) {
      fail('staff sign-in', staffSignInError.message)
    } else {
      const staffRow = {
        title_ar: 'VERIFY-staff-rls-عنوان',
        body_ar: 'اختبار سياسة الموظفين',
        category: 'platform' as const,
        starts_at: pastDays(0),
        expires_at: futureDays(30),
        is_featured: false,
        is_published: false,
      }

      const { data: staffInsert, error: staffInsertError } = await staffClient
        .from('public_announcements')
        .insert(staffRow)
        .select('id')
        .single()

      if (staffInsertError || !staffInsert) {
        fail('staff RLS INSERT (FOR ALL)', staffInsertError?.message ?? 'no row')
      } else {
        pass('staff RLS INSERT (FOR ALL)')

        const { error: staffUpdateError } = await staffClient
          .from('public_announcements')
          .update({ title_ar: 'VERIFY-staff-rls-محدّث' })
          .eq('id', staffInsert.id)
        if (staffUpdateError) fail('staff RLS UPDATE', staffUpdateError.message)
        else pass('staff RLS UPDATE')

        const { data: staffDrafts } = await staffClient
          .from('public_announcements')
          .select('id')
          .eq('id', staffInsert.id)
        if ((staffDrafts ?? []).length === 1) pass('staff RLS SELECT includes drafts')
        else fail('staff RLS SELECT drafts', `expected 1, got ${staffDrafts?.length ?? 0}`)

        const { error: staffDeleteError } = await staffClient
          .from('public_announcements')
          .delete()
          .eq('id', staffInsert.id)
        if (staffDeleteError) fail('staff RLS DELETE', staffDeleteError.message)
        else pass('staff RLS DELETE')
      }
    }

    await admin.auth.admin.deleteUser(staffAuth.user.id)
  }

  const { data: companyAuth, error: companyCreateError } = await admin.auth.admin.createUser({
    email: companyAdminEmail,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (companyCreateError || !companyAuth.user) {
    fail('create company_admin test user', companyCreateError?.message ?? 'missing user')
  } else {
    await admin
      .from('profiles')
      .upsert({ id: companyAuth.user.id, full_name: 'Verify Company Admin', role: 'company_admin' })

    const companyClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await companyClient.auth.signInWithPassword({ email: companyAdminEmail, password: TEST_PASSWORD })

    const { error: companyInsertError } = await companyClient.from('public_announcements').insert({
      title_ar: 'VERIFY-company-block-عنوان',
      category: 'jobs',
      starts_at: pastDays(0),
      expires_at: futureDays(7),
      is_featured: false,
      is_published: false,
    })

    if (companyInsertError) pass('company_admin blocked by staff RLS policy on INSERT')
    else fail('company_admin RLS', 'INSERT should be denied')

    await admin.auth.admin.deleteUser(companyAuth.user.id)
  }

  const seeds = ANNOUNCEMENT_CATEGORIES.map((category, index) => {
    const published = index < 3
    const expiresAt = index === 4 ? pastDays(1) : futureDays(14 + index)
    return {
      title_ar: `VERIFY-${category}-عنوان اختبار`,
      body_ar: 'نص اختبار للإعلان العام',
      category,
      starts_at: pastDays(1),
      expires_at: expiresAt,
      is_featured: index === 0,
      is_published: published,
    }
  })

  const { data: inserted, error: insertError } = await admin
    .from('public_announcements')
    .insert(seeds)
    .select('id, category, is_published, expires_at')

  if (insertError || !inserted) {
    fail('seed announcements', insertError?.message ?? 'insert failed')
    process.exit(1)
  }

  pass('seeded 5 announcements (3 published, 2 drafts)')

  const { data: publicRows, error: publicError } = await anon
    .from('public_announcements')
    .select('id, category, title_ar')
    .like('title_ar', 'VERIFY-%')

  if (publicError) {
    fail('public RLS select', publicError.message)
  } else {
    const visible = publicRows ?? []
    if (visible.length === 3) {
      pass('public RLS shows exactly 3 published+active announcements', visible.map((r) => r.category).join(', '))
    } else {
      fail('public RLS visibility', `expected 3 visible, got ${visible.length}`)
    }

    const expiredVisible = visible.some((row) => row.category === 'community')
    if (!expiredVisible) pass('expired published announcement hidden from public RLS')
    else fail('expired visibility', 'community should be hidden')
  }

  const { data: lowered, error: lowerError } = await admin
    .from('metric_thresholds')
    .select('metric_key, min_value, current_value, is_met')
    .eq('metric_key', 'total_candidates')
    .maybeSingle()

  if (!lowerError && lowered) {
    const originalMin = Number(lowered.min_value)
    await admin.from('metric_thresholds').update({ min_value: 0 }).eq('metric_key', 'total_candidates')
    const { data: recalc } = await admin
      .from('metric_thresholds')
      .select('is_met')
      .eq('metric_key', 'total_candidates')
      .single()
    if (recalc?.is_met === true) pass('metric_thresholds.is_met recalculates on min_value change')
    else fail('is_met recalc', String(recalc?.is_met))
    await admin.from('metric_thresholds').update({ min_value: originalMin }).eq('metric_key', 'total_candidates')
  }

  await admin.from('public_announcements').delete().like('title_ar', 'VERIFY-%')
  pass('cleanup VERIFY-* rows')

  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

void main()
