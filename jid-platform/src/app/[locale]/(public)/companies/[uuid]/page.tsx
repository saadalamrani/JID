import { notFound } from 'next/navigation'
import { CompanyProfileView } from '@/components/profile/company-profile-view'
import { fetchEntityBadges } from '@/lib/profile/badge-helpers'
import { fetchCompanyPageContext, getCurrentViewer } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

type CompanyProfilePageProps = {
  params: { uuid: string }
}

function shouldHideUniversityFromPublic(
  entityType: string,
  isAdmin: boolean,
): boolean {
  return entityType === 'university' && !isAdmin
}

export default async function CompanyProfilePage({ params }: CompanyProfilePageProps) {
  const { uuid } = params
  const viewer = await getCurrentViewer()
  const context = await fetchCompanyPageContext(uuid)

  if (!context) {
    notFound()
  }

  const { company } = context

  if (company.entity_state === 'suspended') {
    notFound()
  }

  if (shouldHideUniversityFromPublic(company.entity_type, viewer.isAdmin)) {
    notFound()
  }

  const isOwner = viewer.companyId !== null && viewer.companyId === company.id

  const supabase = await createClient()
  const badges = await fetchEntityBadges(supabase, 'company', company.id)

  return <CompanyProfileView context={context} badges={badges} isOwner={isOwner} />
}

export async function generateMetadata({ params }: CompanyProfilePageProps) {
  const viewer = await getCurrentViewer()
  const context = await fetchCompanyPageContext(params.uuid)

  if (!context) {
    return { title: 'Company' }
  }

  const { company } = context
  if (company.entity_state === 'suspended') {
    return { title: 'Company' }
  }
  if (shouldHideUniversityFromPublic(company.entity_type, viewer.isAdmin)) {
    return { title: 'Company' }
  }

  return {
    title: company.name_ar ?? company.name,
  }
}
