'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'

export type LammahStaffActionResult = { ok: true } | { ok: false; error: string }

function revalidateLammahPaths() {
  revalidatePath('/staff/lammah')
  revalidatePath('/staff/lammah/sources')
  revalidatePath('/opportunities')
}

export async function approveLammahOpportunity(opportunityId: string): Promise<LammahStaffActionResult> {
  const staff = await requireStaffShellAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('lammah_opportunities')
    .update({
      status: 'active',
      hidden_by: null,
      hidden_reason: null,
    })
    .eq('id', opportunityId)
    .eq('status', 'hidden')

  if (error) return { ok: false, error: error.message }

  revalidateLammahPaths()
  return { ok: true }
}

export async function hideLammahOpportunity(input: {
  opportunityId: string
  reason: string
}): Promise<LammahStaffActionResult> {
  const staff = await requireStaffShellAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('lammah_opportunities')
    .update({
      status: 'hidden',
      hidden_by: staff.id,
      hidden_reason: input.reason.trim() || 'staff_hidden',
    })
    .eq('id', input.opportunityId)

  if (error) return { ok: false, error: error.message }

  revalidateLammahPaths()
  return { ok: true }
}

export async function deleteLammahOpportunity(opportunityId: string): Promise<LammahStaffActionResult> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { error } = await supabase.from('lammah_opportunities').delete().eq('id', opportunityId)
  if (error) return { ok: false, error: error.message }

  revalidateLammahPaths()
  return { ok: true }
}

export async function toggleLammahSourceActive(
  sourceId: string,
  isActive: boolean,
): Promise<LammahStaffActionResult> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { error } = await supabase
    .from('lammah_sources')
    .update({ is_active: isActive })
    .eq('id', sourceId)

  if (error) return { ok: false, error: error.message }

  revalidateLammahPaths()
  return { ok: true }
}

export async function createLammahSource(input: {
  name: string
  baseUrl: string
  sourceType: 'career_page' | 'rss' | 'api' | 'official_program'
  trustTier: 1 | 2
  companyId?: string | null
}): Promise<LammahStaffActionResult> {
  const staff = await requireStaffShellAccess()
  const supabase = await createClient()

  const { error } = await supabase.from('lammah_sources').insert({
    name: input.name.trim(),
    base_url: input.baseUrl.trim(),
    source_type: input.sourceType,
    trust_tier: input.trustTier,
    company_id: input.companyId ?? null,
    created_by: staff.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidateLammahPaths()
  return { ok: true }
}
