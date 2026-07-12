import type { CatalogRegionRef, CatalogSectorRef, OwnershipType } from '@/types/catalog'
import type { BusinessProfileDraft } from '@/lib/validations/business-profile'
import type { JobCardData } from '@/types/job'

export type BusinessProfileData = {
  id: string
  directory_id: string
  display_name_ar: string
  display_name_en: string | null
  tagline_ar: string | null
  about_ar: string | null
  about_en: string | null
  founded_year: number | null
  employee_count_range: string | null
  cover_image_url: string | null
  gallery: BusinessProfileGalleryItem[]
  verified_badge: boolean
}

export type BusinessProfileGalleryItem = {
  url: string
  caption?: string
}

export type DirectoryReferenceData = {
  id: string
  slug: string | null
  name_en: string
  name_ar: string | null
  logo_url: string | null
  ownership_type: OwnershipType | null
  sector: CatalogSectorRef | null
  region: CatalogRegionRef | null
}

export type BusinessProfileViewProps = {
  profile: BusinessProfileData
  directory: DirectoryReferenceData
  openings: JobCardData[]
  mode: 'public' | 'preview'
}

export function parseBusinessProfileGallery(raw: unknown): BusinessProfileGalleryItem[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    if (typeof item === 'string' && item.trim()) {
      return [{ url: item }]
    }
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      if (typeof record.url === 'string' && record.url.trim()) {
        return [
          {
            url: record.url,
            caption: typeof record.caption === 'string' ? record.caption : undefined,
          },
        ]
      }
    }
    return []
  })
}

export function draftToBusinessProfileData(
  draft: BusinessProfileDraft,
  options?: { id?: string; directoryId?: string },
): BusinessProfileData {
  return {
    id: options?.id ?? 'preview',
    directory_id: options?.directoryId ?? 'preview',
    display_name_ar: draft.display_name_ar.trim(),
    display_name_en: draft.display_name_en?.trim() || null,
    tagline_ar: draft.tagline_ar?.trim() || null,
    about_ar: draft.about_ar?.trim() || null,
    about_en: draft.about_en?.trim() || null,
    founded_year: draft.founded_year ?? null,
    employee_count_range: draft.employee_count_range ?? null,
    cover_image_url: draft.cover_image_url?.trim() || null,
    gallery: [],
    verified_badge: true,
  }
}

export function truncateForMeta(text: string | null | undefined, max = 160): string | undefined {
  const trimmed = text?.trim()
  if (!trimmed) return undefined
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1).trim()}…`
}
