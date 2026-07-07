import { CompanyDashboard } from '@/app/[locale]/(company)/_components/company-dashboard'
import { UniversityDashboard } from '@/app/[locale]/(company)/_components/university-dashboard'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { createClient } from '@/lib/supabase/server'

export default async function CompanyDashboardPage() {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('entity_type')
    .eq('claimed_by', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (company?.entity_type === 'university') {
    return <UniversityDashboard />
  }

  return <CompanyDashboard />
}
