import type { OwnershipType } from '@/types/catalog'
import type { ExperienceLevel } from '@/types/job'
import type { MandateMatchCard, MandateMatchReason, SearchMandate } from '@/types/abhathli'

type MandateRow = {
  id: string
  user_id: string
  name: string
  is_active: boolean
  sectors: string[]
  regions: string[]
  ownership_types: OwnershipType[]
  experience_levels: ExperienceLevel[]
  keywords: string[]
  include_lammah: boolean
  digest_frequency: string
  created_at: string
  updated_at: string
  last_run_at: string | null
}

export function mapMandateRow(row: MandateRow): SearchMandate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isActive: row.is_active,
    sectors: row.sectors,
    regions: row.regions,
    ownershipTypes: row.ownership_types,
    experienceLevels: row.experience_levels,
    keywords: row.keywords,
    includeLammah: row.include_lammah,
    digestFrequency: row.digest_frequency === 'daily' ? 'daily' : 'instant',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastRunAt: row.last_run_at,
  }
}

type MatchRow = {
  id: string
  mandate_id: string
  job_id: string | null
  lammah_id: string | null
  score: number
  match_reasons: unknown
  matched_at: string
  seen_at: string | null
  dismissed_at: string | null
  mandate: { name: string } | null
  job: {
    title_ar: string
    title_en: string | null
    slug: string | null
    tier: 'normal' | 'plus' | null
    company: { name_ar: string | null; name_en: string; logo_url: string | null } | null
    sector: { slug: string } | null
    region: { slug: string } | null
  } | null
  lammah: {
    title_ar: string | null
    title_en: string | null
    external_url: string
    company_name_raw: string
    sector: string
    region: string
    company: { logo_url: string | null } | null
  } | null
}

function parseMatchReasons(raw: unknown): MandateMatchReason[] {
  if (!Array.isArray(raw)) return []
  const allowed = new Set<MandateMatchReason>([
    'sector',
    'region',
    'keyword',
    'experience',
    'ownership',
  ])
  return raw
    .map((item) => String(item).split(':')[0] ?? '')
    .filter((item): item is MandateMatchReason => allowed.has(item as MandateMatchReason))
}

export function mapMatchRow(row: MatchRow): MandateMatchCard {
  if (row.job) {
    const company = row.job.company
    return {
      id: row.id,
      mandateId: row.mandate_id,
      mandateName: row.mandate?.name ?? '—',
      jobId: row.job_id,
      lammahId: null,
      score: Number(row.score),
      matchReasons: parseMatchReasons(row.match_reasons),
      matchedAt: row.matched_at,
      seenAt: row.seen_at,
      dismissedAt: row.dismissed_at,
      titleAr: row.job.title_ar,
      titleEn: row.job.title_en,
      companyName: company?.name_ar ?? company?.name_en ?? null,
      companyLogoUrl: company?.logo_url ?? null,
      sectorSlug: row.job.sector?.slug ?? null,
      regionSlug: row.job.region?.slug ?? null,
      tier: row.job.tier ?? 'normal',
      externalUrl: null,
      jobSlug: row.job.slug,
    }
  }

  const lammah = row.lammah
  return {
    id: row.id,
    mandateId: row.mandate_id,
    mandateName: row.mandate?.name ?? '—',
    jobId: null,
    lammahId: row.lammah_id,
    score: Number(row.score),
    matchReasons: parseMatchReasons(row.match_reasons),
    matchedAt: row.matched_at,
    seenAt: row.seen_at,
    dismissedAt: row.dismissed_at,
    titleAr: lammah?.title_ar ?? null,
    titleEn: lammah?.title_en ?? null,
    companyName: lammah?.company_name_raw ?? null,
    companyLogoUrl: lammah?.company?.logo_url ?? null,
    sectorSlug: lammah?.sector ?? null,
    regionSlug: lammah?.region ?? null,
    tier: 'plus',
    externalUrl: lammah?.external_url ?? null,
    jobSlug: null,
  }
}
