import { EmptyUniversityState } from '@/app/[locale]/(company)/_components/empty-university-state'
import { PackageCatalog } from '@/components/commercial/package-catalog'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchOwnerUniversityProfile } from '@/lib/profile/owner-university-profile'
import { fetchUniversityOwnerFoundation } from '@/lib/university/wave10-queries'
import { fetchCompanySubscriptionSummary } from '@/lib/monetization/company-subscription-server'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

export default async function UniversityPackagingPage() {
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()
  const universityProfile = await fetchOwnerUniversityProfile(supabase, userId)
  if (!universityProfile) {
    redirect('/university/create-profile')
  }

  const t = await getTranslations('university.packaging')
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

  const directoryId = universityProfile.directory_id
  const subscription = directoryId ? await fetchCompanySubscriptionSummary(directoryId) : null

  return (
    <div className="space-y-6" data-testid="university-packaging">
      <header className="rounded-2xl border border-border bg-background p-5">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-foreground/65 mt-2 max-w-2xl text-sm leading-relaxed">{t('intro')}</p>
      </header>
      <PackageCatalog actor="university" currentPlanKey={subscription?.planKey ?? null} />
    </div>
  )
}
