import { getTranslations } from 'next-intl/server'
import { StaffUniversityFoundationPanel } from './_components/staff-university-foundation-panel'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import {
  fetchStaffAffiliationReviewQueue,
  fetchStaffUniversityMappings,
} from '@/lib/university/wave10-queries'

export default async function StaffUniversitiesPage() {
  await requireStaffShellAccess()
  const [t, mappings, reviewQueue] = await Promise.all([
    getTranslations('staff.universityFoundation'),
    fetchStaffUniversityMappings(),
    fetchStaffAffiliationReviewQueue(),
  ])

  return (
    <div className="space-y-6">
      <p className="sr-only">{t('title')}</p>
      <StaffUniversityFoundationPanel mappings={mappings} reviewQueue={reviewQueue} />
    </div>
  )
}
