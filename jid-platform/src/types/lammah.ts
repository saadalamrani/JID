import type { OwnershipType } from '@/types/catalog'
import type { ExperienceLevel } from '@/types/job'

export const LAMMAH_STATUSES = ['active', 'hidden', 'superseded', 'expired'] as const
export type LammahStatus = (typeof LAMMAH_STATUSES)[number]

export const LAMMAH_OPPORTUNITY_TYPES = [
  'job',
  'co_op',
  'internship',
  'fellowship',
  'scholarship',
] as const
export type LammahOpportunityType = (typeof LAMMAH_OPPORTUNITY_TYPES)[number]

export type LammahOpportunityCard = {
  id: string
  sourceId: string
  sourceName: string
  companyId: string | null
  companyNameRaw: string
  titleAr: string | null
  titleEn: string | null
  excerpt: string | null
  sector: string | null
  region: string | null
  locationCountry: string | null
  locationCity: string | null
  ownershipType: OwnershipType | null
  experienceLevel: ExperienceLevel | null
  opportunityType: LammahOpportunityType
  externalUrl: string
  sourcePublishedAt: string | null
  scrapedAt: string
  expiresAt: string | null
  lastConfirmedAt: string
  status: LammahStatus
  extractionConfidence: number
  companyLogoUrl: string | null
}

export type LammahFeedResult = {
  items: LammahOpportunityCard[]
  count: number
}

export type LammahPageState = {
  entitled: boolean
  available: boolean
  data: LammahFeedResult
}
