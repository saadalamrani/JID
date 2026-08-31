import { getTranslations } from 'next-intl/server'
import { requireStaffShellAccess } from '@/lib/staff/require-staff-access'
import { COMMERCIAL_PACKAGES } from '@/lib/commercial/contracts'
import { StaffBillingActivationForm } from './_components/staff-billing-activation-form'

export default async function StaffBillingPage() {
  await requireStaffShellAccess()
  const t = await getTranslations('monetization.staffBilling')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t('priceNotAdopted')}</p>
      </header>

      <StaffBillingActivationForm />

      <section className="rounded-xl border border-border bg-card p-5" data-testid="staff-package-ledger">
        <h2 className="font-arabic text-base font-semibold text-foreground">{t('catalogTitle')}</h2>
        <ul className="mt-4 space-y-3">
          {COMMERCIAL_PACKAGES.map((item) => (
            <li key={item.key} className="rounded-lg border border-border px-3 py-2">
              <p className="font-arabic text-sm font-medium text-foreground">
                {item.nameAr} / {item.nameEn}
              </p>
              <p className="mt-1 font-latin text-xs text-muted-foreground">
                {item.key} · {item.actor} · {item.kind} · {item.priceAdoptionStatus}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 font-arabic text-xs leading-relaxed text-muted-foreground">
        {t('auditNote')}
      </p>
    </div>
  )
}
