import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import type { IndividualHomeModel } from '@/lib/individual-home/get-individual-home-model'

type ApplicationsPanelProps = {
  model: IndividualHomeModel
}

/**
 * D1 R2, section 6 — "my applications". Plain, fixed-state status list (متقدم
 * view — R1-C §3.1): tracks acts *on* opportunities, distinct from discovering
 * them. Empty state matches the approved R1-B §9 shape exactly.
 */
export async function ApplicationsPanel({ model }: ApplicationsPanelProps) {
  const [t, tStatus] = await Promise.all([
    getTranslations('individualHome.applications'),
    getTranslations('landing.hero.cards.applicationStatus'),
  ])

  return (
    <section aria-labelledby="applications-title">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="applications-title" className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
        {model.applications.length > 0 ? (
          <Link
            href="/radar"
            className="shrink-0 text-sm font-medium text-jid-olive hover:text-jid-gold"
          >
            {t('viewAll')}
          </Link>
        ) : null}
      </div>

      {model.applications.length === 0 ? (
        <p className="text-foreground/60 mt-2 text-sm">{t('empty')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {model.applications.map((application) => (
            <li key={application.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {application.jobTitle}
                </p>
                {application.companyName ? (
                  <p className="text-foreground/55 truncate text-xs">{application.companyName}</p>
                ) : null}
              </div>
              <Link
                href={application.href}
                className="text-foreground/75 shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-jid-olive hover:text-jid-olive"
              >
                {tStatus(application.status)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
