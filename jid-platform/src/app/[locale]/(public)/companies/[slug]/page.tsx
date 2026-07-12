import { notFound } from 'next/navigation'
import { CompanyProfileView } from '@/components/profile/company-profile-view'
import { fetchEntityBadges } from '@/lib/profile/badge-helpers'
import { fetchCompanyPageContext, getCurrentViewer } from '@/lib/profile/queries'
import { fetchCompanyBySlug } from '@/lib/queries/catalog'
import { createClient } from '@/lib/supabase/server'

type CompanyProfilePageProps = {
  params: { slug: string }
}

function shouldHideUniversityFromPublic(
  entityType: string,
  isAdmin: boolean,
): boolean {
  return entityType === 'university' && !isAdmin
}

async function resolveCompanyId(ref: string): Promise<string | null> {
  const bySlug = await fetchCompanyBySlug(ref)
  if (bySlug?.id) return bySlug.id

  const context = await fetchCompanyPageContext(ref)
  return context?.company.id ?? null
}

export default async function CompanyProfilePage({ params }: CompanyProfilePageProps) {
  const companyId = await resolveCompanyId(params.slug)
  if (!companyId) {
    notFound()
  }

  const viewer = await getCurrentViewer()
  const context = await fetchCompanyPageContext(companyId)

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
  const companyId = await resolveCompanyId(params.slug)
  if (!companyId) {
    return { title: 'Company' }
  }

  const context = await fetchCompanyPageContext(companyId)

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
