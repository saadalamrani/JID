import type { OwnershipType } from '@/types/catalog'
import type { ExperienceLevel } from '@/types/job'

export type SearchMandateDigestFrequency = 'instant' | 'daily'

export type SearchMandate = {
  id: string
  userId: string
  name: string
  isActive: boolean
  sectors: string[]
  regions: string[]
  ownershipTypes: OwnershipType[]
  experienceLevels: ExperienceLevel[]
  keywords: string[]
  includeLammah: boolean
  digestFrequency: SearchMandateDigestFrequency
  createdAt: string
  updatedAt: string
  lastRunAt: string | null
}

export type MandateMatchReason =
  | 'sector'
  | 'region'
  | 'keyword'
  | 'experience'
  | 'ownership'

export type MandateMatchCard = {
  id: string
  mandateId: string
  mandateName: string
  jobId: string | null
  lammahId: string | null
  score: number
  matchReasons: MandateMatchReason[]
  matchedAt: string
  seenAt: string | null
  dismissedAt: string | null
  /** Native job fields when jobId set */
  titleAr: string | null
  titleEn: string | null
  companyName: string | null
  companyLogoUrl: string | null
  sectorSlug: string | null
  regionSlug: string | null
  tier: 'normal' | 'plus'
  externalUrl: string | null
  jobSlug: string | null
}
