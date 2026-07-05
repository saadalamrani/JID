'use client'

import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

type CompanyPartnerMentorsProps = {
  companyId: string
}

/**
 * Placeholder — partner mentor roster ships with the Mentorship module.
 */
export function CompanyPartnerMentors({ companyId }: CompanyPartnerMentorsProps) {
  const t = useTranslations('profile.company.public')

  return (
    <section className="rounded-xl border border-jid-line bg-white p-5 shadow-sm" data-company-id={companyId}>
      <h2 className="mb-3 text-sm font-medium text-jid-ink/70">{t('partnerMentorsTitle')}</h2>
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-jid-line bg-jid-beige/20 p-4">
        <Users className="h-6 w-6 shrink-0 text-jid-olive" aria-hidden />
        <div>
          <p className="text-sm text-jid-ink/70">{t('partnerMentorsEmpty')}</p>
          <p className="mt-2 text-xs text-jid-ink/40">
            {/* TODO: Mentorship — partner mentors for company {companyId} */}
            {t('partnerMentorsTodo')}
          </p>
        </div>
      </div>
    </section>
  )
}
