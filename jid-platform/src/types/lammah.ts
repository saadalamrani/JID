import type { OwnershipType } from '@/types/catalog'
import type { ExperienceLevel } from '@/types/job'

export const LAMMAH_STATUSES = ['active', 'hidden', 'superseded', 'expired'] as const
export type LammahStatus = (typeof LAMMAH_STATUSES)[number]

export type LammahSourceType = 'career_page' | 'rss' | 'api' | 'official_program'

export type LammahOpportunityCard = {
  id: string
  sourceId: string
  sourceName: string
  companyId: string | null
  companyNameRaw: string
  titleAr: string | null
  titleEn: string | null
  excerpt: string | null
  sector: string
  region: string
  ownershipType: OwnershipType | null
  experienceLevel: ExperienceLevel | null
  externalUrl: string
  sourcePublishedAt: string
  scrapedAt: string
  expiresAt: string
  status: LammahStatus
  extractionConfidence: number
  companyLogoUrl: string | null
}

export type LammahFeedResult = {
  items: LammahOpportunityCard[]
  count: number
  weeklyCount: number
}

export type LammahSource = {
  id: string
  name: string
  companyId: string | null
  baseUrl: string
  sourceType: LammahSourceType
  trustTier: 1 | 2
  isActive: boolean
  robotsOk: boolean
  crawlFrequencyHours: number
  lastCrawledAt: string | null
  consecutiveFailures: number
  createdAt: string
}

export type LammahModerationRow = {
  id: string
  titleAr: string | null
  titleEn: string | null
  companyNameRaw: string
  sector: string
  region: string
  externalUrl: string
  status: LammahStatus
  extractionConfidence: number
  scrapedAt: string
  sourceName: string
}
