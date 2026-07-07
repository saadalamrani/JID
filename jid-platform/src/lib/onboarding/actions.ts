'use server'

import { redirect } from 'next/navigation'
import { NOTIFICATION_CATEGORIES } from '@/lib/notifications/categories'
import { mergeOnboardingSmartLinks } from '@/lib/onboarding/smart-links'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import {
  onboardingStepOneSchema,
  onboardingStepThreeSchema,
  onboardingStepTwoSchema,
  type OnboardingStepOneValues,
  type OnboardingStepThreeValues,
  type OnboardingStepTwoValues,
} from '@/lib/validations/onboarding'

export type OnboardingActionResult = { ok: true } | { ok: false; error: string }

type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

async function requireUserId(): Promise<{ supabase: SupabaseClient<Database>; userId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('onboarding.errors.notAuthenticated')
  }

  return { supabase, userId: user.id }
}

async function loadSmartLinks(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data } = await asUntyped(supabase)
    .from('profiles')
    .select('smart_links')
    .eq('id', userId)
    .maybeSingle()

  const row = data as { smart_links?: Record<string, unknown> } | null
  return row?.smart_links && typeof row.smart_links === 'object' ? row.smart_links : {}
}

/** Section 10 — mark onboarding skipped and send user to dashboard. */
export async function skipOnboardingAction(): Promise<OnboardingActionResult> {
  const { supabase, userId } = await requireUserId()
  const now = new Date().toISOString()

  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      onboarding_skipped_at: now,
      updated_at: now,
    })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'onboarding.errors.skipFailed' }
  }

  redirect('/dashboard')
}

/** Section 11.1 — basic info (name + phone). */
export async function saveStepOne(
  input: OnboardingStepOneValues,
): Promise<OnboardingActionResult> {
  const parsed = onboardingStepOneSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'onboarding.errors.saveFailed' }
  }

  const { supabase, userId } = await requireUserId()
  const smartLinks = await loadSmartLinks(supabase, userId)
  const now = new Date().toISOString()

  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      smart_links: mergeOnboardingSmartLinks(smartLinks, { current_step: 2 }),
      updated_at: now,
    })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'onboarding.errors.saveFailed' }
  }

  redirect('/individual/step-2')
}

/** Section 11.2 — education (universities_catalog + CV-aligned GPA fields). */
export async function saveStepTwo(
  input: OnboardingStepTwoValues,
): Promise<OnboardingActionResult> {
  const parsed = onboardingStepTwoSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'onboarding.errors.saveFailed' }
  }

  const { supabase, userId } = await requireUserId()
  const smartLinks = await loadSmartLinks(supabase, userId)
  const now = new Date().toISOString()

  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      university_id: parsed.data.university_id,
      graduation_year: parsed.data.graduation_year,
      smart_links: mergeOnboardingSmartLinks(smartLinks, {
        current_step: 3,
        degree: parsed.data.degree,
        gpa_value: parsed.data.gpa_value ?? null,
        gpa_scale: parsed.data.gpa_scale ?? null,
      }),
      updated_at: now,
    })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'onboarding.errors.saveFailed' }
  }

  redirect('/individual/step-3')
}

/** Section 11.3 — career interests (all optional). */
export async function saveStepThree(
  input: OnboardingStepThreeValues,
): Promise<OnboardingActionResult> {
  const parsed = onboardingStepThreeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'onboarding.errors.saveFailed' }
  }

  const { supabase, userId } = await requireUserId()
  const smartLinks = await loadSmartLinks(supabase, userId)
  const now = new Date().toISOString()

  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      target_sectors: parsed.data.target_sectors ?? [],
      smart_links: mergeOnboardingSmartLinks(smartLinks, {
        current_step: 'complete',
        target_job_titles: parsed.data.target_job_titles?.trim() || null,
        salary_min: parsed.data.salary_min ?? null,
        salary_max: parsed.data.salary_max ?? null,
        step_three_saved_at: now,
      }),
      updated_at: now,
    })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'onboarding.errors.saveFailed' }
  }

  redirect('/individual/complete')
}

async function dispatchWelcomeNotification(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const welcomeCategory = 'platform.announcement'

  // TODO(platform.announcement): Day 1 / migration 087 — notification_category_enum
  // lacks `platform.announcement`. Enable dispatch_notification here once the enum is extended.
  if (!(NOTIFICATION_CATEGORIES as readonly string[]).includes(welcomeCategory)) {
    console.info(
      `[onboarding] Skipping welcome notification — category "${welcomeCategory}" is not in NOTIFICATION_CATEGORIES yet.`,
    )
    return
  }

  const { error } = await supabase.rpc('dispatch_notification', {
    p_recipient_id: userId,
    p_category: welcomeCategory,
    p_title_ar: 'مرحباً بك في JID',
    p_title_en: 'Welcome to JID',
    p_body_ar: 'اكتمل إعداد حسابك. ابدأ باستكشاف الفرص والإرشاد على المنصة.',
    p_body_en: 'Your account setup is complete. Start exploring opportunities and mentorship on JID.',
    p_idempotency_key: `onboarding:welcome:${userId}`,
    p_action_url: '/dashboard',
    p_action_label_ar: 'لوحة التحكم',
    p_action_label_en: 'Dashboard',
  })

  if (error) {
    console.warn('[onboarding] Welcome notification dispatch failed:', error.message)
  }
}

/** Section 11.4 — finalize onboarding and route to dashboard. */
export async function markOnboardingComplete(): Promise<OnboardingActionResult> {
  const { supabase, userId } = await requireUserId()
  const now = new Date().toISOString()

  const { error } = await asUntyped(supabase)
    .from('profiles')
    .update({
      onboarding_completed_at: now,
      onboarding_skipped_at: null,
      updated_at: now,
    })
    .eq('id', userId)

  if (error) {
    return { ok: false, error: 'onboarding.errors.completeFailed' }
  }

  await dispatchWelcomeNotification(supabase, userId)
  redirect('/dashboard')
}
