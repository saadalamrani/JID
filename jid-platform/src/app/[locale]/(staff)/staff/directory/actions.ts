'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import {
  approveCorrectionSuggestion,
  rejectCorrectionSuggestion,
  reinstateProfile,
  suspendProfile,
} from '@/lib/staff/moderation'
import { fetchStaffRegionOptions, fetchStaffSectorOptions } from '@/lib/staff/entities-queries'

export type StaffDirectoryActionResult = { ok: true } | { ok: false; error: string }

const directoryUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  name_ar: z.string().trim().min(1),
  entity_type: z.enum(['company', 'university']),
  ownership_type: z.enum(['government', 'private', 'semi_government']).nullable(),
  sector_id: z.string().uuid().nullable(),
  region_id: z.string().uuid().nullable(),
  domains: z.array(z.string().trim().min(1)).default([]),
  career_portal_url: z.string().trim().optional().nullable(),
  website_url: z.string().trim().optional().nullable(),
  logo_url: z.string().trim().optional().nullable(),
  is_active: z.boolean(),
})

function revalidateDirectoryPaths() {
  revalidatePath('/staff/directory')
  revalidatePath('/staff/directory/suggestions')
  revalidatePath('/staff/directory/profiles')
}

export async function upsertDirectoryRecord(
  input: unknown,
): Promise<StaffDirectoryActionResult> {
  await requireStaffShellAccess()
  const parsed = directoryUpsertSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid directory payload' }
  }

  const payload = parsed.data
  const supabase = await createClient()
  const db = supabase as unknown as SupabaseClient<Record<string, unknown>>
  const row = {
    name: payload.name,
    name_ar: payload.name_ar,
    entity_type: payload.entity_type,
    ownership_type: payload.ownership_type,
    sector_id: payload.sector_id,
    region_id: payload.region_id,
    domains: payload.domains,
    career_portal_url: payload.career_portal_url,
    website_url: payload.website_url,
    logo_url: payload.logo_url,
    is_active: payload.is_active,
    updated_at: new Date().toISOString(),
  }

  if (payload.id) {
    const { error } = await db.from('companies').update(row).eq('id', payload.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const slugBase = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48)
    const { error } = await db.from('companies').insert({
      ...row,
      id: crypto.randomUUID(),
      slug: `${slugBase}-${Date.now().toString(36)}`,
      link_status: 'unknown',
    })
    if (error) return { ok: false, error: error.message }
  }

  revalidateDirectoryPaths()
  return { ok: true }
}

const suggestionReviewSchema = z.object({
  suggestionId: z.string().uuid(),
  reviewNotes: z.string(),
  decision: z.enum(['approved', 'rejected']),
})

export async function reviewCorrectionSuggestion(
  input: unknown,
): Promise<StaffDirectoryActionResult> {
  await requireStaffShellAccess()
  const parsed = suggestionReviewSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid suggestion payload' }
  }

  const supabase = await createClient()
  try {
    if (parsed.data.decision === 'approved') {
      await approveCorrectionSuggestion(supabase, {
        suggestionId: parsed.data.suggestionId,
        reviewNotes: parsed.data.reviewNotes,
      })
    } else {
      await rejectCorrectionSuggestion(supabase, {
        suggestionId: parsed.data.suggestionId,
        reviewNotes: parsed.data.reviewNotes,
      })
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Review failed' }
  }

  revalidateDirectoryPaths()
  return { ok: true }
}

const suspendSchema = z.object({
  profileId: z.string().uuid(),
  profileType: z.enum(['business', 'university']),
  reason: z.string().trim().min(3, 'Reason is required'),
})

export async function suspendProfileAction(
  input: unknown,
): Promise<StaffDirectoryActionResult> {
  await requireStaffShellAccess()
  const parsed = suspendSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid suspend payload' }
  }

  const supabase = await createClient()
  try {
    await suspendProfile(supabase, parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Suspend failed' }
  }

  revalidateDirectoryPaths()
  return { ok: true }
}

const reinstateSchema = z.object({
  profileId: z.string().uuid(),
  profileType: z.enum(['business', 'university']),
  targetStatus: z.enum(['draft', 'published']).default('draft'),
  reason: z.string().trim().optional(),
})

export async function reinstateProfileAction(
  input: unknown,
): Promise<StaffDirectoryActionResult> {
  await requireStaffShellAccess()
  const parsed = reinstateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid reinstate payload' }
  }

  const supabase = await createClient()
  try {
    await reinstateProfile(supabase, parsed.data)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Reinstate failed' }
  }

  revalidateDirectoryPaths()
  return { ok: true }
}

export async function loadDirectoryFormOptions() {
  await requireStaffShellAccess()
  const [sectors, regions] = await Promise.all([
    fetchStaffSectorOptions(),
    fetchStaffRegionOptions(),
  ])
  return { sectors, regions }
}
