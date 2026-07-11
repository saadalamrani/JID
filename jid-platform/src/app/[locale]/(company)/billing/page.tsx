import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireAuthenticatedUser } from '@/lib/auth/require-authenticated-user'
import { fetchCompanySubscriptionSummary } from '@/lib/monetization/company-subscription-server'
import { createClient } from '@/lib/supabase/server'
import { localeConfig, type Locale } from '@/lib/i18n/config'
import { CompanyBillingClient } from './_components/company-billing-client'

type CompanyBillingPageProps = {
  params: { locale: string }
}

export default async function CompanyBillingPage({ params }: CompanyBillingPageProps) {
  const locale = params.locale as Locale
  const dir = localeConfig.direction[locale] ?? 'rtl'
  const t = await getTranslations('monetization.companyBilling')
  const userId = await requireAuthenticatedUser()
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('claimed_by', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!company) {
    notFound()
  }

  const subscription = await fetchCompanySubscriptionSummary(company.id)

  return (
    <div dir={dir} lang={locale} className="space-y-2">
      <p className="font-arabic text-xs text-muted-foreground">{t('breadcrumb')}</p>
      <CompanyBillingClient subscription={subscription} locale={locale} />
    </div>
  )
}
