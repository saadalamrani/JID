import { getTranslations } from 'next-intl/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { StaffBillingActivationForm } from './_components/staff-billing-activation-form'

export default async function StaffBillingPage() {
  await requireStaffShellAccess()
  const t = await getTranslations('monetization.staffBilling')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <StaffBillingActivationForm />

      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 font-arabic text-xs leading-relaxed text-muted-foreground">
        {t('auditNote')}
      </p>
    </div>
  )
}
