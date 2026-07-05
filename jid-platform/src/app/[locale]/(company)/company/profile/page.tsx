import { notFound, redirect } from 'next/navigation'
import { CompanyProfileView } from '@/components/profile/company-profile-view'
import { fetchEntityBadges } from '@/lib/profile/badge-helpers'
import { fetchOwnCompanyPageContext, getCurrentViewer } from '@/lib/profile/queries'
import { createClient } from '@/lib/supabase/server'

export default async function CompanyOwnerProfilePage() {
  const viewer = await getCurrentViewer()
  if (!viewer.companyId) {
    redirect('/login')
  }

  const context = await fetchOwnCompanyPageContext()
  if (!context) {
    notFound()
  }

  const supabase = await createClient()
  const badges = await fetchEntityBadges(supabase, 'company', context.company.id)

  return <CompanyProfileView context={context} badges={badges} isOwner />
}
