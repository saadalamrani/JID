'use client'

import { useLocale } from 'next-intl'
import { CompanyAboutSection } from '@/components/profile/company-about-section'
import { CompanyActiveJobs } from '@/components/profile/company-active-jobs'
import { CompanyHiringProfile } from '@/components/profile/company-hiring-profile'
import { CompanyIdentityHeader } from '@/components/profile/company-identity-header'
import { CompanyPartnerMentors } from '@/components/profile/company-partner-mentors'
import { CompanyTrustSignals } from '@/components/profile/company-trust-signals'
import { OwnerCompanyActions } from '@/components/profile/owner-company-actions'
import { UnclaimedCTA } from '@/components/profile/unclaimed-cta'
import type { CompanyPageContext } from '@/lib/profile/types'
import type { EarnedEntityBadge } from '@/lib/profile/types'

type CompanyProfileViewProps = {
  context: CompanyPageContext
  badges: EarnedEntityBadge[]
  isOwner: boolean
}

export function CompanyProfileView({ context, badges, isOwner }: CompanyProfileViewProps) {
  const locale = useLocale()
  const { company, activeJobsCount } = context
  const tagline =
    locale === 'ar' && company.tagline_ar ? company.tagline_ar : company.tagline_en ?? company.tagline_ar
  const isUnclaimed = company.entity_state === 'unclaimed'

  return (
    <main className="container-jid space-y-6 py-8">
      <CompanyIdentityHeader
        isOwner={isOwner}
        name={company.name}
        nameAr={company.name_ar}
        tagline={tagline}
        isVerified={company.is_verified}
        foundedYear={company.founded_year}
        employeeCountRange={company.employee_count_range}
        entityState={company.entity_state}
        editHref={isOwner ? '/company/profile/edit' : undefined}
      />

      <CompanyTrustSignals badges={badges} isOnHonorRoll={company.is_on_honor_roll} />

      {isUnclaimed ? <UnclaimedCTA companyId={company.id} /> : null}

      <CompanyAboutSection company={company} />
      <CompanyActiveJobs
        companyId={company.id}
        activeJobsCount={activeJobsCount}
        totalPosted12mo={company.total_jobs_posted_12mo}
      />
      <CompanyHiringProfile company={company} />
      <CompanyPartnerMentors companyId={company.id} />

      {isOwner ? <OwnerCompanyActions /> : null}
    </main>
  )
}
