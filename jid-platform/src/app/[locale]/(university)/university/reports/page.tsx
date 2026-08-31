import { EmptyUniversityState } from '@/app/[locale]/(company)/_components/empty-university-state'
import { UniversityReportsWorkspace } from '@/app/[locale]/(university)/university/reports/_components/university-reports-workspace'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOwnerUniversityProfile } from '@/lib/profile/owner-university-profile'
import { fetchUniversityOwnerFoundation } from '@/lib/university/wave10-queries'
import {
  fetchUniversityReportHistory,
  previewUniversityReport,
} from '@/lib/university/wave12-queries'
import { createClient } from '@/lib/supabase/server'
import { UNIVERSITY_REPORT_TYPES, type UniversityReportType } from '@/types/contracts/university-reporting'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

type UniversityReportsPageProps = {
  searchParams?: { type?: string; cohort?: string }
}

function parseReportType(value: string | undefined): UniversityReportType {
  if (value && (UNIVERSITY_REPORT_TYPES as readonly string[]).includes(value)) {
    return value as UniversityReportType
  }
  return 'cohort_outcome_summary'
}

export default async function UniversityReportsPage({ searchParams }: UniversityReportsPageProps) {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()
  const universityProfile = await fetchOwnerUniversityProfile(supabase, userId)
  if (!universityProfile) {
    redirect('/university/create-profile')
  }

  const t = await getTranslations('university.reports')
  const foundation = await fetchUniversityOwnerFoundation()
  if (!foundation.mapping_present) {
    return (
      <EmptyUniversityState
        title={t('unmappedTitle')}
        description={t('unmappedDescription')}
        ctaHref="/university/profile"
        ctaLabel={t('unmappedCta')}
      />
    )
  }

  const reportType = parseReportType(searchParams?.type)
  const cohortId = searchParams?.cohort || null
  const preview = await previewUniversityReport({ reportType, cohortId })
  const history = await fetchUniversityReportHistory()

  return (
    <UniversityReportsWorkspace
      preview={preview.ok ? preview : null}
      cohorts={foundation.cohorts ?? []}
      history={history}
      initialType={reportType}
      initialCohortId={cohortId}
    />
  )
}
