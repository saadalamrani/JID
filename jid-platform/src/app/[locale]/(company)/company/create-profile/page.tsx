import { ProfileCreationWizard } from './_components/profile-creation-wizard'
import { ApprovedWithoutProfileNotice } from '@/components/entity/approved-without-profile-notice'
import { resolveBusinessCreateProfileGate } from '@/lib/entity/business-create-profile-gate'
import { getLatestVerificationForUser } from '@/lib/entity/claims'
import {
  fetchOwnerBusinessProfileRow,
} from '@/lib/profile/owner-business-profile'
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

/**
 * Spec 04-B DEF-03 / DEF-04 / DEF-05 —
 * Profile-first gate; Spec §8 outcome when no Profile; orphaned resulting_profile_id stays on wizard.
 */
export default async function CreateBusinessProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profileRow = await fetchOwnerBusinessProfileRow(supabase, user.id)
  const verification = await getLatestVerificationForUser(supabase, user.id, 'business')

  const gate = resolveBusinessCreateProfileGate({
    profile: profileRow ? { status: profileRow.status } : null,
    verification: verification
      ? {
          status: verification.status,
          resulting_profile_id: verification.resulting_profile_id,
        }
      : null,
  })

  if (gate.action === 'redirect') {
    redirect(gate.path)
  }

  if (!verification || verification.status !== 'approved' || !verification.directory_id) {
    redirect('/signup/entity-type')
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ApprovedWithoutProfileNotice actor="business" />
      <ProfileCreationWizard
        verificationId={verification.id}
        directory={directory}
        suggestedDisplayNameAr={directory.name_ar ?? verification.company_name}
      />
    </div>
  )
}
