import { ProfileCreationWizard } from './_components/profile-creation-wizard'
import { getMyApprovedVerifications } from '@/lib/auth/verification'
import { createClient } from '@/lib/supabase/server'
import type { DirectoryReferenceData } from '@/types/business-profile-public'
import type { CatalogRegionRef, CatalogSectorRef, OwnershipType } from '@/types/catalog'
import { redirect } from 'next/navigation'

function mapSector(
  row: { slug: string; name_en: string; name_ar: string | null } | null,
): CatalogSectorRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

function mapRegion(
  row: { slug: string; name_en: string; name_ar: string | null } | null,
): CatalogRegionRef | null {
  if (!row?.slug) return null
  return { slug: row.slug, name_en: row.name_en, name_ar: row.name_ar }
}

export default async function CreateBusinessProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const approved = await getMyApprovedVerifications(supabase)
  const businessApproved = approved.filter((row) => row.verification_type === 'business')

  if (businessApproved.length === 0) {
    redirect('/company/verification-pending')
  }

  const verification = businessApproved[0]!

  if (verification.resulting_profile_id) {
    redirect('/company/dashboard')
  }

  const { data: directoryRaw } = await supabase
    .from('companies')
    .select(
      'id, slug, name, name_ar, logo_url, ownership_type, sector:sectors!sector_id(slug, name_en, name_ar), region:regions!region_id(slug, name_en, name_ar)',
    )
    .eq('id', verification.directory_id)
    .maybeSingle()

  const directoryRow = directoryRaw as {
    id: string
    slug: string | null
    name: string
    name_ar: string | null
    logo_url: string | null
    ownership_type: OwnershipType | null
    sector:
      | { slug: string; name_en: string; name_ar: string | null }
      | { slug: string; name_en: string; name_ar: string | null }[]
      | null
    region:
      | { slug: string; name_en: string; name_ar: string | null }
      | { slug: string; name_en: string; name_ar: string | null }[]
      | null
  } | null

  const sectorEmbed = Array.isArray(directoryRow?.sector)
    ? directoryRow.sector[0]
    : directoryRow?.sector
  const regionEmbed = Array.isArray(directoryRow?.region)
    ? directoryRow.region[0]
    : directoryRow?.region

  const directory: DirectoryReferenceData = {
    id: directoryRow?.id ?? verification.directory_id,
    slug: directoryRow?.slug ?? null,
    name_en: directoryRow?.name ?? verification.company_name,
    name_ar: directoryRow?.name_ar ?? verification.company_name,
    logo_url: directoryRow?.logo_url ?? null,
    ownership_type: directoryRow?.ownership_type ?? null,
    sector: mapSector(sectorEmbed ?? null),
    region: mapRegion(regionEmbed ?? null),
  }

  return (
    <ProfileCreationWizard
      verificationId={verification.id}
      directory={directory}
      suggestedDisplayNameAr={directory.name_ar ?? verification.company_name}
    />
  )
}
