import { notFound, redirect } from 'next/navigation'
import { CompanyProfileEditForm } from '@/components/profile/forms/company-profile-edit-form'
import { fetchCompany, getCurrentViewer } from '@/lib/profile/queries'

export default async function CompanyProfileEditPage() {
  const viewer = await getCurrentViewer()
  if (!viewer.companyId) {
    redirect('/login')
  }

  const company = await fetchCompany(viewer.companyId)
  if (!company) {
    notFound()
  }

  return <CompanyProfileEditForm company={company} />
}
