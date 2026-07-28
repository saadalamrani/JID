import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import { StandardCompanyLayout } from './_components/standard-company-layout'
import { UniversityLayout } from './_components/university-layout'

type CompanyGroupLayoutProps = {
  children: ReactNode
}

/** Spec 04-B DEF-02 — layout from owned Profile rows only (no Directory claim ownership). */
export default async function CompanyGroupLayout({ children }: CompanyGroupLayoutProps) {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const businessProfile = await fetchOwnerBusinessProfile(supabase, userId)
  if (businessProfile) {
    return <StandardCompanyLayout>{children}</StandardCompanyLayout>
  }

  const { data: universityProfile } = await supabase
    .from('university_profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .neq('status', 'suspended')
    .maybeSingle()

  if (universityProfile) {
    return <UniversityLayout>{children}</UniversityLayout>
  }

  return <StandardCompanyLayout>{children}</StandardCompanyLayout>
}
