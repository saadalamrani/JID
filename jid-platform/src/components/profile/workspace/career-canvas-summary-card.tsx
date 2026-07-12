import { getTranslations } from 'next-intl/server'
import { Compass } from 'lucide-react'
import type { IndividualProfileCanvasSummary } from '@/lib/profile/individual-projection-types'

type CareerCanvasSummaryCardProps = {
  canvas: IndividualProfileCanvasSummary
}

export async function CareerCanvasSummaryCard({ canvas }: CareerCanvasSummaryCardProps) {
  const t = await getTranslations('profile.workspace.canvas')

  return (
    <section id="profile-section-canvas" className="scroll-mt-24">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{t('title')}</h2>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        {!canvas.direction && !canvas.aspiration && canvas.highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('unavailable')}</p>
        ) : (
          <div className="space-y-3">
            {canvas.direction ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('direction')}</p>
                <p className="text-sm text-foreground">{canvas.direction}</p>
              </div>
            ) : null}
            {canvas.aspiration ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('aspiration')}</p>
                <p className="text-sm text-foreground">{canvas.aspiration}</p>
              </div>
            ) : null}
            {canvas.highlights.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">{t('highlights')}</p>
                <div className="flex flex-wrap gap-2">
                  {canvas.highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {canvas.direction || canvas.aspiration || canvas.highlights.length > 0 ? (
          !canvas.available ? (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Compass className="h-3.5 w-3.5" aria-hidden />
              {t('fullCanvasTodo')}
            </p>
          ) : null
        ) : null}
      </div>
    </section>
  )
}
