import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { EarnedEntityBadge, EarnedUserBadge } from './types'

/** Until `pnpm gen-types` includes unified profile tables. */
type UntypedClient = SupabaseClient<Record<string, unknown>>

function asUntyped(supabase: SupabaseClient<Database>): UntypedClient {
  return supabase as unknown as UntypedClient
}

type BadgeCatalogRow = {
  id: string
  slug: string
  category: string
  name_ar: string
  name_en: string
  description_ar: string | null
  description_en: string | null
  icon_key: string | null
}

function mapCatalogMeta(row: BadgeCatalogRow) {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    name_ar: row.name_ar,
    name_en: row.name_en,
    description_ar: row.description_ar,
    description_en: row.description_en,
    icon_key: row.icon_key,
  }
}

export async function fetchUserBadges(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<EarnedUserBadge[]> {
  const client = asUntyped(supabase)
  const { data, error } = await client
    .from('user_badges')
    .select(
      'awarded_at, metadata, badges_catalog (id, slug, category, name_ar, name_en, description_ar, description_en, icon_key)',
    )
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((row) => {
      const record = row as unknown as {
        awarded_at: string
        metadata: Record<string, unknown> | null
        badges_catalog: BadgeCatalogRow | null
      }
      const catalog = record.badges_catalog
      if (!catalog) return null
      return {
        ...mapCatalogMeta(catalog),
        awarded_at: record.awarded_at,
        metadata: record.metadata ?? {},
      }
    })
    .filter((row): row is EarnedUserBadge => row !== null)
}

export async function fetchEntityBadges(
  supabase: SupabaseClient<Database>,
  entityType: 'company' | 'university',
  entityId: string,
): Promise<EarnedEntityBadge[]> {
  const client = asUntyped(supabase)
  const { data, error } = await client
    .from('entity_badges')
    .select(
      'awarded_at, expires_at, metadata, badges_catalog (id, slug, category, name_ar, name_en, description_ar, description_en, icon_key)',
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('awarded_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((row) => {
      const record = row as unknown as {
        awarded_at: string
        expires_at: string | null
        metadata: Record<string, unknown> | null
        badges_catalog: BadgeCatalogRow | null
      }
      const catalog = record.badges_catalog
      if (!catalog) return null
      return {
        ...mapCatalogMeta(catalog),
        awarded_at: record.awarded_at,
        expires_at: record.expires_at,
        metadata: record.metadata ?? {},
      }
    })
    .filter((row): row is EarnedEntityBadge => row !== null)
}
