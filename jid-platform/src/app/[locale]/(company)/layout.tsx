import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { StandardCompanyLayout } from './_components/standard-company-layout'
import { UniversityLayout } from './_components/university-layout'

type CompanyGroupLayoutProps = {
  children: ReactNode
}

export default async function CompanyGroupLayout({ children }: CompanyGroupLayoutProps) {
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
    return <UniversityLayout>{children}</UniversityLayout>
  }

  return <StandardCompanyLayout>{children}</StandardCompanyLayout>
}
