import type { Database } from '@/lib/supabase/types'
import type { LammahOpportunityCard } from '@/types/lammah'

type LammahFeedRow = Pick<
  Database['public']['Tables']['lammah_opportunities']['Row'],
  | 'id'
  | 'source_id'
  | 'company_id'
  | 'company_name_raw'
  | 'title_ar'
  | 'title_en'
  | 'excerpt'
  | 'sector'
  | 'region'
  | 'ownership_type'
  | 'experience_level'
  | 'external_url'
  | 'source_published_at'
  | 'scraped_at'
  | 'expires_at'
  | 'status'
  | 'extraction_confidence'
> & {
  source: { name: string } | null
  company: { logo_url: string | null } | null
}

export function mapLammahRowToCard(row: LammahFeedRow): LammahOpportunityCard {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.source?.name ?? '—',
    companyId: row.company_id,
    companyNameRaw: row.company_name_raw,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    excerpt: row.excerpt,
    sector: row.sector,
    region: row.region,
    ownershipType: row.ownership_type,
    experienceLevel: row.experience_level,
    externalUrl: row.external_url,
    sourcePublishedAt: row.source_published_at,
    scrapedAt: row.scraped_at,
    expiresAt: row.expires_at,
    status: row.status,
    extractionConfidence: Number(row.extraction_confidence),
    companyLogoUrl: row.company?.logo_url ?? null,
  }
}

export function lammahDaysUntilExpiry(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}
