'use client'

import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import type { CvExportFormatKey } from '@/lib/cv/formats/registry'

export type CvBuilderPrefs = {
  userId: string
  preferredFormat: CvExportFormatKey
  preferredLanguage: 'en' | 'ar'
  sectionOrder: Json | null
  updatedAt: string
}

const DEFAULT_PREFS: Omit<CvBuilderPrefs, 'userId' | 'updatedAt'> = {
  preferredFormat: 'basic_free',
  preferredLanguage: 'en',
  sectionOrder: null,
}

function mapPrefsRow(row: {
  user_id: string
  preferred_format: string
  preferred_language: string
  section_order: Json | null
  updated_at: string
}): CvBuilderPrefs {
  const format =
    row.preferred_format === 'harvard' ||
    row.preferred_format === 'global_ats' ||
    row.preferred_format === 'basic_free'
      ? row.preferred_format
      : 'basic_free'

  const language = row.preferred_language === 'ar' ? 'ar' : 'en'

  return {
    userId: row.user_id,
    preferredFormat: format,
    preferredLanguage: language,
    sectionOrder: row.section_order,
    updatedAt: row.updated_at,
  }
}

export async function fetchCvBuilderPrefs(): Promise<CvBuilderPrefs | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('cv_builder_prefs')
    .select('user_id, preferred_format, preferred_language, section_order, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return {
      userId: user.id,
      ...DEFAULT_PREFS,
      updatedAt: new Date().toISOString(),
    }
  }

  return mapPrefsRow(data)
}

export async function upsertCvBuilderPrefs(
  patch: Partial<Pick<CvBuilderPrefs, 'preferredFormat' | 'preferredLanguage' | 'sectionOrder'>>,
): Promise<CvBuilderPrefs> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const payload = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
    ...(patch.preferredFormat ? { preferred_format: patch.preferredFormat } : {}),
    ...(patch.preferredLanguage ? { preferred_language: patch.preferredLanguage } : {}),
    ...(patch.sectionOrder !== undefined ? { section_order: patch.sectionOrder } : {}),
  }

  const { data, error } = await supabase
    .from('cv_builder_prefs')
    .upsert(payload, { onConflict: 'user_id' })
    .select('user_id, preferred_format, preferred_language, section_order, updated_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapPrefsRow(data)
}
