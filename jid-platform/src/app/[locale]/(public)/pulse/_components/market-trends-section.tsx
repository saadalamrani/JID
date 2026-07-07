import { getTranslations } from 'next-intl/server'
import { SectorBars } from '@/app/[locale]/(public)/pulse/_components/sector-bars'
import { SkillsBars } from '@/app/[locale]/(public)/pulse/_components/skills-bars'
import { fetchSectorDemand, fetchSkillsDemand } from '@/lib/pulse/queries'

/** Section 6.8 — market trends (sector + skills demand snapshots). */
export async function MarketTrendsSection() {
  const [sectors, skills] = await Promise.all([fetchSectorDemand(), fetchSkillsDemand()])
  const t = await getTranslations('pulse.trends')

  if (sectors.length === 0 && skills.length === 0) return null

  return (
    <section className="space-y-4" aria-label={t('title')}>
      <h2 className="text-xl font-semibold text-jid-ink">{t('title')}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {sectors.length > 0 ? (
          <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-jid-ink">{t('sectorTitle')}</h3>
            <SectorBars items={sectors} />
          </div>
        ) : null}

        {skills.length > 0 ? (
          <div className="rounded-xl border border-jid-line bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-jid-ink">{t('skillsTitle')}</h3>
            <SkillsBars items={skills} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
