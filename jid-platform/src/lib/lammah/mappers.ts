import type { OwnershipType } from '@/types/catalog'
import type { ExperienceLevel } from '@/types/job'
import type {
  LammahOpportunityCard,
  LammahOpportunityType,
  LammahStatus,
} from '@/types/lammah'

export type LammahFeedRow = {
  id: string
  source_id: string
  source_name: string
  company_id: string | null
  company_name_raw: string
  title_ar: string | null
  title_en: string | null
  excerpt: string | null
  sector: string | null
  region: string | null
  location_country: string | null
  location_city: string | null
  ownership_type: OwnershipType | null
  experience_level: ExperienceLevel | null
  opportunity_type: LammahOpportunityType
  external_url: string
  source_published_at: string | null
  scraped_at: string
  first_retrieved_at: string
  expires_at: string | null
  last_confirmed_at: string
  status: LammahStatus
  extraction_confidence: number
  company: { logo_url: string | null } | null
}

export function mapLammahRowToCard(row: LammahFeedRow): LammahOpportunityCard {
  return {
    id: row.id,
    sourceId: row.source_id,
    sourceName: row.source_name,
    companyId: row.company_id,
    companyNameRaw: row.company_name_raw,
    titleAr: row.title_ar,
    titleEn: row.title_en,
    excerpt: row.excerpt,
    sector: row.sector,
    region: row.region,
    locationCountry: row.location_country,
    locationCity: row.location_city,
    ownershipType: row.ownership_type,
    experienceLevel: row.experience_level,
    opportunityType: row.opportunity_type,
    externalUrl: row.external_url,
    sourcePublishedAt: row.source_published_at,
    scrapedAt: row.scraped_at,
    expiresAt: row.expires_at,
    lastConfirmedAt: row.last_confirmed_at,
    status: row.status,
    extractionConfidence: Number(row.extraction_confidence),
    companyLogoUrl: row.company?.logo_url ?? null,
  }
}
