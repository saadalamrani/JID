import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import type { LammahModerationRow, LammahSource, LammahStatus } from '@/types/lammah'

export async function fetchStaffLammahModerationQueue(): Promise<LammahModerationRow[]> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lammah_opportunities')
    .select(
      'id, title_ar, title_en, company_name_raw, sector, region, external_url, status, extraction_confidence, scraped_at, source:lammah_sources(name)',
    )
    .eq('status', 'hidden')
    .order('extraction_confidence', { ascending: true })
    .order('scraped_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    companyNameRaw: row.company_name_raw,
    sector: row.sector,
    region: row.region,
    externalUrl: row.external_url,
    status: row.status as LammahStatus,
    extractionConfidence: Number(row.extraction_confidence),
    scrapedAt: row.scraped_at,
    sourceName: (row.source as { name: string } | null)?.name ?? '—',
  }))
}

export async function fetchStaffLammahSources(): Promise<LammahSource[]> {
  await requireStaffShellAccess()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lammah_sources')
    .select(
      'id, name, company_id, base_url, source_type, trust_tier, is_active, robots_ok, crawl_frequency_hours, last_crawled_at, consecutive_failures, created_at',
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    companyId: row.company_id,
    baseUrl: row.base_url,
    sourceType: row.source_type as LammahSource['sourceType'],
    trustTier: row.trust_tier as 1 | 2,
    isActive: row.is_active,
    robotsOk: row.robots_ok,
    crawlFrequencyHours: row.crawl_frequency_hours,
    lastCrawledAt: row.last_crawled_at,
    consecutiveFailures: row.consecutive_failures,
    createdAt: row.created_at,
  }))
}

export async function fetchStaffLammahHiddenCount(): Promise<number> {
  await requireStaffShellAccess()
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('lammah_opportunities')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'hidden')
  if (error) return 0
  return count ?? 0
}
