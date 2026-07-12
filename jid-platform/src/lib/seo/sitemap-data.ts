import 'server-only'

import { FLAG_KEYS } from '@/lib/feature-flags/keys'
import { isFeatureEnabled } from '@/lib/feature-flags/server'
import { SITEMAP_STATIC_ROUTES } from '@/lib/seo/sitemap-routes'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_JOB_FILTERS, publicStatusToDbStatus } from '@/types/job'

export type SitemapPathEntry = {
  path: string
  lastModified?: Date
}

const SITEMAP_ROW_LIMIT = 10_000

async function getSitemapClient() {
  try {
    return createAdminClient()
  } catch {
    return createClient()
  }
}

export async function fetchConditionalPublicRoutes(): Promise<string[]> {
  const routes: string[] = []

  if (await isFeatureEnabled(FLAG_KEYS.PULSE_PUBLIC)) {
    routes.push('/pulse')
  }

  if (await isFeatureEnabled(FLAG_KEYS.UNIVERSITIES_DISCOVER)) {
    routes.push('/universities')
  }

  return routes
}

/** Active catalog companies with a public slug. */
export async function fetchSitemapCompanies(): Promise<SitemapPathEntry[]> {
  const client = await getSitemapClient()
  const { data, error } = await client
    .from('companies')
    .select('slug, updated_at')
    .eq('is_active', true)
    .eq('entity_type', 'business')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(SITEMAP_ROW_LIMIT)

  if (error || !data) return []

  return data
    .filter((row) => typeof row.slug === 'string' && row.slug.length > 0)
    .map((row) => ({
      path: `/companies/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
    }))
}

/** Published / closing-soon jobs with a future application deadline. */
export async function fetchSitemapJobs(): Promise<SitemapPathEntry[]> {
  const client = await getSitemapClient()
  const statuses = (DEFAULT_JOB_FILTERS.status ?? ['active', 'closing_soon']).map(
    publicStatusToDbStatus,
  )

  const { data, error } = await client
    .from('jobs')
    .select('id, updated_at, published_at')
    .in('status', statuses)
    .gte('application_deadline', new Date().toISOString())
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(SITEMAP_ROW_LIMIT)

  if (error || !data) return []

  return data.map((row) => ({
    path: `/opportunities/${row.id}`,
    lastModified: new Date(row.updated_at ?? row.published_at ?? Date.now()),
  }))
}

/** Approved mentors with a public slug. */
export async function fetchSitemapMentors(): Promise<SitemapPathEntry[]> {
  const client = await getSitemapClient()
  const { data, error } = await client
    .from('mentor_profiles')
    .select('slug, updated_at')
    .eq('status', 'approved')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(SITEMAP_ROW_LIMIT)

  if (error || !data) return []

  return data
    .filter((row) => typeof row.slug === 'string' && row.slug.length > 0)
    .map((row) => ({
      path: `/mentors/${row.slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : undefined,
    }))
}
