import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchCompanySubscriptionSummary } from '@/lib/monetization/company-subscription-server'
import { fetchOwnerBusinessProfile } from '@/lib/profile/owner-business-profile'
import { createClient } from '@/lib/supabase/server'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { CompanyBillingClient } from './_components/company-billing-client'

type CompanyBillingPageProps = {
  params: { locale: string }
}

/** Spec 04-B DEF-07 — bill against owned Profile directory_id (not Directory claim ownership). */
export default async function CompanyBillingPage({ params }: CompanyBillingPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('monetization.companyBilling')
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const businessProfile = await fetchOwnerBusinessProfile(supabase, userId)
  if (!businessProfile) {
    redirect('/company/create-profile')
  }

  if (!businessProfile.directory_id) {
    notFound()
  }

  const subscription = await fetchCompanySubscriptionSummary(businessProfile.directory_id)

  return (
    <div dir={dir} lang={locale} className="space-y-2">
      <p className="font-arabic text-xs text-muted-foreground">{t('breadcrumb')}</p>
      <CompanyBillingClient subscription={subscription} locale={locale} />
    </div>
  )
}
