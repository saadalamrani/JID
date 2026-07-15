import { UniversityDashboard } from '@/app/[locale]/(company)/_components/university-dashboard'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'

export default async function UniversityDashboardPage() {
  await requireAuthenticatedUser()
  return <UniversityDashboard />
}
