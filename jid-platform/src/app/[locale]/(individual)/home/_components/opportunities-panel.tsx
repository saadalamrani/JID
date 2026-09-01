import { getTranslations } from 'next-intl/server'
import { Link } from '@/lib/i18n/navigation'
import type { IndividualHomeModel } from '@/lib/individual-home/get-individual-home-model'

type OpportunitiesPanelProps = {
  model: IndividualHomeModel
}

/**
 * D1 R2, section 5 — "opportunities for me". Shows the latest genuinely open
 * opportunities (real `fetchJobs` data, neutral chronological order — no boosted
 * ranking) rather than a fabricated match score (Article 4). The Lammah/Plus
 * boundary appears here, contextually, capability first and tier second (A8 /
 * R1-B calibration example 23) — never a persistent upgrade banner.
 */
export async function OpportunitiesPanel({ model }: OpportunitiesPanelProps) {
  const t = await getTranslations('individualHome.opportunities')

  return (
    <section aria-labelledby="opportunities-title">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 id="opportunities-title" className="text-base font-semibold text-foreground">
            {t('title')}
          </h2>
          <p className="text-foreground/60 text-sm">{t('subtitle')}</p>
        </div>
        <Link
          href="/opportunities"
          className="shrink-0 text-sm font-medium text-jid-olive hover:text-jid-gold"
        >
          {t('viewAll')}
        </Link>
      </div>

      {model.opportunities.length === 0 ? (
        <p className="text-foreground/60 mt-3 text-sm">{t('empty')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {model.opportunities.map((job) => {
            const title = model.locale === 'en' ? (job.title_en ?? job.title_ar) : job.title_ar
            const companyName =
              model.locale === 'en'
                ? (job.company.name_en ?? job.company.name_ar)
                : (job.company.name_ar ?? job.company.name_en)
            return (
              <li key={job.id}>
                <Link
                  href={`/opportunities/${job.slug ?? job.id}`}
                  className="flex flex-col gap-1 py-3 hover:bg-surface"
                >
                  <span className="text-sm font-medium text-foreground">{title}</span>
                  <span className="text-foreground/60 text-xs">
                    {companyName}
                    {job.is_remote ? ` · ${t('remote')}` : job.city ? ` · ${job.city}` : ''}
                    {' · '}
                    {t('deadlineDays', { days: Math.max(job.deadlineDaysLeft, 0) })}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-foreground/55 mt-3 text-xs leading-relaxed">
        {t('lammahNote')}{' '}
        <Link
          href="/opportunities"
          className="font-medium text-jid-olive underline underline-offset-4 hover:text-jid-gold"
        >
          {t('lammahCta')}
        </Link>
      </p>
    </section>
  )
}
