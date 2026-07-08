import { getTranslations } from 'next-intl/server'
import { SectorBarsSection, SkillsBarsSection } from '@/app/[locale]/(public)/pulse/_components/pulse-bars-lazy'
import { fetchSectorDemand, fetchSkillsDemand } from '@/lib/pulse/queries'
import { isDbOfflineError } from '@/lib/supabase/offline-error'

/** Section 6.8 — market trends (sector + skills demand snapshots). */
export async function MarketTrendsSection() {
  try {
    const [sectors, skills] = await Promise.all([fetchSectorDemand(), fetchSkillsDemand()])
    const t = await getTranslations('pulse.trends')

    if (sectors.length === 0 && skills.length === 0) return null

    return (
      <section className="space-y-4" aria-label={t('title')}>
        <h2 className="text-xl font-semibold text-foreground">{t('title')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {sectors.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t('sectorTitle')}</h3>
              <SectorBarsSection items={sectors} />
            </div>
          ) : null}

          {skills.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">{t('skillsTitle')}</h3>
              <SkillsBarsSection items={skills} />
            </div>
          ) : null}
        </div>
      </section>
    )
  } catch (error) {
    if (isDbOfflineError(error)) {
      return null
    }
    throw error
  }
}
